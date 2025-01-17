import sqlite3

def init_db():
    conn = sqlite3.connect('app/data/data.db')  # Database file path
    cursor = conn.cursor()

    # Create a table for storing messages
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

# Initialize the database when this script is run
if __name__ == '__main__':
    init_db()
