import os
from flask import Flask, render_template, request, redirect, url_for, flash, send_from_directory
from dotenv import load_dotenv
from datetime import datetime
from app.database import init_db, add_file, get_all_files, get_file_info, sync_files

load_dotenv()  # Load environment variables from .env file

# Create Flask app with correct template and static folders
app = Flask(__name__, 
           template_folder='app/templates',
           static_folder='app/static')

app.secret_key = os.getenv('SECRET_KEY')  # Use the secure key from .env

# Update the upload folder path to be absolute
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

#route for the home page
@app.route('/')
def index():
    # Homepage with only explanatory text and upload page lin
    return render_template('index.html')

#route for the upload page
@app.route('/upload', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'GET':
        # Sync files before displaying
        sync_files()
    
    if request.method == 'POST':
        if 'file' not in request.files:
            flash('No file part')
            return redirect(url_for('upload_file'))
        
        file = request.files['file']
        
        # Check if a file was selected
        if file.filename == '':
            flash('No selected file')
            return redirect(url_for('upload_file'))
        
        # Check if a readme choice was made
        if 'readmeChoice' not in request.form:
            flash('Please select a documentation option')
            return redirect(url_for('upload_file'))
        
        readme_choice = request.form['readmeChoice']
        
        # Validate readme choice based on selection
        if readme_choice == 'upload' and ('readmeFile' not in request.files or request.files['readmeFile'].filename == ''):
            flash('Please select a README file to upload')
            return redirect(url_for('upload_file'))
        elif readme_choice == 'write' and (not request.form.get('readmeText') or request.form.get('readmeText').strip() == ''):
            flash('Please write some documentation or choose a different option')
            return redirect(url_for('upload_file'))
        
        if file:
            filename = file.filename
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)
            
            readme_name = None
            # Handle README based on choice
            if readme_choice == 'upload':
                if 'readmeFile' in request.files:
                    readme_file = request.files['readmeFile']
                    if readme_file.filename != '':
                        # Create readme filename based on original file
                        readme_name = f"{os.path.splitext(filename)[0]}_readme{os.path.splitext(readme_file.filename)[1]}"
                        readme_path = os.path.join(UPLOAD_FOLDER, readme_name)
                        readme_file.save(readme_path)
                    
            elif readme_choice == 'write':
                readme_content = request.form.get('readmeText')
                if readme_content:
                    # Save written content to a txt file
                    readme_name = f"{os.path.splitext(filename)[0]}_readme.txt"
                    readme_path = os.path.join(UPLOAD_FOLDER, readme_name)
                    with open(readme_path, 'w') as f:
                        f.write(readme_content)
            
            # Save to database with proper import
            add_file(filename, readme_name)
            flash('File uploaded successfully!')
            return redirect(url_for('upload_file'))
    
    # Get files for display using proper import
    files = []
    db_files = get_all_files()
    for file in db_files:
        file_info = {
            'name': file[1],  # file_name
            'has_readme': bool(file[4]),  # has_readme converted to boolean
            'upload_date': file[2]  # upload_date is already a datetime object
        }
        files.append(file_info)
    
    return render_template('upload.html', files=files)

@app.route('/file-view/<filename>')
def file_view(filename):
    # Get file info from database
    file_info = get_file_info(filename)
    
    if file_info is None:
        flash('File not found')
        return redirect(url_for('upload_file'))
    
    # Create file object with required information
    file = {
        'name': file_info[1],  # file_name
        'type': 'image' if any(filename.lower().endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.gif', '.webp']) else 'document',
        'has_readme': bool(file_info[4])  # has_readme
    }
    
    # Get README content if it exists
    readme_content = None
    if file['has_readme'] and file_info[3]:  # file_info[3] is readme_name
        readme_path = os.path.join(UPLOAD_FOLDER, file_info[3])
        if os.path.exists(readme_path):
            with open(readme_path, 'r') as f:
                readme_content = f.read()
    
    return render_template('file_view.html', file=file, readme_content=readme_content)

@app.route('/uploads/<filename>')
def view_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/download/<filename>')
def download_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True)

# Move database initialization to create_app function
def create_app():
    with app.app_context():
        init_db()
    return app

# Add this after creating the Flask app
init_db()  # Initialize the database and create tables

if __name__ == '__main__':
    application = create_app()
    application.run(host='0.0.0.0', port=4200, debug=True)
