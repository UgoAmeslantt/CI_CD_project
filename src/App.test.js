import { render, screen, fireEvent, act } from "@testing-library/react";
import App from "./App";
import axios from "axios";

jest.mock("axios");

// ============================================================
// Tests d'intégration — Composant App (Formulaire d'inscription)
// ============================================================

// Mock du localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  sessionStorage.clear();
  jest.useFakeTimers();

  // Axios dynamic mock implementation
  axios.get.mockImplementation((url, config) => {
    const stored = localStorageMock.getItem("users");
    const users = stored ? JSON.parse(stored) : [];
    return Promise.resolve({ data: { utilisateurs: users } });
  });

  axios.post.mockImplementation((url, data) => {
    return Promise.resolve({ data: { status: "success" } });
  });

  axios.delete.mockImplementation((url, config) => {
    return Promise.resolve({ data: { status: "success" } });
  });
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// Données valides pour les tests
const validData = {
  nom: "Dupont",
  prenom: "Jean",
  email: "jean.dupont@email.fr",
  dateNaissance: "1990-05-15",
  ville: "Paris",
  codePostal: "75001",
};

/**
 * Helper : remplit tous les champs du formulaire avec les données fournies.
 */
function fillForm(data) {
  fireEvent.change(screen.getByLabelText("Nom"), { target: { value: data.nom, name: "nom" } });
  fireEvent.change(screen.getByLabelText("Prénom"), { target: { value: data.prenom, name: "prenom" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: data.email, name: "email" } });
  fireEvent.change(screen.getByLabelText("Date de naissance"), {
    target: { value: data.dateNaissance, name: "dateNaissance" },
  });
  fireEvent.change(screen.getByLabelText("Ville"), { target: { value: data.ville, name: "ville" } });
  fireEvent.change(screen.getByLabelText("Code postal"), {
    target: { value: data.codePostal, name: "codePostal" },
  });
}

// ============================================================
// Rendu initial
// ============================================================
describe("Rendu initial du formulaire", () => {
  test("affiche le titre Inscription", () => {
    render(<App />);
    expect(screen.getByText("Inscription")).toBeInTheDocument();
  });

  test("affiche tous les champs du formulaire", () => {
    render(<App />);
    expect(screen.getByLabelText("Nom")).toBeInTheDocument();
    expect(screen.getByLabelText("Prénom")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Date de naissance")).toBeInTheDocument();
    expect(screen.getByLabelText("Ville")).toBeInTheDocument();
    expect(screen.getByLabelText("Code postal")).toBeInTheDocument();
  });

  test("affiche le bouton S'inscrire", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /s'inscrire/i })).toBeInTheDocument();
  });

  test("n'affiche pas de message d'erreur au chargement", () => {
    render(<App />);
    expect(screen.queryByTestId("error-nom")).not.toBeInTheDocument();
    expect(screen.queryByTestId("error-prenom")).not.toBeInTheDocument();
    expect(screen.queryByTestId("error-email")).not.toBeInTheDocument();
    expect(screen.queryByTestId("error-dateNaissance")).not.toBeInTheDocument();
    expect(screen.queryByTestId("error-ville")).not.toBeInTheDocument();
    expect(screen.queryByTestId("error-codePostal")).not.toBeInTheDocument();
  });

  test("n'affiche pas de toaster au chargement", () => {
    render(<App />);
    expect(screen.queryByTestId("toaster-success")).not.toBeInTheDocument();
  });

  test("n'affiche pas la liste des inscrits si le localStorage est vide", () => {
    render(<App />);
    expect(screen.queryByTestId("users-list")).not.toBeInTheDocument();
  });

  test("charge les utilisateurs existants depuis le localStorage au montage", () => {
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify([validData]));
    render(<App />);
    expect(screen.getByTestId("users-list")).toBeInTheDocument();
    expect(screen.getByTestId("user-card-0")).toBeInTheDocument();
    expect(screen.getByText("Jean Dupont")).toBeInTheDocument();
  });
});

