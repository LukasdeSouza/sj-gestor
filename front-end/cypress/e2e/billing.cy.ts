/// <reference types="cypress" />

describe('Billing Rules E2E Tests', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password123');
  });

  describe('Niche Selection', () => {
    it('should display available niches in config modal', () => {
      // Navigate to a client
      cy.visit('/clients');
      cy.get('[data-testid="client-row"]').first().click();
      
      // Open billing rules config
      cy.contains('Configurar Régua').click();
      
      // Check if niches are displayed
      cy.contains('Templates por Nicho').should('be.visible');
      cy.contains('Academia').should('be.visible');
      cy.contains('Clínica').should('be.visible');
      cy.contains('Escola').should('be.visible');
    });

    it('should apply niche templates when selected', () => {
      cy.visit('/clients');
      cy.get('[data-testid="client-row"]').first().click();
      cy.contains('Configurar Régua').click();
      
      // Select Academia niche
      cy.contains('Academia').parent().click();
      
      // Should show selected state
      cy.contains('✓ Selecionado').should('be.visible');
      
      // Templates should be applied
      cy.contains('Lembrete de pagamento').should('be.visible');
      cy.contains('Pagamento hoje').should('be.visible');
      cy.contains('Pagamento em atraso').should('be.visible');
    });

    it('should allow customizing after applying niche', () => {
      cy.visit('/clients');
      cy.get('[data-testid="client-row"]').first().click();
      cy.contains('Configurar Régua').click();
      
      // Select niche
      cy.contains('Clínica').parent().click();
      
      // Edit a template
      cy.contains('Editar msg').first().click();
      cy.get('input[value*="Clínica"]').clear().type('Hospital São Lucas');
      
      // Save changes
      cy.contains('Fechar').click();
      
      // Create rules
      cy.contains('Criar Régua').click();
      
      // Verify success
      cy.contains('Régua de cobrança configurada').should('be.visible');
    });
  });

  describe('Billing Rule Creation', () => {
    it('should create rules with default steps', () => {
      cy.visit('/clients/client-123/billing');
      
      cy.contains('Configurar Régua').click();
      
      // Default steps should be present
      cy.contains('D-3').should('be.visible');
      cy.contains('D0').should('be.visible');
      cy.contains('D+3').should('be.visible');
      
      // Create rules
      cy.contains('Criar Régua').click();
      
      // Should show success
      cy.contains('Régua de cobrança configurada').should('be.visible');
    });

    it('should create rules with custom steps', () => {
      cy.visit('/clients/client-123/billing');
      
      cy.contains('Configurar Régua').click();
      
      // Add custom step
      cy.contains('Adicionar etapa').click();
      
      // Configure new step
      cy.get('input[type="number"]').last().clear().type('7');
      
      // Create rules
      cy.contains('Criar Régua (4 etapas)').click();
      
      // Verify
      cy.contains('4 etapas').should('be.visible');
    });

    it('should validate required fields', () => {
      cy.visit('/clients/client-123/billing');
      
      cy.contains('Configurar Régua').click();
      
      // Clear all steps
      cy.get('[data-testid="remove-step"]').each(($el) => {
        cy.wrap($el).click();
      });
      
      // Try to create
      cy.contains('Criar Régua').click();
      
      // Should show error
      cy.contains('Adicione pelo menos uma etapa').should('be.visible');
    });
  });

  describe('Billing Rule Management', () => {
    it('should display created rules', () => {
      cy.visit('/clients/client-123/billing');
      
      // Rules should be listed
      cy.get('[data-testid="rule-card"]').should('have.length.at.least', 1);
    });

    it('should show rule status correctly', () => {
      cy.visit('/clients/client-123/billing');
      
      // Check status pills
      cy.contains('Agendado').should('be.visible');
    });

    it('should allow resending failed rules', () => {
      cy.visit('/clients/client-123/billing');
      
      // Find a failed rule
      cy.contains('Falhou').parent().within(() => {
        cy.contains('Reenviar').click();
      });
      
      // Confirm
      cy.contains('Confirmar reenvio').click();
      
      // Should show success
      cy.contains('Cobrança reenviada').should('be.visible');
    });

    it('should allow canceling scheduled rules', () => {
      cy.visit('/clients/client-123/billing');
      
      // Find scheduled rule
      cy.contains('Agendado').parent().within(() => {
        cy.contains('Cancelar').click();
      });
      
      // Confirm
      cy.contains('Tem certeza').parent().contains('Sim').click();
      
      // Should show success
      cy.contains('Cobrança cancelada').should('be.visible');
    });
  });

  describe('Billing Statistics', () => {
    it('should display billing stats', () => {
      cy.visit('/clients/client-123/billing');
      
      cy.contains('Total').should('be.visible');
      cy.contains('Enviados').should('be.visible');
      cy.contains('Falhas').should('be.visible');
      cy.contains('Taxa de sucesso').should('be.visible');
    });

    it('should show timeline visualization', () => {
      cy.visit('/clients/client-123/billing');
      
      cy.contains('Fluxo configurado').should('be.visible');
      cy.get('[data-testid="timeline"]').should('be.visible');
    });
  });

  describe('Filter and Search', () => {
    it('should filter rules by status', () => {
      cy.visit('/clients/client-123/billing');
      
      // Click on filter tabs
      cy.contains('Enviados').click();
      cy.get('[data-testid="rule-card"]').each(($card) => {
        cy.wrap($card).should('contain', 'Enviado');
      });
      
      cy.contains('Agendados').click();
      cy.get('[data-testid="rule-card"]').each(($card) => {
        cy.wrap($card).should('contain', 'Agendado');
      });
    });

    it('should show empty state when no rules', () => {
      // Create new client with no rules
      cy.visit('/clients/new-client/billing');
      
      cy.contains('Nenhuma cobrança configurada').should('be.visible');
      cy.contains('Configurar régua agora').should('be.visible');
    });
  });

  describe('Template Preview', () => {
    it('should show message preview', () => {
      cy.visit('/clients/client-123/billing');
      
      // Expand a rule
      cy.get('[data-testid="rule-card"]').first().click();
      
      // Should show preview
      cy.contains('Prévia da mensagem').should('be.visible');
    });

    it('should substitute variables in preview', () => {
      cy.visit('/clients/client-123/billing');
      
      // Expand rule
      cy.get('[data-testid="rule-card"]').first().click();
      
      // Check if variables are shown or substituted
      cy.get('[data-testid="message-preview"]').should('be.visible');
    });
  });
});

