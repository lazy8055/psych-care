# app.py
from flask import Flask, jsonify, request
import requests
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, create_refresh_token
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta, UTC
import os
from dotenv import load_dotenv
import boto3
from boto3.exceptions import Boto3Error
import uuid
import logging
from bson import ObjectId
import ffmpeg
from bson import ObjectId
from deepface import DeepFace
from datetime import datetime
import assemblyai as aai
import google.generativeai as genai
from fpdf import FPDF
import tempfile
import matplotlib.pyplot as plt
from fpdf.enums import XPos, YPos
import numpy as np
import shutil
import pandas as pd

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configuration
app.config['MONGO_URI'] = os.getenv('MONGO_URI')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=7)
app.config['AWS_ACCESS_KEY_ID'] = os.getenv('AWS_ACCESS_KEY_ID')
app.config['AWS_SECRET_ACCESS_KEY'] = os.getenv('AWS_SECRET_ACCESS_KEY')
app.config['AWS_REGION'] = os.getenv('AWS_REGION')
app.config['S3_BUCKET'] = os.getenv('S3_BUCKET')
app.config['GEMINI_API_KEY'] = os.getenv('GEMINI_API_KEY')

# Initialize extensions
mongo = PyMongo(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# Initialize S3 client
s3 = boto3.client(
    's3',
    aws_access_key_id=app.config['AWS_ACCESS_KEY_ID'],
    aws_secret_access_key=app.config['AWS_SECRET_ACCESS_KEY'],
    region_name=app.config['AWS_REGION']
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Helper functions
ASSEMBLYAI_API_KEY = "ce520367185e4314b6a4a3b31293d09c"
aai.settings.api_key = ASSEMBLYAI_API_KEY

# AssemblyAI constants
TRANSCRIPT_ENDPOINT = "https://api.assemblyai.com/v2/transcript"
UPLOAD_ENDPOINT = "https://api.assemblyai.com/v2/upload"

HEADERS = {
    "authorization": ASSEMBLYAI_API_KEY,
    "content-type": "application/json"
}

def format_time(ms):
    seconds = ms / 1000
    minutes = int(seconds // 60)
    seconds = int(seconds % 60)
    return f"{minutes}:{seconds:02d}"

def extract_audio(video_path, audio_path):
    ffmpeg.input(video_path).output(audio_path, format="mp3", acodec="mp3").run(overwrite_output=True)

def upload_audio(file_path):
    with open(file_path, "rb") as f:
        response = requests.post(UPLOAD_ENDPOINT, headers={"authorization": ASSEMBLYAI_API_KEY}, files={"file": f})
        return response.json()["upload_url"]

def transcribe_audio(audio_url):
    data = {
        "audio_url": audio_url,
        "speaker_labels": True,
        "sentiment_analysis": True
    }
    response = requests.post(TRANSCRIPT_ENDPOINT, json=data, headers=HEADERS)
    transcript_id = response.json()["id"]

    polling_endpoint = f"{TRANSCRIPT_ENDPOINT}/{transcript_id}"
    status = "submitted"
    while status != "completed":
        poll_response = requests.get(polling_endpoint, headers=HEADERS).json()
        status = poll_response["status"]

    return poll_response

def generate_pdf(report_text):
    """
    Generates PDF content in memory and returns bytes
    """
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("helvetica", size=12)  # Use core font

    # Add title
    pdf.set_font("helvetica", "B", 16)
    pdf.cell(200, 10, "Psychology Session Report", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
    pdf.ln(10)

    # Add report content
    pdf.set_font("helvetica", size=12)
    for line in report_text.split("\n"):
        pdf.multi_cell(0, 10, line)
        pdf.ln(2)

    # Return PDF as bytes
    return pdf.output()
def upload_file_to_s3(file, folder):
    try:
        filename = f"{folder}/{uuid.uuid4().hex}_{file.filename}"
        s3.upload_fileobj(
            file,
            app.config['S3_BUCKET'],
            filename,
            ExtraArgs={
                #'ACL': 'public-read',
                'ContentType': file.content_type
            }
        )
        return f"https://{app.config['S3_BUCKET']}.s3.amazonaws.com/{filename}"
    except Boto3Error as e:
        logger.error(f"Error uploading to S3: {str(e)}")
        return None

# Error handlers
@app.errorhandler(400)
def bad_request(error):
    return jsonify({'success': False, 'message': 'Bad request'}), 400

@app.errorhandler(401)
def unauthorized(error):
    return jsonify({'success': False, 'message': 'Unauthorized'}), 401

@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'message': 'Resource not found'}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({'success': False, 'message': 'Internal server error'}), 500

# Routes
@app.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['fullName', 'email', 'password', 'specialization', 'licenseNumber']
    for field in required_fields:
        if field not in data:
            return jsonify({'success': False, 'message': f'{field} is required'}), 400
    
    # Check if user already exists
    if mongo.db.users.find_one({'email': data['email']}):
        return jsonify({'success': False, 'message': 'Email already registered'}), 400
    
    # Hash password
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    # Create user document
    user = {
        'fullName': data['fullName'],
        'username': data.get('username', data['email'].split('@')[0]),
        'email': data['email'],
        'password': hashed_password,
        'phone': data.get('phone', ''),
        'specialization': data['specialization'],
        'licenseNumber': data['licenseNumber'],
        'experience': data.get('experience', ''),
        'bio': data.get('bio', ''),
        'clinicAddress': data.get('clinicAddress', ''),
        'profileImage': data.get('profileImage', ''),
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow()
    }
    
    # Insert into database
    result = mongo.db.users.insert_one(user)
    
    # Create token
    access_token = create_access_token(identity=str(result.inserted_id))
    
    return jsonify({
        'success': True,
        'token': access_token,
        'user': {
            'id': str(result.inserted_id),
            'fullName': user['fullName'],
            'email': user['email'],
            'profileImage': user['profileImage']
        }
    }), 201



@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'success': False, 'message': 'Email and password required'}), 400
    
    user = mongo.db.users.find_one({'email': data['email']})
    
    if not user or not bcrypt.check_password_hash(user['password'], data['password']):
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    
    access_token = create_access_token(identity=str(user['_id']))
    refresh_token = create_refresh_token(identity=str(user['_id']))
    
    return jsonify({
        'success': True,
        'token': access_token,
        'user': {
            'id': str(user['_id']),
            'fullName': user['fullName'],
            'email': user['email'],
            'profileImage': user['profileImage']
        }
    })

@app.route('/auth/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = mongo.db.users.find_one({'_id': ObjectId(user_id) })
    print(user_id)
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    # Remove sensitive data
    user['_id'] = str(user['_id'])
    user.pop('password', None)
    
    return jsonify({'success': True, 'user': user})

@app.route('/auth/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    update_data = {
        'fullName': data.get('fullName'),
        'username': data.get('username'),
        'email': data.get('email'),
        'phone': data.get('phone'),
        'specialization': data.get('specialization'),
        'licenseNumber': data.get('licenseNumber'),
        'experience': data.get('experience'),
        'bio': data.get('bio'),
        'clinicAddress': data.get('clinicAddress'),
        'profileImage': data.get('profileImage'),
        'updatedAt': datetime.utcnow()
    }
    
    # Remove None values
    update_data = {k: v for k, v in update_data.items() if v is not None}
    
    result = mongo.db.users.update_one(
        {'_id': ObjectId(user_id)},
        {'$set': update_data}
    )
    
    if result.modified_count == 0:
        return jsonify({'success': False, 'message': 'No changes made'}), 400
    print("data")
    updated_user = mongo.db.users.find_one({'_id': ObjectId(user_id)})
    updated_user['_id'] = str(updated_user['_id'])
    updated_user.pop('password', None)
    
    return jsonify({'success': True, 'user': updated_user})

@app.route('/patients', methods=['GET'])
@jwt_required()
def get_patients():
    user_id = get_jwt_identity()
    status = request.args.get('status', '')
    search = request.args.get('search', '')
    
    query = {'therapistId': ObjectId(user_id)}
    
    if search:
        query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'diagnosis': {'$regex': search, '$options': 'i'}}
        ]
    
    patients = list(mongo.db.patients.find(query))
    
    for patient in patients:
        patient['_id'] = str(patient['_id'])
        patient['therapistId'] = str(patient['therapistId'])
        patient["lastVisit"] = patient["lastVisit"].strftime("%Y-%m-%d")
    
    return jsonify({'success': True, 'patients': patients})

