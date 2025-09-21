from flask import Flask, request, jsonify
from flask_jwt_extended import create_access_token, JWTManager, jwt_required, get_jwt_identity
from flask_pymongo import PyMongo
from flask_cors import CORS
from dotenv import load_dotenv, find_dotenv
from schemas.user import User
from mongoengine import connect, Document, StringField, DateTimeField, ReferenceField
from werkzeug.security import generate_password_hash
from google import genai
import os
import json
from datetime import datetime

# Initialize Flask app
app = Flask(__name__)
CORS(app)

jwt = JWTManager(app)
app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY")


dotenv_path = find_dotenv()
load_dotenv(dotenv_path)

MONGO_URI = os.getenv("MONGO_URI")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
connect(host=MONGO_URI)

# Define Card and Collection models using MongoEngine
class Card(Document):
    card_id = StringField(required=True, unique=True)  # e.g., "AS" for Ace of Spades
    rank = StringField(required=True)  # A, 2-10
    suit = StringField(required=True)  # S, H, D, C
    created_at = DateTimeField(default=datetime.utcnow)
    
    meta = {'collection': 'cards'}

class Collection(Document):
    user = ReferenceField(User, required=True)
    card = ReferenceField(Card, required=True)
    collected_at = DateTimeField(default=datetime.utcnow)
    
    meta = {'collection': 'collections', 'indexes': [
        {'fields': ['user', 'card'], 'unique': True}
    ]}

def passwordHash(password):
    return generate_password_hash(password)

@app.route('/api/addUser', methods=['POST'])
def add_user():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    if User.objects(username=username).first():
        return jsonify({"error": "User already exists"}), 400

    user = User(username=username, password=passwordHash(password))
    user.save()

    return jsonify({"message": "User added successfully"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    user = User.objects(username=username).first()

    if not user:
        return jsonify({"error": "User not found"}), 404

    if not user.passwordVerify(password):
        return jsonify({"error": "Invalid username/password"}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "message": "Login successful",
        "token": access_token
    }), 200

@app.route("/api/generate", methods=["POST"])
def generate_content():
    data = request.json
    prompt = data.get("prompt", "")

    client = genai.Client(api_key=GEMINI_API_KEY)
    response = client.models.generate_content(
        model="gemini-2.0-flash", contents=prompt
    )
    
    # You might need to parse the response to ensure it's valid JSON
    try:
        # Attempt to parse and reformat the response
        json_data = json.loads(response.text)
        return jsonify({"response": json.dumps(json_data)})
    except json.JSONDecodeError:
        # If the response isn't proper JSON, return it as is
        return jsonify({"response": response.text})

@app.route("/api/cards/collect", methods=["POST"])
@jwt_required()
def collect_card():
    user_id = get_jwt_identity()
    data = request.json
    card_data = data.get("card")
    
    # Get user from database
    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Check if this card already exists in database
    card = Card.objects(
        rank=card_data["rank"], 
        suit=card_data["suit"]
    ).first()

    if not card:
        # Create the card if it doesn't exist
        card = Card(
            rank=card_data["rank"],
            suit=card_data["suit"],
            card_id=card_data["id"]
        )
        card.save()
    
    # Check if user already has this card
    collection_entry = Collection.objects(
        user=user,
        card=card
    ).first()
    
    if not collection_entry:
        # Add to user's collection
        collection_entry = Collection(user=user, card=card)
        collection_entry.save()
        return jsonify({"message": "Card added to collection"}), 201
    
    return jsonify({"message": "Card already in collection"}), 200

@app.route("/api/cards/collection", methods=["GET"])
@jwt_required()
def get_collection():
    user_id = get_jwt_identity()
    
    # Get user from database
    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Get all cards in user's collection
    collection = Collection.objects(user=user).all()
    cards = []
    
    for entry in collection:
        cards.append({
            "id": entry.card.card_id,
            "rank": entry.card.rank,
            "suit": entry.card.suit
        })
    
    return jsonify({"collection": cards})

if __name__ == "__main__":
    app.run(debug=True, port=5001)