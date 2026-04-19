# connect to the database using psycopg2
import psycopg2
from config import DATABASE_URL

def connect_to_database():
    conn = psycopg2.connect(DATABASE_URL)
    return conn

def close_database_connection(conn):
    conn.close()