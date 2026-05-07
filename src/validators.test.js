import {
  validateName,
  validateEmail,
  validateAge,
  validatePostalCode,
  validateCity,
  validateForm,
} from "./validators";

// ============================================================
// Tests unitaires — validateName (nom / prénom)
// ============================================================
describe("validateName", () => {
  test("retourne invalide si le champ est vide", () => {
    expect(validateName("")).toEqual({ isValid: false, error: "Ce champ est requis." });
  });

  test("retourne invalide si le champ est null", () => {
    expect(validateName(null)).toEqual({ isValid: false, error: "Ce champ est requis." });
  });

  test("retourne invalide si le champ est undefined", () => {
    expect(validateName(undefined)).toEqual({ isValid: false, error: "Ce champ est requis." });
  });

  test("retourne invalide si le champ ne contient que des espaces", () => {
    expect(validateName("   ")).toEqual({ isValid: false, error: "Ce champ est requis." });
  });

  test("retourne invalide si le champ contient des chiffres", () => {
    expect(validateName("Jean123")).toEqual({
      isValid: false,
      error: "Ce champ ne doit contenir que des lettres, espaces, tirets ou apostrophes.",
    });
  });

  test("retourne invalide si le champ contient des caractères spéciaux", () => {
    expect(validateName("Jean@Doe")).toEqual({
      isValid: false,
      error: "Ce champ ne doit contenir que des lettres, espaces, tirets ou apostrophes.",
    });
  });

  test("retourne valide pour un nom simple", () => {
    expect(validateName("Jean")).toEqual({ isValid: true, error: "" });
  });

  test("retourne valide pour un nom composé avec tiret", () => {
    expect(validateName("Jean-Pierre")).toEqual({ isValid: true, error: "" });
  });

  test("retourne valide pour un nom composé avec espace", () => {
    expect(validateName("De La Fontaine")).toEqual({ isValid: true, error: "" });
  });

  test("retourne valide pour un nom avec apostrophe", () => {
    expect(validateName("O'Brien")).toEqual({ isValid: true, error: "" });
  });

  test("retourne valide pour un nom avec accents", () => {
    expect(validateName("Éloïse")).toEqual({ isValid: true, error: "" });
  });
});

// ============================================================
// Tests unitaires — validateEmail
// ============================================================
describe("validateEmail", () => {
  test("retourne invalide si l'email est vide", () => {
    expect(validateEmail("")).toEqual({ isValid: false, error: "L'email est requis." });
  });

  test("retourne invalide si l'email est null", () => {
    expect(validateEmail(null)).toEqual({ isValid: false, error: "L'email est requis." });
  });

  test("retourne invalide si l'email est undefined", () => {
    expect(validateEmail(undefined)).toEqual({ isValid: false, error: "L'email est requis." });
  });

  test("retourne invalide sans @", () => {
    expect(validateEmail("jeandupont.fr")).toEqual({ isValid: false, error: "L'email n'est pas valide." });
  });

  test("retourne invalide sans domaine", () => {
    expect(validateEmail("jean@")).toEqual({ isValid: false, error: "L'email n'est pas valide." });
  });

  test("retourne invalide sans extension", () => {
    expect(validateEmail("jean@dupont")).toEqual({ isValid: false, error: "L'email n'est pas valide." });
  });

  test("retourne valide pour un email correct", () => {
    expect(validateEmail("jean@dupont.fr")).toEqual({ isValid: true, error: "" });
  });

  test("retourne valide pour un email avec sous-domaine", () => {
    expect(validateEmail("jean@mail.dupont.fr")).toEqual({ isValid: true, error: "" });
  });
});

// ============================================================
// Tests unitaires — validateAge
// ============================================================
describe("validateAge", () => {
  test("retourne invalide si la date est vide", () => {
    expect(validateAge("")).toEqual({ isValid: false, error: "La date de naissance est requise." });
  });

  test("retourne invalide si la date est null", () => {
    expect(validateAge(null)).toEqual({ isValid: false, error: "La date de naissance est requise." });
  });

  test("retourne invalide si la date est undefined", () => {
    expect(validateAge(undefined)).toEqual({ isValid: false, error: "La date de naissance est requise." });
  });

  test("retourne invalide pour une date invalide", () => {
    expect(validateAge("not-a-date")).toEqual({ isValid: false, error: "La date de naissance n'est pas valide." });
  });

  test("retourne invalide pour un mineur (moins de 18 ans)", () => {
    // Personne née il y a 10 ans
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    const dateStr = tenYearsAgo.toISOString().split("T")[0];
    expect(validateAge(dateStr)).toEqual({ isValid: false, error: "Vous devez avoir au moins 18 ans." });
  });

  test("retourne invalide pour quelqu'un qui a 17 ans (anniversaire pas encore passé)", () => {
    const almostEighteen = new Date();
    almostEighteen.setFullYear(almostEighteen.getFullYear() - 18);
    almostEighteen.setDate(almostEighteen.getDate() + 1); // anniversaire demain
    const dateStr = almostEighteen.toISOString().split("T")[0];
    expect(validateAge(dateStr)).toEqual({ isValid: false, error: "Vous devez avoir au moins 18 ans." });
  });

  test("retourne valide pour quelqu'un qui a exactement 18 ans aujourd'hui", () => {
    const exactlyEighteen = new Date();
    exactlyEighteen.setFullYear(exactlyEighteen.getFullYear() - 18);
    const dateStr = exactlyEighteen.toISOString().split("T")[0];
    expect(validateAge(dateStr)).toEqual({ isValid: true, error: "" });
  });

  test("retourne valide pour un adulte de 30 ans", () => {
    const thirtyYearsAgo = new Date();
    thirtyYearsAgo.setFullYear(thirtyYearsAgo.getFullYear() - 30);
    const dateStr = thirtyYearsAgo.toISOString().split("T")[0];
    expect(validateAge(dateStr)).toEqual({ isValid: true, error: "" });
  });

  test("retourne invalide pour un mineur dont le mois est le même mais jour pas encore passé", () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    date.setMonth(date.getMonth()); // même mois
    date.setDate(date.getDate() + 2); // jour pas encore passé
    const dateStr = date.toISOString().split("T")[0];
    expect(validateAge(dateStr).isValid).toBe(false);
  });
});