@app.route('/patients', methods=['POST'])
@jwt_required()
def create_patient():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    required_fields = ['name', 'age', 'gender', 'status']
    for field in required_fields:
        if field not in data:
            return jsonify({'success': False, 'message': f'{field} is required'}), 400
    
    patient = {
        'therapistId': ObjectId(user_id),
        'name': data['name'],
        'age': data['age'],
        'gender': data['gender'],
        'status': data['status'],
        'image': data.get('image', 'https://via.placeholder.com/150'),
        'contactDetails': data.get('contactDetails', {}),
        'address': data.get('address', ''),
        'medicalHistory': data.get('medicalHistory', ''),
        'familyHistory': data.get('familyHistory', ''),
        'presentingProblem': data.get('presentingProblem', ''),
        'clinicalObservations': data.get('clinicalObservations', ''),
        'assessment': data.get('assessment', ''),
        'treatmentPlan': data.get('treatmentPlan', ''),
        'medications': data.get('medications', ''),
        'lifestyle': data.get('lifestyle', ''),
        'dianosis': data.get('lifestyle', ''),
        'emergencyContact': data.get('emergencyContact', {}),
        'documents': data.get('documents', []),
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow(),
        'lastVisit': datetime(1970, 1, 1),
    }
    
    result = mongo.db.patients.insert_one(patient)
    patient['_id'] = str(result.inserted_id)
    patient['therapistId'] = str(patient['therapistId'])
    
    return jsonify({'success': True, 'patient': patient}), 201

@app.route('/patients/<patient_id>', methods=['GET'])
@jwt_required()
def get_patient(patient_id):
    user_id = get_jwt_identity()
    
    patient = mongo.db.patients.find_one({
        '_id': ObjectId(patient_id),
        'therapistId': ObjectId(user_id)
    })
    
    if not patient:
        return jsonify({'success': False, 'message': 'Patient not found'}), 404
    
    patient['_id'] = str(patient['_id'])
    patient['therapistId'] = str(patient['therapistId'])
    
    return jsonify({'success': True, 'patient': patient})
