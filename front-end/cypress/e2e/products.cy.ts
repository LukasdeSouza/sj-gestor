const TEST_EMAIL = Cypress.env('TEST_EMAIL') || 'teste@cobr.com';
const TEST_PASSWORD = Cypress.env('TEST_PASSWORD') || 'Senha@123';

describe('Produtos', () => {
  beforeEach(() => {
    cy.login(TEST_EMAIL, TEST_PASSWORD);
    cy.visit('/dashboard/products');
  });

  it('exibe a lista de produtos', () => {
    cy.get('input.prod-search').should('be.visible');
    cy.contains('button', 'Novo Produto').should('be.visible');
  });

  it('busca filtra os produtos pelo nome', () => {
    cy.get('input.prod-search').type('Mensalidade');
    cy.get('tr.prod-row').each(($row) => {
      cy.wrap($row).invoke('text').should('match', /mensalidade/i);
    });
  });

  it('cria um novo produto', () => {
    const nome = `Produto Teste ${Date.now()}`;
    cy.contains('button', 'Novo Produto').click();
    cy.get('input[placeholder="name"]').type(nome);
    cy.get('textarea[placeholder="Observações importantes..."]').type('Descrição automática');
    cy.get('input[type="number"][placeholder="0.00"]').type('150');
    cy.contains('button', 'Criar Produto').click();
    cy.contains('Produto criado com sucesso!', { timeout: 8000 }).should('be.visible');
    cy.get('input.prod-search').clear().type(nome);
    cy.get('tr.prod-row').should('have.length.at.least', 1);
  });

  it('edita um produto existente', () => {
    cy.get('tr.prod-row').first().within(() => {
      cy.get('button[title="Remover produto"]').siblings('button').first().click();
    });
    cy.get('input[placeholder="name"]').clear().type('Nome Editado');
    cy.contains('button', 'Editar Produto').click();
    cy.contains('sucesso', { timeout: 8000 }).should('be.visible');
  });

  it('exclui um produto com confirmação', () => {
    cy.get('tr.prod-row').its('length').then((before) => {
      cy.get('button.prod-del').first().click();
      cy.get('tr.prod-row', { timeout: 8000 }).should('have.length', before - 1);
    });
  });

  it('paginação avança e retrocede', () => {
    cy.get('button.prod-pg-btn').contains('Próxima').then(($btn) => {
      if (!$btn.is(':disabled')) {
        cy.wrap($btn).click();
        cy.contains(/Página 2/).should('be.visible');
        cy.get('button.prod-pg-btn').contains('Anterior').click();
        cy.contains(/Página 1/).should('be.visible');
      }
    });
  });
});
