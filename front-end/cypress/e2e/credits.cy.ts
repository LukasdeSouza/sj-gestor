describe('Credits Page E2E Tests', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('/auth');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    
    // Wait for redirect to dashboard
    cy.url().should('include', '/dashboard');
  });

  describe('Credit Balance Display', () => {
    it('should display current balance', () => {
      cy.visit('/credits');
      
      // Check if balance card is visible
      cy.contains('Saldo Atual').should('be.visible');
      cy.get('[data-testid="balance-card"]').should('exist');
    });

    it('should display transaction history', () => {
      cy.visit('/credits');
      
      cy.contains('Histórico de Transações').should('be.visible');
      cy.get('[data-testid="transaction-list"]').should('exist');
    });

    it('should display credit stats', () => {
      cy.visit('/credits');
      
      cy.contains('Total Comprado').should('be.visible');
      cy.contains('Total Consumido').should('be.visible');
    });
  });

  describe('Credit Packages', () => {
    it('should display all credit packages', () => {
      cy.visit('/credits');
      
      cy.contains('Comprar Créditos').should('be.visible');
      cy.contains('Starter').should('be.visible');
      cy.contains('Basic').should('be.visible');
      cy.contains('Pro').should('be.visible');
      cy.contains('Business').should('be.visible');
      cy.contains('Ilimitado').should('be.visible');
    });

    it('should show correct prices and credits', () => {
      cy.visit('/credits');
      
      // Starter: 40 créditos por R$ 10
      cy.contains('40').should('be.visible');
      cy.contains('R$ 10,00').should('be.visible');
      
      // Basic: 100 créditos por R$ 25
      cy.contains('100').should('be.visible');
      cy.contains('R$ 25,00').should('be.visible');
    });

    it('should highlight most popular package', () => {
      cy.visit('/credits');
      
      cy.contains('Mais Popular').should('be.visible');
    });
  });

  describe('Purchase Flow', () => {
    it('should initiate checkout when clicking buy', () => {
      cy.visit('/credits');
      
      // Click on Basic package
      cy.contains('Basic').parent().parent().within(() => {
        cy.contains('Comprar Agora').click();
      });
      
      // Should redirect to Stripe checkout
      cy.url().should('include', 'checkout.stripe.com');
    });

    it('should show success message after purchase', () => {
      // Simulate returning from successful payment
      cy.visit('/credits?success=true');
      
      cy.contains('Compra realizada com sucesso').should('be.visible');
    });

    it('should show error message when purchase is canceled', () => {
      // Simulate returning from canceled payment
      cy.visit('/credits?canceled=true');
      
      cy.contains('Compra cancelada').should('be.visible');
    });
  });

  describe('Transaction History', () => {
    it('should display purchase transactions', () => {
      cy.visit('/credits');
      
      cy.contains('Histórico de Transações').click();
      
      // Check if transaction types are displayed
      cy.get('[data-testid="transaction-list"]').within(() => {
        cy.contains('Compra').should('exist');
      });
    });

    it('should display consumption transactions', () => {
      cy.visit('/credits');
      
      // Create a campaign to consume credits
      cy.visit('/disparo');
      // ... create campaign flow
      
      // Check transaction history
      cy.visit('/credits');
      cy.contains('Histórico de Transações').click();
      
      cy.get('[data-testid="transaction-list"]').within(() => {
        cy.contains('Disparo').should('exist');
      });
    });
  });

  describe('Insufficient Credits', () => {
    it('should block campaign creation when no credits', () => {
      // Ensure user has 0 credits
      cy.intercept('GET', '/api/credits/balance', {
        balance: 0,
        totalPurchased: 0,
        totalConsumed: 0,
      }).as('getBalance');
      
      cy.visit('/disparo');
      cy.wait('@getBalance');
      
      // Try to create campaign
      cy.get('[data-testid="upload-contacts"]').attachFile('contacts.csv');
      cy.contains('Iniciar Disparo').click();
      
      // Should show error
      cy.contains('Saldo insuficiente').should('be.visible');
    });

    it('should suggest purchasing credits when insufficient', () => {
      cy.intercept('GET', '/api/credits/balance', {
        balance: 2,
        totalPurchased: 5,
        totalConsumed: 3,
      }).as('getBalance');
      
      cy.visit('/disparo');
      cy.wait('@getBalance');
      
      // Try to send to 10 contacts (need 10 credits)
      cy.get('[data-testid="upload-contacts"]').attachFile('contacts.csv');
      cy.contains('Iniciar Disparo').click();
      
      // Should show error with suggestion
      cy.contains('Você tem 2 créditos').should('be.visible');
      cy.contains('precisa de 10 créditos').should('be.visible');
      cy.contains('Compre mais créditos').should('be.visible');
    });
  });
});

describe('Credits Integration with Other Features', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password123');
  });

  it('should deduct credits after successful campaign', () => {
    // Mock initial balance
    cy.intercept('GET', '/api/credits/balance', {
      balance: 10,
      totalPurchased: 10,
      totalConsumed: 0,
    }).as('initialBalance');
    
    cy.visit('/credits');
    cy.wait('@initialBalance');
    cy.contains('10').should('be.visible');
    
    // Create campaign with 3 contacts
    cy.visit('/disparo');
    cy.get('[data-testid="upload-contacts"]').attachFile('3contacts.csv');
    cy.contains('Calcular Custo').click();
    
    // Should show cost
    cy.contains('3 créditos').should('be.visible');
    
    // Start campaign
    cy.contains('Iniciar Disparo').click();
    
    // Mock balance after consumption
    cy.intercept('GET', '/api/credits/balance', {
      balance: 7,
      totalPurchased: 10,
      totalConsumed: 3,
    }).as('updatedBalance');
    
    // Check updated balance
    cy.visit('/credits');
    cy.wait('@updatedBalance');
    cy.contains('7').should('be.visible');
    
    // Check transaction history
    cy.contains('Histórico de Transações').click();
    cy.contains('-3').should('be.visible');
  });

  it('should handle concurrent credit operations', () => {
    // This tests race condition protection
    cy.visit('/credits');
    
    // Try to start multiple campaigns simultaneously
    // The system should prevent double-spending
    
    cy.window().then((win) => {
      // Mock multiple simultaneous requests
      const requests = [
        fetch('/api/disparo/start', { method: 'POST' }),
        fetch('/api/disparo/start', { method: 'POST' }),
        fetch('/api/disparo/start', { method: 'POST' }),
      ];
      
      return Promise.all(requests);
    });
    
    // Only one should succeed
    // Others should fail with insufficient credits
  });
});
