from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Connect to MongoDB Atlas
MONGO_URI = "mongodb+srv://test:test@lazy0.brfdy.mongodb.net/?retryWrites=true&w=majority"

client = MongoClient(MONGO_URI)

# Select the database and collection
db = client["sample_supplies"]
collection = db["test_collection"]

# Insert a document
inserted_id = collection.insert_one({"name": "John Doe", "email": "john@example.com"}).inserted_id
print(f"Inserted document ID: {inserted_id}")

# Retrieve the document
retrieved_doc = collection.find_one({"_id": inserted_id})
print("Retrieved Document:", retrieved_doc)
