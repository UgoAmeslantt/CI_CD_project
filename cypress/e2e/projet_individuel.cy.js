describe("Test E2E - Projet Individuel 2", () => {
  beforeEach(() => {
    cy.intercept("POST", "**/users", {
      statusCode: 200,
      body: { status: "success", message: "Inscription réussie" }
    }).as("registerUser");

    cy.intercept("POST", "**/login", {
      statusCode: 200,
      body: {
        token: "admin-token-ugo",
        user: { email: "ugo.ameslant@ynov.com", first_name: "Ugo", last_name: "Ameslant" }
      }
    }).as("adminLogin");

    cy.intercept("GET", "**/users", {
      statusCode: 200,
      body: {
        utilisateurs: [
          {
            id: 1,
            nom: "Dupont",
            prenom: "Jean",
            ville: "Paris"
          }
        ]
      }
    }).as("getPublicUsers");

    cy.intercept("DELETE", "**/users/*", {
      statusCode: 200,
      body: { status: "success", message: "Utilisateur supprimé" }
    }).as("deleteUser");
  });

  it("Scénario complet : inscription, restriction d'infos, login admin, vue privée, suppression", () => {
    cy.visit("/");

    cy.get("#nom").type("Dupont");
    cy.get("#prenom").type("Jean");
    cy.get("#email").type("jean.dupont@email.fr");
    cy.get("#dateNaissance").type("1990-05-15");
    cy.get("#ville").type("Paris");
    cy.get("#codePostal").type("75001");

    cy.get("#submit-btn").click();

    cy.get('[data-testid="toaster-success"]').should("contain", "Inscription réussie");
    cy.get('[data-testid="users-list"]').should("be.visible");
    cy.get('[data-testid="user-card-0"]').should("contain", "Jean Dupont");

    cy.get('[data-testid="user-card-0"]').should("not.contain", "jean.dupont@email.fr");
    cy.get('[data-testid="user-card-0"]').should("not.contain", "1990-05-15");
    cy.get('[data-testid="user-card-0"]').find(".delete-user-btn").should("not.exist");

    cy.intercept("GET", "**/users", {
      statusCode: 200,
      body: {
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
    }).as("getAdminUsers");

    cy.get('[data-testid="admin-toggle-btn"]').click();
    cy.get('[data-testid="login-container"]').should("be.visible");

    cy.get("#login-email").type("ugo.ameslant@ynov.com");
    cy.get("#login-password").type("PvdrTAzTeR247sDnAZBr");
    cy.get("#login-submit-btn").click();

    cy.get('[data-testid="admin-toggle-btn"]').should("contain", "Déconnexion Admin");

    cy.get('[data-testid="user-email-0"]').should("contain", "jean.dupont@email.fr");
    cy.get('[data-testid="user-date-0"]').should("contain", "1990-05-15");
    
    cy.get('[data-testid="delete-btn-0"]').should("be.visible");

    cy.intercept("GET", "**/users", {
      statusCode: 200,
      body: { utilisateurs: [] }
    }).as("getEmptyUsers");

    cy.get('[data-testid="delete-btn-0"]').click();
    cy.wait("@deleteUser");

    cy.get('[data-testid="users-list"]').should("not.exist");
  });
});
