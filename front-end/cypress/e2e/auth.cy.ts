const TEST_EMAIL = Cypress.env('TEST_EMAIL') || 'teste@cobr.com';
const TEST_PASSWORD = Cypress.env('TEST_PASSWORD') || 'Senha@123';

describe('Autenticação', () => {
  beforeEach(() => {
    cy.visit('/auth');
  });

  it('exibe os dois tabs: Entrar e Criar conta', () => {
    cy.contains('button', 'Entrar').should('be.visible');
    cy.contains('button', 'Criar conta').should('be.visible');
  });

  it('login com credenciais válidas redireciona para dashboard', () => {
    cy.contains('button', 'Entrar').click();
    cy.get('input[type="email"]').type(TEST_EMAIL);
    cy.get('input[type="password"]').type(TEST_PASSWORD);
    cy.contains('button', 'Entrar no Cobr').click();
    cy.url({ timeout: 10000 }).should('include', '/dashboard');
  });

  it('login com senha errada exibe mensagem de erro', () => {
    cy.contains('button', 'Entrar').click();
    cy.get('input[type="email"]').type(TEST_EMAIL);
    cy.get('input[type="password"]').type('senha-errada-123');
    cy.contains('button', 'Entrar no Cobr').click();
    cy.url().should('include', '/auth');
  });

  it('link "Esqueceu sua senha?" navega para /forgot-password', () => {
    cy.contains('Esqueceu sua senha?').click();
    cy.url().should('include', '/forgot-password');
  });

  it('tab Criar conta exibe formulário de cadastro', () => {
    cy.contains('button', 'Criar conta').click();
    cy.contains('Nome completo').should('be.visible');
    cy.contains('Confirmar Senha').should('be.visible');
    cy.contains('button', 'Criar minha conta').should('be.visible');
  });

  it('cadastro sem aceitar os termos não submete', () => {
    cy.contains('button', 'Criar conta').click();
    cy.get('input[type="text"][placeholder="Seu nome"]').type('Usuário Teste');
    cy.get('input[type="email"]').type(`novo_${Date.now()}@teste.com`);
    cy.get('input[type="password"]').first().type(TEST_PASSWORD);
    cy.get('input[type="password"]').last().type(TEST_PASSWORD);
    // não marca o checkbox de termos
    cy.contains('button', 'Criar minha conta').click();
    cy.url().should('include', '/auth');
  });
});

describe('Recuperação de senha', () => {
  it('exibe mensagem após submeter email válido', () => {
    cy.visit('/forgot-password');
    cy.get('#forgot-email').type(TEST_EMAIL);
    cy.contains('button', 'Enviar link de recuperação').click();
    cy.url({ timeout: 8000 }).should('include', '/auth');
  });

  it('botão Voltar retorna para /auth', () => {
    cy.visit('/forgot-password');
    cy.get('button.cobr-fp-back').click();
    cy.url().should('include', '/auth');
  });
});