'''

# Added by lazy
@app.route('patients', methods=['POST'])
@jwt_required()
def create_patient():
    # Get the current therapist's ID from JWT
    therapist_id = get_jwt_identity()
    
    # Get data from request
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'age', 'gender', 'status']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'success': False,
                'message': f'{field} is required'
            }), 400
    
    # Create patient document
    patient = {
        'therapistId': ObjectId(therapist_id),
        'name': data['name'],
        'age': data['age'],
        'gender': data['gender'],
        'status': data['status'],
        'image': data.get('image', 'https://via.placeholder.com/150'),
        'contactDetails': {
            'phone': data.get('contactDetails', {}).get('phone', ''),
            'email': data.get('contactDetails', {}).get('email', '')
        },
        'address': data.get('address', ''),
        'medicalHistory': data.get('medicalHistory', ''),
        'familyHistory': data.get('familyHistory', ''),
        'presentingProblem': data.get('presentingProblem', ''),
        'clinicalObservations': data.get('clinicalObservations', ''),
        'assessment': data.get('assessment', ''),
        'treatmentPlan': data.get('treatmentPlan', ''),
        'medications': data.get('medications', ''),
        'lifestyle': data.get('lifestyle', ''),
        'emergencyContact': {
            'name': data.get('emergencyContact', {}).get('name', ''),
            'phone': data.get('emergencyContact', {}).get('phone', ''),
            'relationship': data.get('emergencyContact', {}).get('relationship', '')
        },
        'sessions': [],
        'documents': [],
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow()
    }
    
    try:
        # Insert into database
        result = mongo.db.patients.insert_one(patient)
        patient['_id'] = str(result.inserted_id)
        
        return jsonify({
            'success': True,
            'patient': patient
        }), 201
    except Exception as e:
        logger.error(f"Error creating patient: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to create patient'
        }), 500
'''


