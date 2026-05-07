declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/auth');
  cy.contains('button', 'Entrar').click();
  cy.get('input[type="email"][placeholder="seu@email.com"]').first().clear().type(email);
  cy.get('input[type="password"]').first().clear().type(password);
  cy.contains('button', 'Entrar no Cobr').click();
  cy.url({ timeout: 10000 }).should('include', '/dashboard');
});

export {};