describe('Billing Automation Flow', () => {
  it('should automatically create rules for new client', () => {
    // Create new client
    cy.visit('/clients');
    cy.contains('Novo Cliente').click();
    
    // Fill form
    cy.get('input[name="name"]').type('Cliente Teste Automação');
    cy.get('input[name="email"]').type('cliente@teste.com');
    cy.get('input[name="phone"]').type('11999999999');
    cy.get('input[name="due_date"]').type('15');
    cy.get('input[name="product_value"]').type('100');
    
    // Save
    cy.contains('Salvar').click();
    
    // Should redirect to billing
    cy.url().should('include', '/billing');
    
    // Rules should be automatically created
    cy.get('[data-testid="rule-card"]').should('have.length.at.least', 3);
  });

  it('should send message on due date', () => {
    // Mock current date to be client's due date
    cy.clock(new Date(2024, 0, 15).getTime()); // Jan 15
    
    cy.visit('/clients/client-due-today/billing');
    
    // Trigger cron simulation (or wait for automation)
    cy.request('POST', '/api/cron/billing');
    
    // Check if message was sent
    cy.reload();
    
    cy.get('[data-testid="rule-card"]').first().should('contain', 'Enviado');
  });

  it('should handle failed sends with retry', () => {
    cy.visit('/clients/client-failures/billing');
    
    // Find rule with retries
    cy.contains('retry').should('be.visible');
    
    // Rule should be retried automatically
    cy.request('POST', '/api/cron/billing');
    
    // Check retry count
    cy.reload();
    cy.contains('2x retry').should('be.visible');
  });
});