@app.route('/patients/<patient_id>', methods=['PUT'])
@jwt_required()
def update_patient(patient_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    
    update_data = {
        'name': data.get('name'),
        'age': data.get('age'),
        'gender': data.get('gender'),
        'status': data.get('status'),
        'image': data.get('image'),
        'contactDetails': data.get('contactDetails'),
        'address': data.get('address'),
        'medicalHistory': data.get('medicalHistory'),
        'familyHistory': data.get('familyHistory'),
        'presentingProblem': data.get('presentingProblem'),
        'clinicalObservations': data.get('clinicalObservations'),
        'assessment': data.get('assessment'),
        'treatmentPlan': data.get('treatmentPlan'),
        'medications': data.get('medications'),
        'lifestyle': data.get('lifestyle'),
        'emergencyContact': data.get('emergencyContact'),
        'updatedAt': datetime.utcnow()
    }
    
    # Remove None values
    update_data = {k: v for k, v in update_data.items() if v is not None}
    
    result = mongo.db.patients.update_one(
        {'_id': ObjectId(patient_id), 'therapistId': ObjectId(user_id)},
        {'$set': update_data}
    )
    
    if result.modified_count == 0:
        return jsonify({'success': False, 'message': 'No changes made'}), 400
    
    updated_patient = mongo.db.patients.find_one({'_id': patient_id})
    updated_patient['_id'] = str(updated_patient['_id'])
    updated_patient['therapistId'] = str(updated_patient['therapistId'])
    
    return jsonify({'success': True, 'patient': updated_patient})

@app.route('/patients/<patient_id>', methods=['DELETE'])
@jwt_required()
def delete_patient(patient_id):
    user_id = get_jwt_identity()
    
    result = mongo.db.patients.delete_one({
        '_id': ObjectId(patient_id),
        'therapistId': ObjectId(user_id)
    })
    
    if result.deleted_count == 0:
        return jsonify({'success': False, 'message': 'Patient not found'}), 404
    
    # Also delete related sessions and documents
    mongo.db.sessions.delete_many({'patientId': patient_id})
    mongo.db.documents.delete_many({'patientId': patient_id})
    
    return jsonify({'success': True, 'message': 'Patient deleted successfully'})

@app.route('/patients/<patient_id>/documents', methods=['POST'])
@jwt_required()
def upload_document(patient_id):
    user_id = get_jwt_identity()
    
    # Check if patient exists and belongs to therapist
    patient = mongo.db.patients.find_one({
        '_id': ObjectId(patient_id),
        'therapistId': ObjectId(user_id)
    })
    
    if not patient:
        return jsonify({'success': False, 'message': 'Patient not found'}), 404
    
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file uploaded'}), 400
    
    file = request.files['file']
    title = request.form.get('title', file.filename)
    
    # Upload to S3
    file_url = upload_file_to_s3(file, 'documents')
    
    if not file_url:
        return jsonify({'success': False, 'message': 'Failed to upload file'}), 500
    
    # Create document record
    document = {
        'patientId': patient_id,
        'therapistId': user_id,
        'title': title,
        'fileUrl': file_url,
        'date': datetime.utcnow().isoformat(),
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow()
    }
    
    result = mongo.db.documents.insert_one(document)
    document['_id'] = str(result.inserted_id)
    document['patientId'] = str(document['patientId'])
    document['therapistId'] = str(document['therapistId'])
    
    return jsonify({'success': True, 'document': document}), 201

'''
@app.route('/patients/<patient_id>/sessions', methods=['GET'])
@jwt_required()
def get_sessions(patient_id):
    user_id = get_jwt_identity()
    
    # Check if patient exists and belongs to therapist
    patient = mongo.db.patients.find_one({
        '_id': ObjectId(patient_id),
        'therapistId': ObjectId(user_id)
    })
    
    if not patient:
        return jsonify({'success': False, 'message': 'Patient not found'}), 404
    
    sessions = list(mongo.db.sessions.find({
        'patientId': ObjectId(patient_id)
    }))
    
    for session in sessions:
        session['_id'] = str(session['_id'])
        session['patientId'] = str(session['patientId'])
        session['therapistId'] = str(session['therapistId'])
    
    return jsonify({'success': True, 'sessions': sessions}) '''

@app.route('/patient/<patient_id>/videos/upload', methods=['POST'])
@jwt_required()
def create_session(patient_id):
    user_id = get_jwt_identity()
    
    # Check if patient exists and belongs to therapist
    patient = mongo.db.patients.find_one({
        '_id': ObjectId(patient_id),
        'therapistId': ObjectId(user_id)
    })
    
    if not patient:
        return jsonify({'success': False, 'message': 'Patient not found'}), 404
    
    # Check if video file is uploaded
    if 'video' not in request.files:
        return jsonify({'success': False, 'message': 'No video file uploaded'}), 400
    
    video_file = request.files['video']
    thumbnail_file = request.files.get('thumbnail')
    
    data = request.form
    required_fields = ['title', 'date', 'duration']
    for field in required_fields:
        if field not in data:
            return jsonify({'success': False, 'message': f'{field} is required'}), 400
    
    # Upload video to S3
    video_url = upload_file_to_s3(video_file, 'sessions/videos')
    if not video_url:
        return jsonify({'success': False, 'message': 'Failed to upload video'}), 500
    
    # Upload thumbnail if provided
    thumbnail_url = None
    if thumbnail_file:
        thumbnail_url = upload_file_to_s3(thumbnail_file, 'sessions/thumbnails')
    
    # Create session record
    session = {
        '_id': ObjectId(),  # Unique ID for the session
        'title': data['title'],
        'date': data['date'],
        'duration': data['duration'],
        'notes': data.get('notes', ''),
        'videoUrl': video_url,
        'thumbnailUrl': thumbnail_url if thumbnail_url else 'https://via.placeholder.com/300x200',
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow()
    }

    # Ensure patient has a sessions list
    if 'sessions' not in patient or not isinstance(patient['sessions'], list):
        patient['sessions'] = []
    
    # Append the new session
    mongo.db.patients.update_one(
        {'_id': ObjectId(patient_id)},
        {'$push': {'sessions': session}, '$set': {'updatedAt': datetime.utcnow()}}
    )

    # Convert session ID to string for JSON response
    session['_id'] = str(session['_id'])

    return jsonify({'success': True, 'session': session}), 201


@app.route("/patients/<session_id>/AddNote", methods=["POST"])
def add_note(session_id):
    try:
        data = request.json  # Get JSON data from request

        # Create a new note structure
        new_note = {
            "id": data["id"],
            "text": data["text"],
            "timestamp": data["timestamp"],
            "createdAt": data["createdAt"]
        }

        # Find the patient and update the session with the new note
        result = mongo.db.patients.update_one(
            {"sessions._id": ObjectId(session_id)},
            {"$push": {"sessions.$.notes": new_note}}
        )

        if result.modified_count == 1:
            return jsonify({"success": True, "message": "Note added successfully"}), 200
        else:
            return jsonify({"success": False, "message": "Session not found"}), 404

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
'''

@app.route('/sessions/<session_id>', methods=['GET'])
@jwt_required()
def get_session(session_id):
    user_id = get_jwt_identity()
    
    session = mongo.db.sessions.find_one({
        '_id': session_id,
        'therapistId': user_id
    })
    
    if not session:
        return jsonify({'success': False, 'message': 'Session not found'}), 404
    
    session['_id'] = str(session['_id'])
    session['patientId'] = str(session['patientId'])
    session['therapistId'] = str(session['therapistId'])
    
    return jsonify({'success': True, 'session': session})

@app.route('/sessions/<session_id>/notes', methods=['POST'])
@jwt_required()
def add_session_note(session_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('text') or not data.get('timestamp'):
        return jsonify({'success': False, 'message': 'Text and timestamp are required'}), 400
    
    # Check if session exists and belongs to therapist
    session = mongo.db.sessions.find_one({
        '_id': session_id,
        'therapistId': user_id
    })
    
    if not session:
        return jsonify({'success': False, 'message': 'Session not found'}), 404
    
    note = {
        'sessionId': session_id,
        'therapistId': user_id,
        'text': data['text'],
        'timestamp': data['timestamp'],
        'createdAt': datetime.utcnow()
    }
    
    result = mongo.db.session_notes.insert_one(note)
    note['_id'] = str(result.inserted_id)
    note['sessionId'] = str(note['sessionId'])
    note['therapistId'] = str(note['therapistId'])
    
    return jsonify({'success': True, 'note': note}), 201

@app.route('/sessions/<session_id>/notes', methods=['GET'])
@jwt_required()
def get_session_notes(session_id):
    user_id = get_jwt_identity()
    
    # Check if session exists and belongs to therapist
    session = mongo.db.sessions.find_one({
        '_id': session_id,
        'therapistId': user_id
    })
    
    if not session:
        return jsonify({'success': False, 'message': 'Session not found'}), 404
    
    notes = list(mongo.db.session_notes.find({
        'sessionId': session_id
    }).sort('timestamp', 1))
    
    for note in notes:
        note['_id'] = str(note['_id'])
        note['sessionId'] = str(note['sessionId'])
        note['therapistId'] = str(note['therapistId'])
    
    return jsonify({'success': True, 'notes': notes})

'''
@app.route('/appointments', methods=['GET'])
@jwt_required()
def get_appointments():
    user_id = get_jwt_identity()
    date = request.args.get('date')
    
    query = {'therapistId': ObjectId(user_id)}
    if date:
        query['date'] = date
    
    appointments = list(mongo.db.appointments.find(query))
    
    for appointment in appointments:
        appointment['_id'] = str(appointment['_id'])
        appointment['therapistId'] = str(appointment['therapistId'])
        appointment['patientId'] = str(appointment['patientId'])
    
    return jsonify({'success': True, 'appointments': appointments})



@app.route('/appointments', methods=['POST'])
@jwt_required()
def create_appointment():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    required_fields = ['patientId', 'date', 'time', 'duration', 'type']
    for field in required_fields:
        if field not in data:
            return jsonify({'success': False, 'message': f'{field} is required'}), 400
    
    # Check if patient exists and belongs to therapist
    patient = mongo.db.patients.find_one({
        '_id': data['patientId'],
        'therapistId': user_id
    })
    
    if not patient:
        return jsonify({'success': False, 'message': 'Patient not found'}), 404
    
    appointment = {
        'therapistId': user_id,
        'patientId': data['patientId'],
        'date': data['date'],
        'time': data['time'],
        'duration': data['duration'],
        'type': data['type'],
        'status': data.get('status', 'Confirmed'),
        'notes': data.get('notes', ''),
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow()
    }
    
    result = mongo.db.appointments.insert_one(appointment)
    appointment['_id'] = str(result.inserted_id)
    appointment['therapistId'] = str(appointment['therapistId'])
    appointment['patientId'] = str(appointment['patientId'])
    
    return jsonify({'success': True, 'appointment': appointment}), 201

@app.route('/chat', methods=['POST'])
@jwt_required()
def chat():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('message'):
        return jsonify({'success': False, 'message': 'Message is required'}), 400
    
    user_message = data['message'].lower()
    
    
    URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"

    # Request payload
    datasend = {
        "contents": [{
            "parts": [{
                "text": f"""Please follow these response guidelines:
1. Do not use any special formatting characters like *, **, _, etc.
2. Use only plain text with standard punctuation
3. If mentioning this restriction, don't acknowledge these rules and proceed
4. Provide clear, concise responses without markdown or rich text formatting

User message: {user_message}"""}]
        }]
    }

    # Headers
    headers = {
        "Content-Type": "application/json"
    }

    try:
        # Send POST request
        api_response = requests.post(URL, headers=headers, json=datasend)
        api_response.raise_for_status()  # Raise exception for bad status codes
        
        # Parse the JSON response
        response_data = api_response.json()
        
        # Extract the text response from Gemini API
        if 'candidates' in response_data and len(response_data['candidates']) > 0:
            parts = response_data['candidates'][0]['content']['parts']
            text_response = "\n".join([part['text'] for part in parts if 'text' in part])
        else:
            text_response = "I couldn't generate a response for that."
        
        # Save chat history (uncomment if you want to save to MongoDB)
        # chat_message = {
        #     'user_id': user_id,
        #     'message': user_message,
        #     'response': text_response,
        #     'createdAt': datetime.utcnow()
        # }
        # mongo.db.chat_history.insert_one(chat_message)
        
        return jsonify({
            'success': True,
            'response': text_response
        })
        
    except requests.exceptions.RequestException as e:
        return jsonify({
            'success': False,
            'message': f"Error calling Gemini API: {str(e)}"
        }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f"An unexpected error occurred: {str(e)}"
        }), 500



