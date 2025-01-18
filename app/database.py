import sqlite3
from datetime import datetime
import os

def get_db():
    db = sqlite3.connect('app/data/uploads.db')
    db.row_factory = sqlite3.Row
    return db

def init_db():
    db = get_db()
    # Create the files table if it doesn't exist
    db.execute('''
        CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name TEXT NOT NULL,
            upload_date TIMESTAMP NOT NULL,
            readme_name TEXT,
            has_readme BOOLEAN NOT NULL DEFAULT FALSE
        )
    ''')
    db.commit()
    db.close()

def add_file(file_name, readme_name=None):
    db = get_db()
    c = db.cursor()
    
    has_readme = bool(readme_name)
    
    c.execute('''
        INSERT INTO files (file_name, readme_name, upload_date, has_readme)
        VALUES (?, ?, ?, ?)
    ''', (file_name, readme_name, datetime.now(), has_readme))
    
    db.commit()
    db.close()

def get_all_files():
    db = get_db()
    c = db.cursor()
    
    c.execute('SELECT * FROM files ORDER BY upload_date DESC')
    files = c.fetchall()
    
    db.close()
    
    return files

def get_file_info(file_name):
    db = get_db()
    c = db.cursor()
    
    c.execute('SELECT * FROM files WHERE file_name = ?', (file_name,))
    file_info = c.fetchone()
    
    db.close()
    
    return file_info

def sync_files():
    """Synchronize the database with the actual files in the uploads folder"""
    db = get_db()
    c = db.cursor()
    
    # Get all files from database
    c.execute('SELECT file_name, readme_name FROM files')
    db_files = c.fetchall()
    
    # Get all files from uploads folder
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app', 'uploads')
    actual_files = set(os.listdir(upload_dir)) if os.path.exists(upload_dir) else set()
    
    # Remove database entries for files that don't exist
    for db_file in db_files:
        file_name = db_file[0]
        readme_name = db_file[1]
        
        if file_name not in actual_files:
            c.execute('DELETE FROM files WHERE file_name = ?', (file_name,))
        elif readme_name and readme_name not in actual_files:
            # Update has_readme to False if readme file is missing
            c.execute('''
                UPDATE files 
                SET readme_name = NULL, has_readme = FALSE 
                WHERE file_name = ?
            ''', (file_name,))
    
    db.commit()
    db.close()
