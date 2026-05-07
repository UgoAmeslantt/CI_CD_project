/**
 * Fonctions de validation pour le formulaire d'inscription.
 * Chaque fonction retourne un objet { isValid: boolean, error: string }.
 */

/**
 * Valide un nom ou prénom.
 * Doit contenir au moins 1 caractère, uniquement des lettres, espaces, tirets et accents.
 * @param {string} value - Le nom ou prénom à valider.
 * @returns {{ isValid: boolean, error: string }}
 */
export function validateName(value) {
  if (!value || value.trim().length === 0) {
    return { isValid: false, error: "Ce champ est requis." };
  }
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
  if (!nameRegex.test(value.trim())) {
    return { isValid: false, error: "Ce champ ne doit contenir que des lettres, espaces, tirets ou apostrophes." };
  }
  return { isValid: true, error: "" };
}

/**
 * Valide une adresse email.
 * @param {string} email - L'email à valider.
 * @returns {{ isValid: boolean, error: string }}
 */
export function validateEmail(email) {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: "L'email est requis." };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: "L'email n'est pas valide." };
  }
  return { isValid: true, error: "" };
}

/**
 * Valide la date de naissance (l'utilisateur doit avoir au moins 18 ans).
 * @param {string} dateString - La date de naissance au format YYYY-MM-DD.
 * @returns {{ isValid: boolean, error: string }}
 */
export function validateAge(dateString) {
  if (!dateString || dateString.trim().length === 0) {
    return { isValid: false, error: "La date de naissance est requise." };
  }

  const birthDate = new Date(dateString);
  if (isNaN(birthDate.getTime())) {
    return { isValid: false, error: "La date de naissance n'est pas valide." };
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  // Si l'anniversaire n'est pas encore passé cette année, on retire 1 an
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  if (age < 18) {
    return { isValid: false, error: "Vous devez avoir au moins 18 ans." };
  }
  return { isValid: true, error: "" };
}

/**
 * Valide un code postal français (5 chiffres).
 * @param {string} postalCode - Le code postal à valider.
 * @returns {{ isValid: boolean, error: string }}
 */
export function validatePostalCode(postalCode) {
  if (!postalCode || postalCode.trim().length === 0) {
    return { isValid: false, error: "Le code postal est requis." };
  }
  const postalRegex = /^[0-9]{5}$/;
  if (!postalRegex.test(postalCode.trim())) {
    return { isValid: false, error: "Le code postal doit être au format français (5 chiffres)." };
  }
  return { isValid: true, error: "" };
}

/**
 * Valide le nom de la ville.
 * @param {string} city - La ville à valider.
 * @returns {{ isValid: boolean, error: string }}
 */
export function validateCity(city) {
  if (!city || city.trim().length === 0) {
    return { isValid: false, error: "La ville est requise." };
  }
  const cityRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
  if (!cityRegex.test(city.trim())) {
    return { isValid: false, error: "La ville ne doit contenir que des lettres." };
  }
  return { isValid: true, error: "" };
}

/**
 * Valide l'ensemble du formulaire.
 * @param {object} formData - Les données du formulaire.
 * @returns {{ isValid: boolean, errors: object }}
 */
export function validateForm(formData) {
  const errors = {};

  const nomResult = validateName(formData.nom);
  if (!nomResult.isValid) errors.nom = nomResult.error;

  const prenomResult = validateName(formData.prenom);
  if (!prenomResult.isValid) errors.prenom = prenomResult.error;

  const emailResult = validateEmail(formData.email);
  if (!emailResult.isValid) errors.email = emailResult.error;

  const ageResult = validateAge(formData.dateNaissance);
  if (!ageResult.isValid) errors.dateNaissance = ageResult.error;

  const cityResult = validateCity(formData.ville);
  if (!cityResult.isValid) errors.ville = cityResult.error;

  const postalResult = validatePostalCode(formData.codePostal);
  if (!postalResult.isValid) errors.codePostal = postalResult.error;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