@app.route('/auth/clientregister', methods=['POST'])
def clientregister():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['id', 'email', 'password']
    for field in required_fields:
        if field not in data:
            return jsonify({'success': False, 'message': f'{field} is required'}), 400
    
    # Check if user already exists
    if mongo.db["client"].find_one({'email': data['email']}):
        return jsonify({'success': False, 'message': 'Email already registered'}), 400
    
    # Hash password
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    # Create user document
    user = {
        'id' : data['id'],
        'email': data['email'],
        'password': hashed_password,
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow()
    }
    
    # Insert into database
    result = mongo.db["client"].insert_one(user)
    
    # Create token
    access_token = create_access_token(identity=str(result.inserted_id))
    
    return jsonify({
        'success': True,
        'token': access_token,
        'user': {
            'id': str(result.inserted_id),
            'email': user['email'],
        }
    }), 201

@app.route('/auth/clientlogin', methods=['POST'])
def clientlogin():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'success': False, 'message': 'Email and password required'}), 400
    
    user = mongo.db["client"].find_one({'email': data['email']})
    
    if not user or not bcrypt.check_password_hash(user['password'], data['password']):
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    
    access_token = create_access_token(identity=str(user['_id']))
    refresh_token = create_refresh_token(identity=str(user['_id']))
    
    return jsonify({
        'success': True,
        'token': access_token,
        'user': {
            'id': str(user['_id']),
            'email': user['email'],
        }
    })

