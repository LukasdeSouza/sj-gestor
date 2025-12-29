# Implementation Plan: Mercado Pago Subscriptions

## Overview

This plan breaks down the Mercado Pago subscriptions feature into discrete, incremental tasks. Each task builds on previous ones, with testing integrated throughout. Tasks marked with `*` are optional and can be skipped for faster MVP delivery.

## Tasks

- [ ] 1. Database Schema Updates
  - Update Subscription model with new fields (mp_preapproval_id, mp_plan_id, mp_card_token_id, billing_day, frequency, last_charge_date, authorized_at, canceled_at)
  - Update SubscriptionStatus enum to include AUTHORIZED, ACTIVE, PAUSED, CANCELED
  - Create and run Prisma migration
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 2. Create MercadoPagoService
  - Implement MercadoPagoService with methods: createPlan, createPreapproval, cancelPreapproval, updatePreapprovalAmount, updatePreapprovalCard, getPreapproval
  - Add error handling for MP API failures
  - Implement retry logic for transient failures
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [ ]* 2.1 Write unit tests for MercadoPagoService
  - **Property 1: Subscription Authorization Idempotence**
  - **Validates: Requirements 2.1, 2.2**

- [ ] 3. Create SubscriptionService
  - Implement SubscriptionService with methods: authorizeSubscription, cancelSubscription, updateSubscriptionAmount, updateSubscriptionCard, getSubscriptionDetails
  - Orchestrate calls between MercadoPagoService and SubscriptionRepository
  - Add validation for subscription state transitions
  - _Requirements: 2.1, 3.1, 4.1, 5.1, 6.1_

- [ ]* 3.1 Write unit tests for SubscriptionService
  - **Property 2: Cancellation State Transition**
  - **Validates: Requirements 3.1, 3.2**

- [ ] 4. Update SubscriptionRepository
  - Add methods: create, findById, findByUserId, findByMpPreapprovalId, update, delete
  - Implement database queries for subscription CRUD operations
  - Add indexes for performance optimization
  - _Requirements: 8.1, 8.2, 8.3_

- [ ]* 4.1 Write unit tests for SubscriptionRepository
  - Test all CRUD operations
  - Test query performance with indexes
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 5. Create SubscriptionController
  - Implement endpoints: authorize, cancel, updateAmount, updateCard, getDetails
  - Add input validation using Zod schemas
  - Add authentication middleware checks
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7_

- [ ]* 5.1 Write unit tests for SubscriptionController
  - Test request/response handling
  - Test error responses
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 6. Create Zod Validation Schemas
  - Create AuthorizeSubscriptionSchema
  - Create UpdateAmountSchema
  - Create UpdateCardSchema
  - Create CancelSubscriptionSchema
  - _Requirements: 9.8_

- [ ] 7. Create API Routes
  - Register POST /subscriptions/authorize
  - Register PUT /subscriptions/:id/cancel
  - Register PUT /subscriptions/:id/amount
  - Register PUT /subscriptions/:id/card
  - Register GET /subscriptions/:id
  - Add authentication middleware to all routes except webhooks
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7_

- [ ] 8. Update Webhook Handler
  - Add webhook signature validation for Mercado Pago
  - Implement subscription_authorized event handler
  - Implement subscription_payment event handler
  - Implement subscription_canceled event handler
  - Add error logging and retry mechanism
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 8.1 Write unit tests for webhook handlers
  - **Property 5: Webhook Event Idempotence**
  - **Validates: Requirements 7.1, 7.2, 7.3**

- [ ] 9. Add Error Handling and Logging
  - Create custom error classes (SubscriptionError, InvalidCardTokenError, etc.)
  - Add structured logging for all operations
  - Implement error response formatting
  - Add context to error logs (user ID, subscription ID, etc.)
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 10. Checkpoint - Backend Complete
  - Ensure all backend tests pass
  - Verify database migration runs successfully
  - Test all endpoints manually with Postman/curl
  - Ask the user if questions arise

- [ ] 11. Create Frontend Subscription Component
  - Create SubscriptionCheckout component with card form
  - Integrate Mercado Pago card tokenization SDK
  - Handle card token generation
  - Display subscription confirmation
  - _Requirements: 2.3_

- [ ] 12. Create Frontend Subscription Management UI
  - Create component to display active subscriptions
  - Add cancel subscription button
  - Add update amount form
  - Add update card form
  - _Requirements: 3.1, 4.1, 5.1_

- [ ]* 12.1 Write integration tests for frontend
  - Test subscription checkout flow
  - Test subscription management operations
  - _Requirements: 2.1, 3.1, 4.1, 5.1_

- [ ] 13. Update Plans Page
  - Replace "Buy" button with "Subscribe" button for paid plans
  - Route to subscription checkout instead of preference checkout
  - Display subscription terms (frequency, amount, billing day)
  - _Requirements: 2.1_

- [ ] 14. Add Subscription Status Display
  - Show subscription status on dashboard
  - Display next billing date
  - Show current plan and amount
  - _Requirements: 6.1, 6.2_

- [ ] 15. Integration Testing
  - Test full subscription flow: authorize → charge → cancel
  - Test webhook processing with real MP events
  - Test error scenarios (invalid card, API failures)
  - Test concurrent subscription operations
  - _Requirements: 2.1, 3.1, 4.1, 5.1, 7.1_

- [ ]* 15.1 Write property-based tests
  - **Property 3: Amount Update Consistency**
  - **Validates: Requirements 4.1, 4.2**
  - **Property 4: Card Update Idempotence**
  - **Validates: Requirements 5.1, 5.2**
  - **Property 6: Status Retrieval Accuracy**
  - **Validates: Requirements 6.1, 6.2**
  - **Property 7: Authorization Requires Valid Card Token**
  - **Validates: Requirements 2.5**
  - **Property 8: Cancellation Prevents Further Charges**
  - **Validates: Requirements 3.4, 4.5**

- [ ] 16. Final Checkpoint - All Tests Pass
  - Ensure all unit tests pass
  - Ensure all integration tests pass
  - Ensure all property-based tests pass
  - Verify no console errors or warnings
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Frontend tasks can be done in parallel with backend after checkpoint 10
