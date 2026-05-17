import os
import sys
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from routes.transactions import transactions_bp

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

# Register blueprints
app.register_blueprint(transactions_bp, url_prefix='/api/transactions')

# Health check endpoint
@app.route('/health')
def health_check():
    return jsonify({'status': 'ok', 'message': 'Personal Finance Tracker API is running'})

# Serve static files (frontend)
@app.route('/')
def serve_frontend():
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend')
    return send_from_directory(frontend_path, 'index.html')

@app.route('/<path:filename>')
def serve_static_files(filename):
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend')
    return send_from_directory(frontend_path, filename)

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'False').lower() == 'true'
    
    print(f"Starting Personal Finance Tracker API on port {port}")
    print(f"Debug mode: {debug}")
    print("Available endpoints:")
    print("  GET  /health - Health check")
    print("  GET  /api/transactions - Get all transactions")
    print("  POST /api/transactions - Create transaction")
    print("  GET  /api/transactions/summary - Get financial summary")
    print("  PUT  /api/transactions/<id> - Update transaction")
    print("  DELETE /api/transactions/<id> - Delete transaction")
    
    app.run(host='0.0.0.0', port=port, debug=debug)