// ============================================================
// Tests unitaires — validatePostalCode
// ============================================================
describe("validatePostalCode", () => {
  test("retourne invalide si le code postal est vide", () => {
    expect(validatePostalCode("")).toEqual({ isValid: false, error: "Le code postal est requis." });
  });

  test("retourne invalide si le code postal est null", () => {
    expect(validatePostalCode(null)).toEqual({ isValid: false, error: "Le code postal est requis." });
  });

  test("retourne invalide si le code postal est undefined", () => {
    expect(validatePostalCode(undefined)).toEqual({ isValid: false, error: "Le code postal est requis." });
  });

  test("retourne invalide pour un code postal trop court (4 chiffres)", () => {
    expect(validatePostalCode("7500")).toEqual({
      isValid: false,
      error: "Le code postal doit être au format français (5 chiffres).",
    });
  });

  test("retourne invalide pour un code postal trop long (6 chiffres)", () => {
    expect(validatePostalCode("750001")).toEqual({
      isValid: false,
      error: "Le code postal doit être au format français (5 chiffres).",
    });
  });

  test("retourne invalide pour un code postal avec des lettres", () => {
    expect(validatePostalCode("7500A")).toEqual({
      isValid: false,
      error: "Le code postal doit être au format français (5 chiffres).",
    });
  });

  test("retourne valide pour un code postal correct (75001)", () => {
    expect(validatePostalCode("75001")).toEqual({ isValid: true, error: "" });
  });

  test("retourne valide pour un code postal correct (06000)", () => {
    expect(validatePostalCode("06000")).toEqual({ isValid: true, error: "" });
  });
});

// ============================================================
// Tests unitaires — validateCity
// ============================================================
describe("validateCity", () => {
  test("retourne invalide si la ville est vide", () => {
    expect(validateCity("")).toEqual({ isValid: false, error: "La ville est requise." });
  });

  test("retourne invalide si la ville est null", () => {
    expect(validateCity(null)).toEqual({ isValid: false, error: "La ville est requise." });
  });

  test("retourne invalide si la ville est undefined", () => {
    expect(validateCity(undefined)).toEqual({ isValid: false, error: "La ville est requise." });
  });

  test("retourne invalide si la ville contient des chiffres", () => {
    expect(validateCity("Paris75")).toEqual({
      isValid: false,
      error: "La ville ne doit contenir que des lettres.",
    });
  });

  test("retourne valide pour une ville simple", () => {
    expect(validateCity("Paris")).toEqual({ isValid: true, error: "" });
  });

  test("retourne valide pour une ville composée", () => {
    expect(validateCity("Saint-Étienne")).toEqual({ isValid: true, error: "" });
  });

  test("retourne valide pour une ville avec espace", () => {
    expect(validateCity("La Rochelle")).toEqual({ isValid: true, error: "" });
  });
});

// ============================================================
// Tests unitaires — validateForm (validation globale)
// ============================================================
describe("validateForm", () => {
  const validFormData = {
    nom: "Dupont",
    prenom: "Jean",
    email: "jean.dupont@email.fr",
    dateNaissance: "1990-05-15",
    ville: "Paris",
    codePostal: "75001",
  };

  test("retourne valide pour un formulaire complet et correct", () => {
    const result = validateForm(validFormData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  test("retourne invalide avec toutes les erreurs pour un formulaire vide", () => {
    const result = validateForm({
      nom: "",
      prenom: "",
      email: "",
      dateNaissance: "",
      ville: "",
      codePostal: "",
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.nom).toBeDefined();
    expect(result.errors.prenom).toBeDefined();
    expect(result.errors.email).toBeDefined();
    expect(result.errors.dateNaissance).toBeDefined();
    expect(result.errors.ville).toBeDefined();
    expect(result.errors.codePostal).toBeDefined();
  });

  test("retourne invalide si seulement le nom est incorrect", () => {
    const result = validateForm({ ...validFormData, nom: "123" });
    expect(result.isValid).toBe(false);
    expect(result.errors.nom).toBeDefined();
    expect(result.errors.prenom).toBeUndefined();
  });

  test("retourne invalide si seulement l'email est incorrect", () => {
    const result = validateForm({ ...validFormData, email: "invalid" });
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBeDefined();
  });

  test("retourne invalide si l'utilisateur est mineur", () => {
    const minorDate = new Date();
    minorDate.setFullYear(minorDate.getFullYear() - 10);
    const result = validateForm({
      ...validFormData,
      dateNaissance: minorDate.toISOString().split("T")[0],
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.dateNaissance).toBeDefined();
  });

  test("retourne invalide si le code postal est incorrect", () => {
    const result = validateForm({ ...validFormData, codePostal: "ABC" });
    expect(result.isValid).toBe(false);
    expect(result.errors.codePostal).toBeDefined();
  });
});
