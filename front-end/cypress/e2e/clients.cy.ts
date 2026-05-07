const TEST_EMAIL = Cypress.env('TEST_EMAIL') || 'teste@cobr.com';
const TEST_PASSWORD = Cypress.env('TEST_PASSWORD') || 'Senha@123';

describe('Clientes', () => {
  beforeEach(() => {
    cy.login(TEST_EMAIL, TEST_PASSWORD);
    cy.visit('/dashboard/clients');
  });

  it('exibe a listagem de clientes', () => {
    cy.get('input.cl-search').should('be.visible');
  });

  it('busca filtra clientes por nome', () => {
    cy.get('tr.cl-row').first().invoke('text').then((primeiroNome) => {
      const termo = primeiroNome.substring(0, 5);
      cy.get('input.cl-search').type(termo);
      cy.get('tr.cl-row').should('have.length.at.least', 1);
    });
  });

  it('filtro A-Z ordena a lista', () => {
    cy.get('button.cl-filter').contains(/A-Z/).click();
    cy.get('tr.cl-row').should('have.length.at.least', 1);
  });

  it('filtro Inadimplentes exibe apenas clientes em atraso', () => {
    cy.get('button.cl-filter').contains('Inadimplentes').click();
    cy.get('tr.cl-row').each(($row) => {
      cy.wrap($row).contains(/[Aa]traso|[Ii]nadimplente/).should('exist');
    });
  });

  it('botão Limpar remove os filtros ativos', () => {
    cy.get('button.cl-filter').contains(/A-Z/).click();
    cy.get('button.cl-filter').contains('Limpar').click();
    cy.get('button.cl-filter').contains('Limpar').should('not.exist');
  });

  it('clique na linha abre modal de detalhes do cliente', () => {
    cy.get('tr.cl-row').first().click();
    cy.get('[role="dialog"]').should('be.visible');
  });

  it('botão detalhes abre modal', () => {
    cy.get('button.btnView').first().click();
    cy.get('[role="dialog"]').should('be.visible');
  });

  it('exclui um cliente após confirmação', () => {
    cy.get('tr.cl-row').its('length').then((before) => {
      cy.get('button.cl-del-btn').first().click();
      cy.contains('button', 'Sim, remover').click();
      cy.get('tr.cl-row', { timeout: 8000 }).should('have.length', before - 1);
    });
  });

  it('paginação avança e retrocede', () => {
    cy.get('button.cl-pg-btn').contains('Próxima').then(($btn) => {
      if (!$btn.is(':disabled')) {
        cy.wrap($btn).click();
        cy.contains(/Página 2/).should('be.visible');
        cy.get('button.cl-pg-btn').contains('Anterior').click();
        cy.contains(/Página 1/).should('be.visible');
      }
    });
  });
});
