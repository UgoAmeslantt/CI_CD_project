import { useState, useEffect } from "react";
import { validateForm } from "./validators";
import "./App.css";

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

  // Charger la liste des inscrits depuis le localStorage au montage
  useEffect(() => {
    const stored = localStorage.getItem("users");
    if (stored) {
      setUsers(JSON.parse(stored));
    }
  }, []);

  /**
   * Vérifie si tous les champs sont remplis (non vides).
   * Utilisé pour désactiver le bouton.
   */
  const isFormFilled = () => {
    return Object.values(formData).every((value) => value.trim().length > 0);
  };

  /**
   * Met à jour le state du formulaire à chaque changement de champ.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Efface l'erreur du champ modifié
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /**
   * Soumet le formulaire : valide les données, sauvegarde dans le localStorage,
   * affiche un toaster de succès et vide les champs.
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    setToaster(false);

    const result = validateForm(formData);

    if (!result.isValid) {
      setErrors(result.errors);
      return;
    }

    // Sauvegarder dans la liste des utilisateurs
    const updatedUsers = [...users, formData];
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    setUsers(updatedUsers);

    // Réinitialiser le formulaire
    setFormData({
      nom: "",
      prenom: "",
      email: "",
      dateNaissance: "",
      ville: "",
      codePostal: "",
    });
    setErrors({});

    // Afficher le toaster
    setToaster(true);
    setTimeout(() => {
      setToaster(false);
    }, 3000);
  };

  return (
    <div className="App">
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

      {/* Liste des inscrits */}
      {users.length > 0 && (
        <div className="users-container" data-testid="users-list">
          <h2>Inscrits ({users.length})</h2>
          <div className="users-grid">
            {users.map((user, index) => (
              <div key={index} className="user-card" data-testid={`user-card-${index}`}>
                <div className="user-name">{user.prenom} {user.nom}</div>
                <div className="user-detail">📧 {user.email}</div>
                <div className="user-detail">📅 {user.dateNaissance}</div>
                <div className="user-detail">📍 {user.ville}, {user.codePostal}</div>
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
