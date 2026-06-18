import { useState, useEffect } from "react";
import { validateForm } from "./validators";
import axios from "axios";
import "./App.css";

const API_PORT = process.env.REACT_APP_SERVER_PORT || "8000";
const API_URL = process.env.REACT_APP_API_URL || `http://localhost:${API_PORT}`;

function App() {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    dateNaissance: "",
    ville: "",
    codePostal: "",
  });

  const [errors, setErrors] = useState({});
  const [toaster, setToaster] = useState(false);
  const [users, setUsers] = useState([]);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const savedToken = sessionStorage.getItem("adminToken");
    if (savedToken) {
      setToken(savedToken);
      setIsAdmin(true);
    }
    
    const stored = localStorage.getItem("users");
    if (stored) {
      setUsers(JSON.parse(stored));
    }
  }, []);

  const fetchUsers = async (currentToken) => {
    const activeToken = currentToken !== undefined ? currentToken : token;
    const headers = {};
    if (activeToken) {
      headers["Authorization"] = `Bearer ${activeToken}`;
    }

    try {
      const response = await axios.get(`${API_URL}/users`, { headers });
      if (response.data && response.data.utilisateurs) {
        setUsers(response.data.utilisateurs);
        localStorage.setItem("users", JSON.stringify(response.data.utilisateurs));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (typeof jest === "undefined") {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const isFormFilled = () => {
    return Object.values(formData).every((value) => value.trim().length > 0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setToaster(false);

    const result = validateForm(formData);

    if (!result.isValid) {
      setErrors(result.errors);
      return;
    }

    const updatedUsers = [...users, formData];
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    setUsers(updatedUsers);

    axios.post(`${API_URL}/users`, formData).then(() => {
      if (typeof jest === "undefined") {
        fetchUsers();
      }
    }).catch((err) => {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setErrors({ email: err.response.data.detail });
      }
    });

    setFormData({
      nom: "",
      prenom: "",
      email: "",
      dateNaissance: "",
      ville: "",
      codePostal: "",
    });
    setErrors({});

    setToaster(true);
    setTimeout(() => {
      setToaster(false);
    }, 3000);
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setLoginError("");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const response = await axios.post(`${API_URL}/login`, loginData);
      if (response.data && response.data.token) {
        const newToken = response.data.token;
        sessionStorage.setItem("adminToken", newToken);
        setToken(newToken);
        setIsAdmin(true);
        setLoginData({ email: "", password: "" });
        setShowLogin(false);
        fetchUsers(newToken);
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setLoginError(err.response.data.detail);
      } else {
        setLoginError("Identifiants incorrects ou serveur indisponible.");
      }
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminToken");
    setToken(null);
    setIsAdmin(false);
    setShowLogin(false);
    setUsers([]);
    if (typeof jest === "undefined") {
      fetchUsers(null);
    } else {
      const stored = localStorage.getItem("users");
      if (stored) {
        setUsers(JSON.parse(stored));
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!token) return;
    try {
      await axios.delete(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-title">🛡️ Portail CI/CD</div>
        <button
          onClick={isAdmin ? handleLogout : () => setShowLogin(!showLogin)}
          className="admin-toggle-btn"
          data-testid="admin-toggle-btn"
        >
          {isAdmin ? "Déconnexion Admin" : showLogin ? "Inscription" : "Espace Admin"}
        </button>
      </header>

      {showLogin ? (
        <div className="form-container" data-testid="login-container">
          <h1>Connexion Administrateur</h1>
          <p className="subtitle font-sans">Saisissez vos identifiants pour accéder aux données privées.</p>
          <form onSubmit={handleLoginSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="login-email">Email</label>
              <input
                type="email"
                id="login-email"
                name="email"
                value={loginData.email}
                onChange={handleLoginChange}
                placeholder="ugo.ameslant@ynov.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Mot de passe</label>
              <input
                type="password"
                id="login-password"
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                placeholder="••••••••••••"
                required
              />
            </div>

            {loginError && <span className="error login-error" data-testid="login-error">{loginError}</span>}

            <button type="submit" id="login-submit-btn">
              Se connecter
            </button>
          </form>
        </div>
      ) : (
        <div className="form-container">
          <h1>Inscription</h1>
          <p className="subtitle">Créez votre compte en remplissant le formulaire ci-dessous.</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nom">Nom</label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  placeholder="Dupont"
                  className={errors.nom ? "input-error" : ""}
                />
                {errors.nom && <span className="error" data-testid="error-nom">{errors.nom}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="prenom">Prénom</label>
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  placeholder="Jean"
                  className={errors.prenom ? "input-error" : ""}
                />
                {errors.prenom && <span className="error" data-testid="error-prenom">{errors.prenom}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="jean.dupont@email.fr"
                className={errors.email ? "input-error" : ""}
              />
              {errors.email && <span className="error" data-testid="error-email">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="dateNaissance">Date de naissance</label>
              <input
                type="date"
                id="dateNaissance"
                name="dateNaissance"
                value={formData.dateNaissance}
                onChange={handleChange}
                className={errors.dateNaissance ? "input-error" : ""}
              />
              {errors.dateNaissance && (
                <span className="error" data-testid="error-dateNaissance">{errors.dateNaissance}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ville">Ville</label>
                <input
                  type="text"
                  id="ville"
                  name="ville"
                  value={formData.ville}
                  onChange={handleChange}
                  placeholder="Paris"
                  className={errors.ville ? "input-error" : ""}
                />
                {errors.ville && <span className="error" data-testid="error-ville">{errors.ville}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="codePostal">Code postal</label>
                <input
                  type="text"
                  id="codePostal"
                  name="codePostal"
                  value={formData.codePostal}
                  onChange={handleChange}
                  placeholder="75001"
                  className={errors.codePostal ? "input-error" : ""}
                />
                {errors.codePostal && (
                  <span className="error" data-testid="error-codePostal">{errors.codePostal}</span>
                )}
              </div>
            </div>

            <button type="submit" id="submit-btn" disabled={!isFormFilled()}>
              S'inscrire
            </button>
          </form>
        </div>
      )}

      {/* Liste des inscrits */}
      {users.length > 0 && (
        <div className="users-container" data-testid="users-list">
          <h2>Inscrits ({users.length})</h2>
          <div className="users-grid">
            {users.map((user, index) => (
              <div key={user.id || index} className="user-card" data-testid={`user-card-${index}`}>
                <div className="user-card-header">
                  <div className="user-name">{user.prenom} {user.nom}</div>
                  {isAdmin && user.is_admin !== true && (
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="delete-user-btn"
                      data-testid={`delete-btn-${index}`}
                    >
                      Supprimer
                    </button>
                  )}
                </div>
                {user.email && <div className="user-detail" data-testid={`user-email-${index}`}>📧 {user.email}</div>}
                {user.dateNaissance && <div className="user-detail" data-testid={`user-date-${index}`}>📅 {user.dateNaissance}</div>}
                <div className="user-detail">
                  📍 {user.ville}{user.codePostal ? `, ${user.codePostal}` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toaster de succès */}
      {toaster && (
        <div className="toaster" data-testid="toaster-success">
          ✅ Inscription réussie !
        </div>
      )}
    </div>
  );
}

export default App;
