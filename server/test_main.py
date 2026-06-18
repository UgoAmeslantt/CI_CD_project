import pytest
from fastapi.testclient import TestClient
import sys
import os

# Ajout du chemin d'accès pour l'import
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app, ADMIN_TOKEN

client = TestClient(app)

@pytest.fixture(autouse=True)
def mock_db(monkeypatch):
    class DummyCursor:
        def execute(self, query, params=None):
            pass
        def fetchone(self):
            return None
        def fetchall(self):
            return []
        def close(self):
            pass
            
    class DummyConn:
        def cursor(self, dictionary=False):
            return DummyCursor()
        def commit(self):
            pass
        def close(self):
            pass

    monkeypatch.setattr("main.get_db_connection", lambda: DummyConn())

def test_login_invalid():
    # Identifiants erronés
    response = client.post("/login", json={"email": "wrong@email.com", "password": "wrongpassword"})
    assert response.status_code == 401

def test_login_success(monkeypatch):
    # Identifiants corrects
    class DummyCursor:
        def execute(self, query, params=None):
            pass
        def fetchone(self):
            return {
                "id": 1,
                "first_name": "Ugo",
                "last_name": "Ameslant",
                "email": "ugo.ameslant@ynov.com",
                "is_admin": 1
            }
        def close(self):
            pass
            
    class DummyConn:
        def cursor(self, dictionary=False):
            return DummyCursor()
        def close(self):
            pass

    monkeypatch.setattr("main.get_db_connection", lambda: DummyConn())

    response = client.post("/login", json={"email": "ugo.ameslant@ynov.com", "password": "PvdrTAzTeR247sDnAZBr"})
    assert response.status_code == 200
    assert response.json()["token"] == ADMIN_TOKEN

def test_get_users_public(monkeypatch):
    # Mock des données utilisateur
    mock_users = [
        {"id": 1, "last_name": "Dupont", "first_name": "Jean", "email": "jean.dupont@email.fr", "birth_date": None, "city": "Paris", "zip_code": "75001", "is_admin": 0}
    ]
    
    class DummyCursor:
        def execute(self, query, params=None):
            pass
        def fetchall(self):
            return mock_users
        def close(self):
            pass
            
    class DummyConn:
        def cursor(self, dictionary=False):
            return DummyCursor()
        def close(self):
            pass

    monkeypatch.setattr("main.get_db_connection", lambda: DummyConn())

    # Mode public (sans Token)
    response = client.get("/users")
    assert response.status_code == 200
    data = response.json()
    assert "utilisateurs" in data
    assert len(data["utilisateurs"]) == 1
    
    # Validation de l'anonymisation des données
    user = data["utilisateurs"][0]
    assert user["nom"] == "Dupont"
    assert "email" not in user
    assert "codePostal" not in user

def test_get_users_admin(monkeypatch):
    # Mock des données utilisateur
    mock_users = [
        {"id": 1, "last_name": "Dupont", "first_name": "Jean", "email": "jean.dupont@email.fr", "birth_date": None, "city": "Paris", "zip_code": "75001", "is_admin": 0}
    ]
    
    class DummyCursor:
        def execute(self, query, params=None):
            pass
        def fetchall(self):
            return mock_users
        def close(self):
            pass
            
    class DummyConn:
        def cursor(self, dictionary=False):
            return DummyCursor()
        def close(self):
            pass

    monkeypatch.setattr("main.get_db_connection", lambda: DummyConn())

    # Mode admin (avec Token)
    headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
    response = client.get("/users", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["utilisateurs"]) == 1
    
    # Validation de la présence des informations privées
    user = data["utilisateurs"][0]
    assert user["nom"] == "Dupont"
    assert user["email"] == "jean.dupont@email.fr"
    assert user["codePostal"] == "75001"

def test_delete_user_not_admin():
    response = client.delete("/users/1")
    assert response.status_code == 403
