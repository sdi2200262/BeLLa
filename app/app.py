# Flask app
from flask import Flask, render_template, request
import os
import sqlite3  # Added SQLite support

app = Flask(__name__)

# Set up the upload folder
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'static', 'uploads')  # Path to be inside static folder
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/')
def home():
    # Get list of files in the upload directory
    files = os.listdir(app.config['UPLOAD_FOLDER'])
    # Filter to include only image files
    files = [f for f in files if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp'))]
    return render_template('index.html', files=files)  # Pass files to template

# File upload route
@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['file']
    if file and file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)
        return render_template('upload_success.html', filename=file.filename)  # Show success page
    return "Invalid file type! Only image files are allowed.", 400

# Discussion board route with SQLite
@app.route('/discussion', methods=['GET', 'POST'])
def discussion():
    conn = sqlite3.connect('app/data/data.db')  # Path to the SQLite database
    cursor = conn.cursor()

    if request.method == 'POST':
        message = request.form['message']
        cursor.execute('INSERT INTO messages (content) VALUES (?)', (message,))
        conn.commit()

    # Fetch all messages
    cursor.execute('SELECT content FROM messages')
    discussions = [row[0] for row in cursor.fetchall()]
    conn.close()

    return render_template('discussion.html', messages=discussions)

if __name__ == '__main__':
    app.run(debug=True)  # Start the Flask app