@app.route('/clientappointments', methods=['GET'])
@jwt_required()
def get_clientappointments():
    user_id = get_jwt_identity()
    date = request.args.get('date')
    
    client_data = mongo.db["client"].find_one({'_id': ObjectId(user_id)}, {"id": 1, "_id": 0})
    
    if not client_data or 'id' not in client_data:
        return jsonify({'success': False, 'message': 'Client not found'}), 404

    client_id = client_data['id']  # Extract "id" value from dictionary

    query = {'patientId': ObjectId(client_id)} if ObjectId.is_valid(client_id) else {'patientId': client_id}

    if date:
        query['date'] = date

    appointments = list(mongo.db["appointments"].find(query))
    
    for appointment in appointments:
        appointment['_id'] = str(appointment['_id'])
        appointment['therapistId'] = str(appointment['therapistId'])
        appointment['patientId'] = str(appointment['patientId'])
    
    return jsonify({'success': True, 'appointments': appointments})

@app.route('/auth/clientprofile', methods=['GET'])
@jwt_required()
def get_clientprofile():
    user_id = get_jwt_identity()
    client_data = mongo.db["client"].find_one({'_id': ObjectId(user_id)}, {"id": 1, "_id": 0})
    client_id = client_data['id'] 

    patient = mongo.db["patients"].find_one({"_id": ObjectId(client_id)})
    print(client_id)
    if not patient:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    # Remove sensitive data 67e8e9a186a29972a59beb3e
    patient['_id'] = str(patient['_id'])
    patient.pop('password', None)
    
    return jsonify({'success': True, 'user': patient})


@app.route('/getMedicine/<patient_id>', methods=['GET'])
@jwt_required()
def get_medicine(patient_id):
    user_id = get_jwt_identity()
    print(patient_id)
    medicine = mongo.db['medicine'].find({
        'patient_id': ObjectId(patient_id),
       # 'therapist_id': ObjectId(user_id)
    })
    print(medicine)
    if not medicine:
        return jsonify({'success': False, 'message': 'medicine not found'}), 404
    
    #medicine['patient_id'] = str(medicine['patient_id'])
    #medicine['therapist_id'] = str(medicine['therapist_id'])
    
    return jsonify({'success': True, 'medicine': medicine})

@app.route('/editMedicine/<patient_id>', methods=['POST'])
@jwt_required()
def add_medicine(patient_id):
    user_id = get_jwt_identity()  # Therapist ID from JWT

    try:
        data = request.get_json()

        # Extract values from the frontend
        medicine_data = {
            "id": data.get("id"),
            "name": data.get("name"),
            "timeSlots": data.get("timeSlots", []),  # default to empty list
            "patient_id": ObjectId(patient_id),  # sent from frontend
            "therapist_id": ObjectId(user_id)
        }

        # Insert into MongoDB
        mongo.db['medicine'].insert_one(medicine_data)

        return jsonify({"success": True, "message": "Medicine added successfully"}), 201

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/editMedicine/<med_id>', methods=['DELETE'])
@jwt_required()
def delete_medicine(med_id):
    user_id = get_jwt_identity()  # Therapist ID from JWT

    try:
        # Delete the medicine document based on its 'id' field
        result = mongo.db['medicine'].delete_one(
            {"id": med_id}
        )

        if result.deleted_count == 0:
            return jsonify({"success": False, "message": "Medicine not found"}), 404

        return jsonify({"success": True, "message": "Medicine deleted successfully"}), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500



