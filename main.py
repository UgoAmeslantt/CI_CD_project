import mysql.connector
import os
import time
from typing import Optional
from fastapi import FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ADMIN_TOKEN = "admin-token-ugo"

def get_db_connection():
    return mysql.connector.connect(
        database=os.getenv("MYSQL_DATABASE"),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_ROOT_PASSWORD"),
        port=3306,
        host=os.getenv("MYSQL_HOST")
    )

def init_db():
    retries = 10
    while retries > 0:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            # Création de la table si elle n'existe pas
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS utilisateur (
                id INT AUTO_INCREMENT PRIMARY KEY,
                last_name VARCHAR(100),
                first_name VARCHAR(100),
                email VARCHAR(255) UNIQUE NOT NULL,
                birth_date DATE,
                city VARCHAR(100),
                zip_code VARCHAR(5),
                password VARCHAR(255) NULL,
                is_admin BOOLEAN DEFAULT FALSE
            );
            """)
            conn.commit()
            
            # Vérification de l'administrateur par défaut
            admin_email = os.getenv("ADMIN_EMAIL", "ugo.ameslant@ynov.com")
            admin_password = os.getenv("ADMIN_PASSWORD", "PvdrTAzTeR247sDnAZBr")
            cursor.execute("SELECT id FROM utilisateur WHERE email = %s", (admin_email,))
            admin = cursor.fetchone()
            if not admin:
                cursor.execute("""
                INSERT INTO utilisateur (last_name, first_name, email, password, is_admin)
                VALUES (%s, %s, %s, %s, %s)
                """, ("Ameslant", "Ugo", admin_email, admin_password, True))
                conn.commit()
            cursor.close()
            conn.close()
            print("Database initialized successfully!")
            break
        except Exception as e:
            print(f"Database connection failed: {e}. Retrying in 2 seconds...")
            retries -= 1
            time.sleep(2)

@app.on_event("startup")
async def startup_event():
    init_db()

class UserRegister(BaseModel):
    nom: str
    prenom: str
    email: str
    dateNaissance: str
    ville: str
    codePostal: str

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/login")
async def login(req: LoginRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT id, first_name, last_name, email, is_admin FROM utilisateur WHERE email = %s AND password = %s",
            (req.email, req.password)
        )
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not user or not user["is_admin"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Identifiants incorrects ou vous n'êtes pas administrateur."
            )
            
        return {
            "token": ADMIN_TOKEN,
            "user": {
                "email": user["email"],
                "first_name": user["first_name"],
                "last_name": user["last_name"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur serveur: {str(e)}"
        )

@app.post("/users")
async def register_user(user: UserRegister):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Vérification si l'email existe déjà
        cursor.execute("SELECT id FROM utilisateur WHERE email = %s", (user.email,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cet email est déjà utilisé."
            )
            
        cursor.execute("""
            INSERT INTO utilisateur (last_name, first_name, email, birth_date, city, zip_code, password, is_admin)
            VALUES (%s, %s, %s, %s, %s, %s, NULL, FALSE)
        """, (user.nom, user.prenom, user.email, user.dateNaissance, user.ville, user.codePostal))
        conn.commit()
        cursor.close()
        conn.close()
        return {"status": "success", "message": "Inscription réussie"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur serveur: {str(e)}"
        )

@app.get("/users")
async def get_users(authorization: Optional[str] = Header(None)):
    is_admin = (authorization == f"Bearer {ADMIN_TOKEN}")
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM utilisateur")
        records = cursor.fetchall()
        cursor.close()
        conn.close()
        
        formatted_users = []
        for row in records:
            if is_admin:
                # Informations privées complètes pour l'admin
                formatted_users.append({
                    "id": row["id"],
                    "nom": row["last_name"],
                    "prenom": row["first_name"],
                    "email": row["email"],
                    "dateNaissance": str(row["birth_date"]) if row["birth_date"] else None,
                    "ville": row["city"],
                    "codePostal": row["zip_code"],
                    "is_admin": bool(row["is_admin"])
                })
            else:
                # Informations réduites pour le public
                formatted_users.append({
                    "id": row["id"],
                    "nom": row["last_name"],
                    "prenom": row["first_name"],
                    "ville": row["city"]
                })
        return {'utilisateurs': formatted_users}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur de base de données: {str(e)}"
        )

@app.delete("/users/{user_id}")
async def delete_user(user_id: int, authorization: Optional[str] = Header(None)):
    if authorization != f"Bearer {ADMIN_TOKEN}":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Action non autorisée. Réservée aux administrateurs."
        )
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM utilisateur WHERE id = %s AND is_admin = FALSE", (user_id,))
        conn.commit()
        deleted_count = cursor.rowcount
        cursor.close()
        conn.close()
        
        if deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur introuvable ou vous essayez de supprimer un administrateur."
            )
            
        return {"status": "success", "message": "Utilisateur supprimé"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur de base de données: {str(e)}"
        )