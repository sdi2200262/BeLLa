import os
from flask import Flask, render_template, request, redirect, url_for, flash
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY')  # Use the secure key from .env

# Ensure the uploads folder exists
UPLOAD_FOLDER = 'app/uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

#route for the home page
@app.route('/')
def index():
    # Homepage with only explanatory text and upload page lin
    return render_template('index.html')

#route for the upload page
@app.route('/upload', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        if 'file' not in request.files:
            flash('No file part')
            return redirect(url_for('upload_file'))
        
        file = request.files['file']
        
        if file.filename == '':
            flash('No selected file')
            return redirect(url_for('upload_file'))
        
        if file:
            file_path = os.path.join(UPLOAD_FOLDER, file.filename)
            file.save(file_path)
            flash('File uploaded successfully!')
            return redirect(url_for('upload_file'))
    
    # Retrieve the list of uploaded files
    files = os.listdir(UPLOAD_FOLDER)
    return render_template('upload.html', files=files)

if __name__ == '__main__':
    app.run(debug=True)