// ============================================================
// Désactivation du bouton
// ============================================================
describe("Désactivation du bouton si les champs ne sont pas remplis", () => {
  test("le bouton est désactivé quand le formulaire est vide", () => {
    render(<App />);
    const button = screen.getByRole("button", { name: /s'inscrire/i });
    expect(button).toBeDisabled();
  });

  test("le bouton est désactivé quand seulement certains champs sont remplis", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Nom"), { target: { value: "Dupont", name: "nom" } });
    fireEvent.change(screen.getByLabelText("Prénom"), { target: { value: "Jean", name: "prenom" } });

    const button = screen.getByRole("button", { name: /s'inscrire/i });
    expect(button).toBeDisabled();
  });

  test("le bouton est activé quand tous les champs sont remplis", () => {
    render(<App />);
    fillForm(validData);

    const button = screen.getByRole("button", { name: /s'inscrire/i });
    expect(button).not.toBeDisabled();
  });

  test("le bouton redevient désactivé si un champ est vidé", () => {
    render(<App />);
    fillForm(validData);

    const button = screen.getByRole("button", { name: /s'inscrire/i });
    expect(button).not.toBeDisabled();

    // Vider le champ nom
    fireEvent.change(screen.getByLabelText("Nom"), { target: { value: "", name: "nom" } });
    expect(button).toBeDisabled();
  });
});

// ============================================================
// Validation du formulaire — Erreurs en rouge
// ============================================================
describe("Erreurs correspondantes en rouge sous chaque champ", () => {
  test("affiche toutes les erreurs quand on soumet avec des valeurs invalides", () => {
    render(<App />);
    fillForm({
      nom: "123",
      prenom: "456",
      email: "invalid",
      dateNaissance: "2020-01-01",
      ville: "789",
      codePostal: "ABC",
    });
    fireEvent.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(screen.getByTestId("error-nom")).toBeInTheDocument();
    expect(screen.getByTestId("error-prenom")).toBeInTheDocument();
    expect(screen.getByTestId("error-email")).toBeInTheDocument();
    expect(screen.getByTestId("error-dateNaissance")).toBeInTheDocument();
    expect(screen.getByTestId("error-ville")).toBeInTheDocument();
    expect(screen.getByTestId("error-codePostal")).toBeInTheDocument();
  });

  test("les messages d'erreur ont la classe CSS 'error' (rouge)", () => {
    render(<App />);
    fillForm({ ...validData, nom: "123" });
    fireEvent.click(screen.getByRole("button", { name: /s'inscrire/i }));

    const errorSpan = screen.getByTestId("error-nom");
    expect(errorSpan).toHaveClass("error");
  });

  test("les champs invalides ont la classe CSS 'input-error'", () => {
    render(<App />);
    fillForm({ ...validData, nom: "123" });
    fireEvent.click(screen.getByRole("button", { name: /s'inscrire/i }));

    const nomInput = screen.getByLabelText("Nom");
    expect(nomInput).toHaveClass("input-error");
  });

  test("affiche l'erreur pour un nom invalide uniquement", () => {
    render(<App />);
    fillForm({ ...validData, nom: "123" });
    fireEvent.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(screen.getByTestId("error-nom")).toBeInTheDocument();
    expect(screen.queryByTestId("error-email")).not.toBeInTheDocument();
  });

  test("affiche l'erreur pour un prénom invalide", () => {
    render(<App />);
    fillForm({ ...validData, prenom: "456" });
    fireEvent.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(screen.getByTestId("error-prenom")).toBeInTheDocument();
  });

  test("affiche l'erreur pour un email invalide", () => {
    render(<App />);
    fillForm({ ...validData, email: "invalid-email" });
    fireEvent.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(screen.getByTestId("error-email")).toBeInTheDocument();
  });

  test("affiche l'erreur pour un mineur", () => {
    render(<App />);
    const minorDate = new Date();
    minorDate.setFullYear(minorDate.getFullYear() - 10);
    fillForm({ ...validData, dateNaissance: minorDate.toISOString().split("T")[0] });
    fireEvent.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(screen.getByTestId("error-dateNaissance")).toHaveTextContent("au moins 18 ans");
  });

  test("affiche l'erreur pour un code postal invalide", () => {
    render(<App />);
    fillForm({ ...validData, codePostal: "ABC" });
    fireEvent.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(screen.getByTestId("error-codePostal")).toBeInTheDocument();
  });

  test("affiche l'erreur pour une ville invalide", () => {
    render(<App />);
    fillForm({ ...validData, ville: "123" });
    fireEvent.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(screen.getByTestId("error-ville")).toBeInTheDocument();
  });
});

// ============================================================
// Effacement des erreurs en temps réel
// ============================================================
describe("Effacement des erreurs lors de la modification des champs", () => {
  test("efface l'erreur du nom quand on modifie le champ nom", () => {
    render(<App />);
    fillForm({ ...validData, nom: "123" });
    fireEvent.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(screen.getByTestId("error-nom")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Nom"), {
      target: { value: "Dupont", name: "nom" },
    });

    expect(screen.queryByTestId("error-nom")).not.toBeInTheDocument();
  });

  test("efface l'erreur de l'email quand on modifie le champ email", () => {
    render(<App />);
    fillForm({ ...validData, email: "bad" });
    fireEvent.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(screen.getByTestId("error-email")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@test.com", name: "email" },
    });

    expect(screen.queryByTestId("error-email")).not.toBeInTheDocument();
  });
});

// ============================================================
// Toaster de succès + vidage des champs
// ============================================================
describe("Toaster de succès et vidage des champs", () => {
  test("affiche le toaster de succès après soumission valide", () => {
    render(<App />);
    fillForm(validData);
    fireEvent.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(screen.getByTestId("toaster-success")).toBeInTheDocument();
    expect(screen.getByTestId("toaster-success")).toHaveTextContent("Inscription réussie");
  });

  test("vide tous les champs après soumission réussie", () => {
    render(<App />);
    fillForm(validData);
    fireEvent.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(screen.getByLabelText("Nom")).toHaveValue("");
    expect(screen.getByLabelText("Prénom")).toHaveValue("");
    expect(screen.getByLabelText("Email")).toHaveValue("");
    expect(screen.getByLabelText("Date de naissance")).toHaveValue("");
    expect(screen.getByLabelText("Ville")).toHaveValue("");
    expect(screen.getByLabelText("Code postal")).toHaveValue("");
  });

  test("le bouton redevient désactivé après vidage des champs", () => {
    render(<App />);
    fillForm(validData);
    fireEvent.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(screen.getByRole("button", { name: /s'inscrire/i })).toBeDisabled();
  });

  test("le toaster disparaît après 3 secondes", () => {
    render(<App />);
    fillForm(validData);
    fireEvent.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(screen.getByTestId("toaster-success")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.queryByTestId("toaster-success")).not.toBeInTheDocument();
  });

  test("n'affiche PAS le toaster si le formulaire est invalide", () => {
    render(<App />);
    fillForm({ ...validData, email: "invalid" });
    fireEvent.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(screen.queryByTestId("toaster-success")).not.toBeInTheDocument();
  });
});

// ============================================================
// Sauvegarde dans le localStorage
// ============================================================
describe("Validation dans le localStorage", () => {
  test("sauvegarde les données dans le localStorage après soumission valide", () => {
    render(<App />);
    fillForm(validData);
    fireEvent.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "users",
      JSON.stringify([validData])
    );
  });

  test("ne sauvegarde PAS dans le localStorage si le formulaire est invalide", () => {
    render(<App />);
    fillForm({ ...validData, email: "invalid" });
    fireEvent.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  test("ajoute un nouvel utilisateur à la liste existante dans le localStorage", () => {
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify([validData]));
    render(<App />);

    const secondUser = {
      nom: "Martin",
      prenom: "Marie",
      email: "marie.martin@email.fr",
      dateNaissance: "1995-08-20",
      ville: "Lyon",
      codePostal: "69001",
    };
    fillForm(secondUser);
    fireEvent.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "users",
      JSON.stringify([validData, secondUser])
    );
  });
});

// ============================================================
// Liste des inscrits
// ============================================================
describe("Affichage de la liste des inscrits", () => {
  test("affiche la liste des inscrits après une inscription", () => {
    render(<App />);
    fillForm(validData);
    fireEvent.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(screen.getByTestId("users-list")).toBeInTheDocument();
    expect(screen.getByTestId("user-card-0")).toBeInTheDocument();
    expect(screen.getByText("Jean Dupont")).toBeInTheDocument();
  });

  test("affiche le nombre d'inscrits", () => {
    render(<App />);
    fillForm(validData);
    fireEvent.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(screen.getByText(/inscrits \(1\)/i)).toBeInTheDocument();
  });

  test("affiche les détails de l'utilisateur inscrit", () => {
    render(<App />);
    fillForm(validData);
    fireEvent.click(screen.getByRole("button", { name: /s'inscrire/i }));

    const card = screen.getByTestId("user-card-0");
    expect(card).toHaveTextContent("jean.dupont@email.fr");
    expect(card).toHaveTextContent("Paris");
    expect(card).toHaveTextContent("75001");
  });
});

// ============================================================
// Espace Administration
// ============================================================
describe("Espace Administration", () => {
  test("affiche le bouton Espace Admin au chargement", () => {
    render(<App />);
    expect(screen.getByTestId("admin-toggle-btn")).toHaveTextContent("Espace Admin");
  });

  test("affiche le formulaire de connexion admin au clic sur le bouton", () => {
    render(<App />);
    const toggleBtn = screen.getByTestId("admin-toggle-btn");
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId("login-container")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Mot de passe")).toBeInTheDocument();
  });

  test("connexion admin avec succès et affichage des contrôles admin", async () => {
    axios.post.mockResolvedValueOnce({
      data: { token: "admin-token-ugo", user: { email: "ugo.ameslant@ynov.com" } }
    });
    axios.get.mockResolvedValueOnce({
      data: {
        utilisateurs: [
          {
            id: 1,
            nom: "Dupont",
            prenom: "Jean",
            email: "jean.dupont@email.fr",
            dateNaissance: "1990-05-15",
            ville: "Paris",
            codePostal: "75001",
            is_admin: false
          }
        ]
      }
    });

    render(<App />);
    fireEvent.click(screen.getByTestId("admin-toggle-btn"));

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ugo.ameslant@ynov.com" } });
    fireEvent.change(screen.getByLabelText("Mot de passe"), { target: { value: "PvdrTAzTeR247sDnAZBr" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));
    });

    expect(screen.getByTestId("admin-toggle-btn")).toHaveTextContent("Déconnexion Admin");
    
    expect(screen.getByTestId("user-email-0")).toHaveTextContent("jean.dupont@email.fr");
    expect(screen.getByTestId("user-date-0")).toHaveTextContent("1990-05-15");
    
    expect(screen.getByTestId("delete-btn-0")).toBeInTheDocument();
  });

  test("suppression d'un utilisateur par l'admin", async () => {
    axios.post.mockResolvedValueOnce({
      data: { token: "admin-token-ugo", user: { email: "ugo.ameslant@ynov.com" } }
    });
    axios.get.mockResolvedValueOnce({
      data: {
        utilisateurs: [
          {
            id: 1,
            nom: "Dupont",
            prenom: "Jean",
            email: "jean.dupont@email.fr",
            dateNaissance: "1990-05-15",
            ville: "Paris",
            codePostal: "75001",
            is_admin: false
          }
        ]
      }
    });
    axios.delete.mockResolvedValueOnce({ data: { status: "success" } });
    axios.get.mockResolvedValueOnce({ data: { utilisateurs: [] } });

    render(<App />);
    fireEvent.click(screen.getByTestId("admin-toggle-btn"));

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ugo.ameslant@ynov.com" } });
    fireEvent.change(screen.getByLabelText("Mot de passe"), { target: { value: "PvdrTAzTeR247sDnAZBr" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));
    });

    const deleteBtn = screen.getByTestId("delete-btn-0");
    await act(async () => {
      fireEvent.click(deleteBtn);
    });

    expect(axios.delete).toHaveBeenCalledWith(
      expect.stringContaining("/users/1"),
      expect.any(Object)
    );
  });
});

