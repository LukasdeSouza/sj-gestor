# Requirements Document: Mercado Pago Subscriptions (PIX Manual)

## Introduction

This feature enables SJ Gestor users to subscribe to plans using PIX payments through Mercado Pago. The system generates a static PIX QR Code, users upload payment proof, and admins approve subscriptions. This runs **in parallel with existing Stripe integration** - no changes to Stripe code.

**Important:** Stripe integration remains fully functional and unchanged. This is a new payment method option.

## Glossary

- **Subscription**: A recurring payment authorization that charges a customer automatically at defined intervals
- **Preapproval**: Mercado Pago's term for a subscription authorization
- **Preapproval Plan**: A reusable template defining subscription terms (amount, frequency, billing day)
- **Card Token**: A secure token representing a customer's card for recurring charges
- **Billing Frequency**: The interval between charges (monthly, yearly, etc.)
- **Subscription Status**: Current state of a subscription (authorized, active, paused, canceled)
- **MP**: Mercado Pago payment gateway
- **User**: SJ Gestor account holder who creates subscriptions
- **Customer**: End user who subscribes to a plan

## Requirements

### Requirement 1: Create Subscription Plans

**User Story:** As a user, I want to create reusable subscription plans in Mercado Pago, so that I can organize subscriptions by type and frequency.

#### Acceptance Criteria

1. WHEN a user creates a subscription plan, THE System SHALL send plan details to Mercado Pago's preapproval_plan endpoint
2. WHEN a plan is created successfully, THE System SHALL store the MP plan ID in the database for future reference
3. WHEN creating a plan, THE System SHALL accept parameters: name, amount, frequency (monthly/yearly), billing day, and optional free trial
4. IF the Mercado Pago API returns an error, THEN THE System SHALL return a descriptive error message to the user
5. THE System SHALL validate that amount is greater than zero and frequency is a supported value

### Requirement 2: Authorize Customer Subscriptions

**User Story:** As a user, I want to authorize a customer for recurring charges, so that they can subscribe to my service with automatic billing.

#### Acceptance Criteria

1. WHEN a user authorizes a subscription with a valid card token, THE System SHALL create a preapproval in Mercado Pago
2. WHEN a subscription is authorized successfully, THE System SHALL store the preapproval ID and link it to the user's subscription record
3. WHEN authorizing a subscription, THE System SHALL require: customer email, card token, plan ID, and start date
4. WHEN a subscription is authorized, THE System SHALL set its status to "authorized" in the database
5. IF the card token is invalid or expired, THEN THE System SHALL return an error and not create the subscription
6. WHEN a subscription is authorized, THE System SHALL trigger a webhook notification from Mercado Pago

### Requirement 3: Cancel Subscriptions

**User Story:** As a user, I want to cancel active subscriptions, so that customers stop being charged.

#### Acceptance Criteria

1. WHEN a user cancels a subscription, THE System SHALL send a cancellation request to Mercado Pago's preapproval endpoint
2. WHEN a subscription is canceled successfully, THE System SHALL update its status to "canceled" in the database
3. WHEN canceling a subscription, THE System SHALL require the subscription ID
4. IF the subscription does not exist or is already canceled, THEN THE System SHALL return an appropriate error
5. WHEN a subscription is canceled, THE System SHALL record the cancellation timestamp

### Requirement 4: Update Subscription Amount

**User Story:** As a user, I want to change the billing amount of an active subscription, so that I can adjust pricing without creating a new subscription.

#### Acceptance Criteria

1. WHEN a user updates a subscription amount, THE System SHALL send the new amount to Mercado Pago's preapproval endpoint
2. WHEN an amount is updated successfully, THE System SHALL update the amount in the database
3. WHEN updating an amount, THE System SHALL require the subscription ID and new amount
4. WHEN updating an amount, THE System SHALL validate that the new amount is greater than zero
5. IF the subscription is canceled or does not exist, THEN THE System SHALL return an error

### Requirement 5: Change Subscription Payment Method

**User Story:** As a user, I want to update a customer's card for an active subscription, so that they can use a different payment method.

#### Acceptance Criteria

1. WHEN a user updates a subscription's card, THE System SHALL send the new card token to Mercado Pago's preapproval endpoint
2. WHEN a card is updated successfully, THE System SHALL update the card token in the database
3. WHEN updating a card, THE System SHALL require the subscription ID and new card token
4. IF the new card token is invalid, THEN THE System SHALL return an error and not update the subscription
5. WHEN a card is updated, THE System SHALL record the update timestamp

### Requirement 6: Retrieve Subscription Status

**User Story:** As a user, I want to check the current status of a subscription, so that I can monitor customer billing.

#### Acceptance Criteria

1. WHEN a user requests subscription details, THE System SHALL retrieve the subscription from the database
2. WHEN retrieving a subscription, THE System SHALL return: ID, status, amount, frequency, customer email, and last charge date
3. WHEN a subscription does not exist, THEN THE System SHALL return a 404 error
4. THE System SHALL retrieve subscription data from the local database (not always from Mercado Pago)

### Requirement 7: Handle Mercado Pago Webhooks

**User Story:** As a system, I want to receive and process subscription events from Mercado Pago, so that subscription status stays synchronized.

#### Acceptance Criteria

1. WHEN Mercado Pago sends a webhook event, THE System SHALL validate the webhook signature
2. WHEN a subscription_authorized event is received, THE System SHALL update the subscription status to "active"
3. WHEN a subscription_payment event is received, THE System SHALL record the payment and update last_charge_date
4. WHEN a subscription_canceled event is received, THE System SHALL update the subscription status to "canceled"
5. IF the webhook signature is invalid, THEN THE System SHALL reject the event and log the attempt

### Requirement 8: Database Schema Updates

**User Story:** As a developer, I want the database schema to support subscription management, so that subscription data is properly persisted.

#### Acceptance Criteria

1. THE Subscription model SHALL include fields: mp_preapproval_id, mp_plan_id, mp_card_token_id, billing_day, frequency, last_charge_date
2. WHEN a subscription is created, THE System SHALL automatically set createdAt and updatedAt timestamps
3. THE Subscription model SHALL maintain a foreign key relationship to the User model
4. THE System SHALL create a database migration to add new subscription fields

### Requirement 9: API Endpoints

**User Story:** As a frontend developer, I want REST API endpoints for subscription management, so that I can build the subscription UI.

#### Acceptance Criteria

1. THE System SHALL provide POST /subscriptions/authorize to create a subscription
2. THE System SHALL provide PUT /subscriptions/:id/cancel to cancel a subscription
3. THE System SHALL provide PUT /subscriptions/:id/amount to update subscription amount
4. THE System SHALL provide PUT /subscriptions/:id/card to update subscription card
5. THE System SHALL provide GET /subscriptions/:id to retrieve subscription details
6. THE System SHALL provide POST /webhooks/mercadopago to handle MP webhook events
7. ALL endpoints SHALL require authentication except the webhook endpoint
8. ALL endpoints SHALL validate input using Zod schemas

### Requirement 10: Error Handling and Logging

**User Story:** As a developer, I want proper error handling and logging, so that I can debug issues and monitor the system.

#### Acceptance Criteria

1. WHEN an error occurs during subscription operations, THE System SHALL log the error with context (user ID, subscription ID, error message)
2. WHEN Mercado Pago API returns an error, THE System SHALL parse and return a user-friendly error message
3. WHEN a webhook fails to process, THE System SHALL log the failure and retry mechanism
4. THE System SHALL distinguish between client errors (400) and server errors (500)
