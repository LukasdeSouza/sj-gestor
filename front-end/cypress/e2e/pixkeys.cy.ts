const TEST_EMAIL = Cypress.env('TEST_EMAIL') || 'teste@cobr.com';
const TEST_PASSWORD = Cypress.env('TEST_PASSWORD') || 'Senha@123';

describe('Chaves PIX', () => {
  beforeEach(() => {
    cy.login(TEST_EMAIL, TEST_PASSWORD);
    cy.visit('/dashboard/pix-keys');
  });

  it('exibe a listagem de chaves PIX', () => {
    cy.get('input.px-search').should('be.visible');
    cy.contains('button', 'Nova Chave PIX').should('be.visible');
  });

  it('busca filtra as chaves pelo valor', () => {
    cy.get('input.px-search').type('@');
    cy.get('tr.px-row').each(($row) => {
      cy.wrap($row).invoke('text').should('match', /@/);
    });
  });

  it('cria uma nova chave PIX do tipo Email', () => {
    cy.contains('button', 'Nova Chave PIX').click();
    cy.contains('Tipo de Chave').should('be.visible');

    // Seleciona tipo Email
    cy.get('[role="combobox"]').click();
    cy.contains('[role="option"]', 'Email').click();

    cy.get('input[placeholder="Digite a chave PIX"]').type(`pix_${Date.now()}@teste.com`);
    cy.get('textarea[placeholder="Identificação"]').type('Chave de teste');
    cy.contains('button', 'Criar Chave PIX').click();
    cy.contains('sucesso', { timeout: 8000 }).should('be.visible');
  });

  it('cria uma chave PIX do tipo Chave Aleatória', () => {
    cy.contains('button', 'Nova Chave PIX').click();
    cy.get('[role="combobox"]').click();
    cy.contains('[role="option"]', 'Chave Aleatória').click();
    cy.get('input[placeholder="Digite a chave PIX"]').type('123e4567-e89b-12d3-a456-426614174000');
    cy.contains('button', 'Criar Chave PIX').click();
    cy.contains('sucesso', { timeout: 8000 }).should('be.visible');
  });

  it('exclui uma chave PIX', () => {
    cy.get('tr.px-row').its('length').then((before) => {
      cy.get('button.px-del').first().click();
      cy.get('tr.px-row', { timeout: 8000 }).should('have.length', before - 1);
    });
  });

  it('salva links de pagamento (cartão e boleto)', () => {
    cy.get('input[type="url"][placeholder*="Mercado Pago"]')
      .clear()
      .type('https://link-checkout.com/teste');
    cy.get('input[type="url"][placeholder*="boleto"]')
      .clear()
      .type('https://link-boleto.com/teste');
    cy.contains('button', 'Salvar Links').click();
    cy.contains('sucesso', { timeout: 8000 }).should('be.visible');
  });

  it('paginação funciona', () => {
    cy.get('button.px-pg-btn').contains('Próxima').then(($btn) => {
      if (!$btn.is(':disabled')) {
        cy.wrap($btn).click();
        cy.contains(/Página 2/).should('be.visible');
        cy.get('button.px-pg-btn').contains('Anterior').click();
        cy.contains(/Página 1/).should('be.visible');
      }
    });
  });
});