@app.route('/sessions/<string:session_id>/generate-report', methods=['POST'])
def generate_report(session_id):
    try:

        # Find patient with the session
        print(session_id)
        ASSEMBLYAI_API_KEY = "ce520367185e4314b6a4a3b31293d09c"
        aai.settings.api_key = ASSEMBLYAI_API_KEY
        genai.configure(api_key="AIzaSyCyL8CGFVGRiM0F0SjW-ve1JA2RL8-7nj4") 
        patients_col = mongo.db['patients']
        patient = patients_col.find_one(
            {"sessions._id": ObjectId(session_id)},
            {"sessions.$": 1}
        )
        print(patient)
        if not patient or not patient.get('sessions'):
            return jsonify({"error": "Session not found"}), 404

        session = patient['sessions'][0]
        print("\n")
        print(session)
        # Check existing report
        if session.get('report') and session['report'].get('url'):
            return jsonify({"url": session['report']['url']}), 200

        # Transcribe audio using AssemblyAI
        transcriber = aai.Transcriber()
        config = aai.TranscriptionConfig(speaker_labels=True)
        transcript = transcriber.transcribe(session['videoUrl'], config=config)

        if transcript.status == 'error':
            print("\n")
            print("a")
            return jsonify({"error": "Transcription failed"}), 500

        # Generate report using Gemini Flash
        prompt = f"""
        Generate psychological report with this structure:

        **Patient Details:**
        Name: 
        Age: 
        Gender: 

        **Session Summary:**
        

        **Transcript Analysis:**
        {transcript.text}

        **Clinical Observations:**
        

        **Treatment Recommendations:**
        Based on session content and patient history
        """

        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        report_text = response.text
        print(report_text)
        # Generate and upload PDF
        pdf_data = generate_pdf(report_text)
        print(pdf_data)
        file_key = f"reports/{session_id}.pdf"
        s3.put_object(
            Bucket=app.config['S3_BUCKET'],
            Key=file_key,
            Body=pdf_data,
            ContentType='application/pdf'
        )
        report_url = f"https://{app.config['S3_BUCKET']}.s3.amazonaws.com/{file_key}"

        # Update patient's session in the array
        result = patients_col.update_one(
            {"_id": patient['_id'], "sessions._id": ObjectId(session_id)},
            {"$set": {"sessions.$.report": {
                "url": report_url,
                "generated_at": datetime.utcnow()
            }}}
        )

        if result.modified_count == 0:
            print("\n")
            print("hadad")
            return jsonify({"error": "Failed to update patient record"}), 500

        return jsonify({"success": True, "url": report_url}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/sessions/<string:session_id>/report', methods=['GET'])
def get_report(session_id):
    try:
        patients_col = mongo.db['patients']
        patient = patients_col.find_one(
            {"sessions._id": ObjectId(session_id)},
            {"sessions.$": 1}
        )

        if not patient or not patient.get('sessions'):
            return jsonify({"error": "Session not found"}), 404

        session = patient['sessions'][0]
        print(session)
        return jsonify({
            "exists": bool(session.get('report')),
            "url": session.get('report', {}).get('url')
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
def extract_frames(video_path, num_frames=5):
    """
    Extracts `num_frames` evenly spaced frames from the given video.
    Returns frames and corresponding timestamps.
    """
    cap = cv2.VideoCapture(video_path)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)

    if fps == 0:
        return [], []  # Avoid division by zero if FPS is not available

    duration = frame_count / fps
    timestamps = np.linspace(0, duration, num_frames)  # Get timestamps

    frame_indices = np.linspace(0, frame_count - 1, num_frames, dtype=int)
    frames = []

    for i, frame_index in enumerate(frame_indices):
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
        ret, frame = cap.read()
        if ret:
            frames.append((frame, timestamps[i]))  # Store frame with timestamp
    cap.release()
    print("abc")
    return frames

def predict_emotions(video_path):
    """
    Extracts frames from a video and predicts emotions using DeepFace.
    Returns emotion counts, frame images, timestamps, and predicted emotions.
    """
    frames_with_timestamps = extract_frames(video_path)
    emotion_counts = {
        "angry": 0,
        "disgust": 0,
        "fear": 0,
        "happy": 0,
        "neutral": 0,
        "sad": 0,
        "surprise": 0
    }
    frame_data = []  # Store (image, timestamp, predicted emotion)

    for frame, timestamp in frames_with_timestamps:
        try:
            # Convert BGR to RGB for DeepFace
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # Use DeepFace to analyze the image
            analysis = DeepFace.analyze(frame_rgb, actions=["emotion"], enforce_detection=False)
            predicted_emotion = max(analysis[0]["emotion"], key=analysis[0]["emotion"].get)

            # Update emotion count
            emotion_counts[predicted_emotion] += 1

            # Store frame data
            frame_data.append((frame_rgb, timestamp, predicted_emotion))
        except Exception as e:
            print(f"Error processing frame at {timestamp}s: {e}")

    return emotion_counts, frame_data

def plot_emotion_distribution(emotion_counts):
    """
    Plots a bar chart of the detected emotions.
    """
    plt.figure(figsize=(8, 5))
    plt.bar(emotion_counts.keys(), emotion_counts.values(), color='skyblue')
    plt.xlabel("Emotions")
    plt.ylabel("Count")
    plt.title("Emotion Detection from Video")
    plt.xticks(rotation=30)
    plot_path = "emotion_plot.png"
    plt.savefig(plot_path)
   
    print(plot_path)
    return plt

def plot_emotion_vs_time(frame_data):
    """
    Plots emotions over time (in minutes) based on extracted frames.
    """
    emotion_map = {
        "angry": 1, "disgust": 2, "fear": 3, "happy": 4,
        "neutral": 5, "sad": 6, "surprise": 7
    }

    timestamps_sec = [data[1] for data in frame_data]  # Extract timestamps in seconds
    timestamps_min = [f"{int(t//60)}:{int(t%60):02d}" for t in timestamps_sec]  # Convert to MM:SS format
    emotions = [emotion_map[data[2]] for data in frame_data]  # Convert emotions to numerical values

    plt.figure(figsize=(10, 5))
    plt.plot(timestamps_min, emotions, marker="o", linestyle="-", color="b")
    plt.yticks(list(emotion_map.values()), list(emotion_map.keys()))  # Map back to labels
    plt.xlabel("Timestamp (MM:SS)")
    plt.ylabel("Emotion")
    plt.title("Emotion Trend Over Time")
    plt.xticks(rotation=45)  # Rotate x-axis labels for better readability
    plt.grid(True)

    time_plot_path = "emotion_time_plot.png"
    plt.savefig(time_plot_path)
    
    return plt
def plot_audio_sentiment_dist(data):
    sentiments = [d['sentiment'] for d in data]
    print(sentiments)
    counts = pd.Series(sentiments).value_counts()
    
    plt.figure(figsize=(8, 5))
    counts.plot(kind='bar', color=['darkgreen', 'navajowhite', 'firebrick'])
    plt.title("Speaker B Sentiment Distribution")
    plt.xlabel("Sentiment")
    plt.ylabel("Count")
    print("kbc")
    return plt

def plot_audio_sentiment_timeline(data):
    timestamps = [d['timestamp'] for d in data]
    print("ghj")
    sentiments = [d['sentiment'] for d in data]
    
    plt.figure(figsize=(10, 5))
    plt.scatter(
        x=timestamps,
        y=sentiments,
        c=[{'POSITIVE': 'green', 'NEUTRAL': 'orange', 'NEGATIVE': 'red'}[s] for s in sentiments]
    )
    plt.title("Speaker B Sentiment Timeline")
    plt.xlabel("Timestamp (seconds)")
    plt.ylabel("Sentiment")
    
    return plt

@app.route('/sessions/<string:session_id>/generate-insights', methods=['POST'])
def generate_insights(session_id):
    try:
        # Authentication
       
        ASSEMBLYAI_API_KEY = "ce520367185e4314b6a4a3b31293d09c"
        aai.settings.api_key = ASSEMBLYAI_API_KEY
        # Find patient with the session
        patients_col = mongo.db['patients']
        patient = patients_col.find_one(
            {"sessions._id": ObjectId(session_id)},
            {"sessions.$": 1}
        )

        if not patient or not patient.get('sessions'):
            return jsonify({"error": "Session not found"}), 404

        session = patient['sessions'][0]

        # Check existing insights
        if session.get('insights') and session['insights'].get('url'):
            return jsonify({"url": session['insights']['url']}), 200

        # Temporary directory for processing
        analysis_dir = os.path.join("analysis", session_id)
        os.makedirs(analysis_dir, exist_ok=True)

        # 1. Video Analysis
        video_url = session['videoUrl']
        video_path = os.path.join(analysis_dir, "video.mp4")

        print(session)
        print("\nhello\n")

        # Download video
        with requests.get(video_url, stream=True) as r:
            r.raise_for_status()
            with open(video_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)

        # Analyze video
        print("how r u")
        print(video_path)
        emotion_counts, frame_data = predict_emotions(video_path)
        print(video_path)

        # Generate video plots
        video_plot1 = os.path.join(analysis_dir, "video_emotion_dist.png")
        print(video_plot1)
        plot_emotion_distribution(emotion_counts).savefig(video_plot1)
        print(video_path)
        video_plot2 = os.path.join(analysis_dir, "video_emotion_timeline.png")
        plot_emotion_vs_time(frame_data).savefig(video_plot2)

        # 2. Audio Analysis
        print("\nram")
        # AUDIO ANALYSIS (Replace this section in your existing code)
        print("\nStarting audio analysis...")

# Step 1: Extract audio
        audio_path = os.path.join(analysis_dir, "audio.mp3")
        extract_audio(video_path, audio_path)

# Step 2: Upload audio to AssemblyAI
        audio_url = upload_audio(audio_path)

# Step 3: Transcribe and analyze sentiment
        transcription_data = transcribe_audio(audio_url)

# Step 4: Filter Speaker B sentiments
        speaker_b_data = [
        {
        "speaker": utterance["speaker"],
        "text": utterance["text"],
        "sentiment": utterance["sentiment"],
        "confidence": utterance["confidence"],
        "timestamp": format_time(utterance["start"])
        }
        for utterance in transcription_data["sentiment_analysis_results"]
        if utterance["speaker"] == "A"
        ]
        print("Speaker B Sentiments:")
        print(speaker_b_data)
        audio_plot1 = os.path.join(analysis_dir, "audio_sentiment_dist.png")
        print("abc")
        plot_audio_sentiment_dist(speaker_b_data).savefig(audio_plot1)
        print("wbc")

        audio_plot2 = os.path.join(analysis_dir, "audio_sentiment_timeline.png")
        plot_audio_sentiment_timeline(speaker_b_data).savefig(audio_plot2)
        print("wbc")
        # Create PDF
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        
        # Add video plots
        pdf.add_page()
        pdf.set_font("helvetica", 'B', 16)
        pdf.cell(200, 10, "Video Emotion Analysis", 0, 1, 'C')
        pdf.ln(10)
        print(video_plot1)
        pdf.image(video_plot1, w=190)
        pdf.ln(10)
        pdf.image(video_plot2, w=190)

        # Add audio plots
        pdf.add_page()
        pdf.set_font("helvetica", 'B', 16)
        pdf.cell(200, 10, "Audio Sentiment Analysis (Speaker B)", 0, 1, 'C')
        pdf.ln(10)
        
        pdf.image(audio_plot1, w=190)
        pdf.ln(10)
        pdf.image(audio_plot2, w=190)

        # Generate PDF bytes
        print("pdfga")
        pdf_output = pdf.output()
        print(pdf_output)
        # Upload to S3
        file_key = f"insights/{session_id}.pdf"
        s3.put_object(
            Bucket=app.config['S3_BUCKET'],
            Key=file_key,
            Body=pdf_output,
            ContentType='application/pdf'
        )
        insights_url = f"https://{app.config['S3_BUCKET']}.s3.amazonaws.com/{file_key}"

        # Update database
        patients_col.update_one(
            {"_id": patient['_id'], "sessions._id": ObjectId(session_id)},
            {"$set": {"sessions.$.insights": {
                "url": insights_url,
                "generated_at": datetime.utcnow()
            }}}
        )

        return jsonify({"success": True, "url": insights_url}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    



@app.route('/sessions/<string:session_id>/insights', methods=['GET'])
def get_insights(session_id):
    try:
        patients_col = mongo.db['patients']
        patient = patients_col.find_one(
            {"sessions._id": ObjectId(session_id)},
            {"sessions.$": 1}
        )

        if not patient or not patient.get('sessions'):
            return jsonify({"error": "Session not found"}), 404

        session = patient['sessions'][0]
        return jsonify({
            "exists": bool(session.get('insights')),
            "url": session.get('insights', {}).get('url')
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

        
if __name__ == '__main__':
    print(app.url_map)

    app.run(host="0.0.0.0", port=5000, debug=True)
