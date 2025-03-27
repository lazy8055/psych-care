# app.py
from flask import Flask, jsonify, request
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import boto3
from boto3.exceptions import Boto3Error
import uuid
import logging

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configuration
app.config['MONGO_URI'] = os.getenv('MONGO_URI')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
app.config['AWS_ACCESS_KEY_ID'] = os.getenv('AWS_ACCESS_KEY_ID')
app.config['AWS_SECRET_ACCESS_KEY'] = os.getenv('AWS_SECRET_ACCESS_KEY')
app.config['AWS_REGION'] = os.getenv('AWS_REGION')
app.config['S3_BUCKET'] = os.getenv('S3_BUCKET')

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
def upload_file_to_s3(file, folder):
    try:
        filename = f"{folder}/{uuid.uuid4().hex}_{file.filename}"
        s3.upload_fileobj(
            file,
            app.config['S3_BUCKET'],
            filename,
            ExtraArgs={
                'ACL': 'public-read',
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
    user = mongo.db.users.find_one({'_id': user_id})
    
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
        {'_id': user_id},
        {'$set': update_data}
    )
    
    if result.modified_count == 0:
        return jsonify({'success': False, 'message': 'No changes made'}), 400
    
    updated_user = mongo.db.users.find_one({'_id': user_id})
    updated_user['_id'] = str(updated_user['_id'])
    updated_user.pop('password', None)
    
    return jsonify({'success': True, 'user': updated_user})

@app.route('/patients', methods=['GET'])
@jwt_required()
def get_patients():
    user_id = get_jwt_identity()
    status = request.args.get('status', 'Current')
    search = request.args.get('search', '')
    
    query = {'therapistId': user_id, 'status': status}
    
    if search:
        query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'diagnosis': {'$regex': search, '$options': 'i'}}
        ]
    
    patients = list(mongo.db.patients.find(query))
    
    for patient in patients:
        patient['_id'] = str(patient['_id'])
        patient['therapistId'] = str(patient['therapistId'])
    
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
        'therapistId': user_id,
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
        'emergencyContact': data.get('emergencyContact', {}),
        'documents': data.get('documents', []),
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow()
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
        '_id': patient_id,
        'therapistId': user_id
    })
    
    if not patient:
        return jsonify({'success': False, 'message': 'Patient not found'}), 404
    
    patient['_id'] = str(patient['_id'])
    patient['therapistId'] = str(patient['therapistId'])
    
    return jsonify({'success': True, 'patient': patient})

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
        {'_id': patient_id, 'therapistId': user_id},
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
        '_id': patient_id,
        'therapistId': user_id
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
        '_id': patient_id,
        'therapistId': user_id
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

@app.route('/patients/<patient_id>/sessions', methods=['GET'])
@jwt_required()
def get_sessions(patient_id):
    user_id = get_jwt_identity()
    
    # Check if patient exists and belongs to therapist
    patient = mongo.db.patients.find_one({
        '_id': patient_id,
        'therapistId': user_id
    })
    
    if not patient:
        return jsonify({'success': False, 'message': 'Patient not found'}), 404
    
    sessions = list(mongo.db.sessions.find({
        'patientId': patient_id
    }))
    
    for session in sessions:
        session['_id'] = str(session['_id'])
        session['patientId'] = str(session['patientId'])
        session['therapistId'] = str(session['therapistId'])
    
    return jsonify({'success': True, 'sessions': sessions})

@app.route('/patients/<patient_id>/sessions', methods=['POST'])
@jwt_required()
def create_session(patient_id):
    user_id = get_jwt_identity()
    
    # Check if patient exists and belongs to therapist
    patient = mongo.db.patients.find_one({
        '_id': patient_id,
        'therapistId': user_id
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
        'patientId': patient_id,
        'therapistId': user_id,
        'title': data['title'],
        'date': data['date'],
        'duration': data['duration'],
        'notes': data.get('notes', ''),
        'videoUrl': video_url,
        'thumbnailUrl': thumbnail_url if thumbnail_url else 'https://via.placeholder.com/300x200',
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow()
    }
    
    result = mongo.db.sessions.insert_one(session)
    session['_id'] = str(result.inserted_id)
    session['patientId'] = str(session['patientId'])
    session['therapistId'] = str(session['therapistId'])
    
    return jsonify({'success': True, 'session': session}), 201

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

@app.route('/appointments', methods=['GET'])
@jwt_required()
def get_appointments():
    user_id = get_jwt_identity()
    date = request.args.get('date')
    
    query = {'therapistId': user_id}
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
    
    # In a real app, you would integrate with an AI service here
    # This is a simple mock response based on keywords
    user_message = data['message'].lower()
    
    if 'hello' in user_message or 'hi' in user_message:
        response = "Hello! How can I assist you today?"
    elif 'appointment' in user_message:
        response = "Would you like to schedule a new appointment or check your existing appointments?"
    elif 'schedule' in user_message or 'book' in user_message:
        response = "To schedule an appointment, please provide your preferred date and time, and I'll check availability."
    elif 'cancel' in user_message:
        response = "If you need to cancel an appointment, please provide the date and time, and I'll help you with that."
    elif 'patient' in user_message or 'client' in user_message:
        response = "You can view all your patients in the Patients tab. Would you like me to help you find a specific patient?"
    elif 'thank' in user_message:
        response = "You're welcome! Is there anything else I can help you with?"
    else:
        response = "I'm not sure how to respond to that. Can you please clarify?"
    
    # Save chat history
    chat_message = {
        'userId': user_id,
        'message': data['message'],
        'response': response,
        'createdAt': datetime.utcnow()
    }
    
    mongo.db.chat_history.insert_one(chat_message)
    
    return jsonify({'success': True, 'response': response})

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
