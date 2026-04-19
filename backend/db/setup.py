from db.db import connect_to_database

def run_schema():
    conn = connect_to_database()
    cursor = conn.cursor()
    with open('schema.sql', 'r') as file:
        cursor.execute(file.read())
    conn.commit()
    cursor.close()
    conn.close()

if __name__ == "__main__":
    run_schema()