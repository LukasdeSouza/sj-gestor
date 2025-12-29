# Requirements Document: Mercado Pago PIX Manual Payments

## Introduction

This feature enables SJ Gestor users to subscribe to plans using PIX payments. Users select a plan, receive a static PIX QR Code, make the payment, upload proof of payment, and the subscription is activated. This runs **in parallel with existing Stripe integration** - Stripe code remains unchanged and fully functional.

## Glossary

- **PIX**: Brazilian instant payment system
- **QR Code**: Static QR code for PIX payment (generated once, reused)
- **Proof of Payment**: Screenshot or receipt showing PIX transaction
- **Subscription**: User's plan activation record
- **Subscription Status**: Current state (PENDING, PROOF_UPLOADED, ACTIVE, CANCELED)
- **Admin**: User with permission to approve/reject payments
- **User**: SJ Gestor account holder subscribing to a plan

## Requirements

### Requirement 1: Select Plan and Create Payment Record

**User Story:** As a user, I want to select a plan and create a payment record, so that I can track my subscription payment.

#### Acceptance Criteria

1. WHEN a user clicks "Assinar" on a plan, THE System SHALL create a payment record with status "PENDING"
2. WHEN a payment record is created, THE System SHALL return the static PIX QR Code and payment details
3. WHEN returning payment data, THE System SHALL include: payment ID, plan name, amount, PIX key, and QR Code
4. WHEN a payment already exists for the user with status PENDING, THE System SHALL return the existing payment (not create a duplicate)
5. IF the plan does not exist, THEN THE System SHALL return a 400 error
6. WHEN a payment record is created, THE System SHALL record the creation timestamp

### Requirement 2: Upload Payment Invoice/Proof

**User Story:** As a user, I want to upload an invoice or screenshot of my PIX payment, so that the admin can verify and activate my subscription.

#### Acceptance Criteria

1. WHEN a user uploads a proof file, THE System SHALL store the file (local storage or cloud)
2. WHEN a proof is uploaded, THE System SHALL update the payment record status to "PROOF_UPLOADED"
3. WHEN uploading a proof, THE System SHALL validate the file is an image or PDF (jpg, png, pdf)
4. WHEN uploading a proof, THE System SHALL require the payment ID
5. IF the payment does not exist or is already approved, THEN THE System SHALL return an error
6. WHEN a proof is uploaded, THE System SHALL record the upload timestamp
7. WHEN a proof is uploaded, THE System SHALL store the file URL in the payment record

### Requirement 3: Admin Approves Payment

**User Story:** As an admin, I want to review uploaded invoices and approve/reject payments, so that I can activate valid subscriptions.

#### Acceptance Criteria

1. WHEN an admin approves a payment, THE System SHALL update its status to "APPROVED"
2. WHEN an admin rejects a payment, THE System SHALL update its status to "REJECTED" and allow re-upload
3. WHEN approving a payment, THE System SHALL record the approval timestamp and admin ID
4. WHEN a payment is approved, THE System SHALL activate the user's subscription to the selected plan
5. IF the user is not an admin, THEN THE System SHALL return a 403 error
6. WHEN a payment is approved, THE System SHALL send a confirmation email to the user
7. WHEN a payment is approved, THE System SHALL update the user's plan in the database

### Requirement 4: View Payment History

**User Story:** As a "Usuário Cliente" user, I want to see all my payments in a dedicated page, so that I can track my subscription history.

#### Acceptance Criteria

1. WHEN a "Usuário Cliente" user accesses the payments page, THE System SHALL display all their payment records
2. WHEN displaying payments, THE System SHALL show: payment ID, plan name, amount, status, creation date, and proof URL
3. WHEN a payment status is "PROOF_UPLOADED", THE System SHALL show "Aguardando aprovação" (Awaiting approval)
4. WHEN a payment status is "APPROVED", THE System SHALL show "Aprovado" (Approved)
5. WHEN a payment status is "REJECTED", THE System SHALL show "Rejeitado" (Rejected) with option to re-upload
6. WHEN a payment status is "PENDING", THE System SHALL show "Aguardando comprovante" (Awaiting proof)
7. THE System SHALL only show payments for the logged-in user (not other users' payments)
8. WHEN a payment is approved, THE System SHALL display the approval date and admin name
9. THE Payments page SHALL be accessible from the left sidebar menu for "Usuário Cliente" users

### Requirement 4.1: Admin View All Payments

**User Story:** As an Admin, I want to see all payments from all users in the Users page, so that I can approve/reject subscriptions and manage user access.

#### Acceptance Criteria

1. WHEN an Admin views the Users page, THE System SHALL display a "Pagamentos" tab/section
2. WHEN the Admin clicks the "Pagamentos" tab, THE System SHALL display all payments from all users
3. WHEN displaying all payments, THE System SHALL show: user name, user email, plan name, amount, status, creation date, and proof URL
4. WHEN a payment status is "PROOF_UPLOADED", THE System SHALL show "Aguardando aprovação" (Awaiting approval)
5. WHEN a payment status is "APPROVED", THE System SHALL show "Aprovado" (Approved)
6. WHEN a payment status is "REJECTED", THE System SHALL show "Rejeitado" (Rejected)
7. WHEN a payment status is "PENDING", THE System SHALL show "Aguardando comprovante" (Awaiting proof)
8. THE Admin SHALL be able to view the proof/invoice by clicking on the payment
9. THE Admin SHALL be able to approve a payment directly from the payments tab
10. THE Admin SHALL be able to reject a payment directly from the payments tab
11. THE Admin SHALL be able to filter payments by status, user, or date
12. THE Admin SHALL only see this tab if their user type is "Admin"

### Requirement 5: Cancel Payment/Subscription

**User Story:** As a user, I want to cancel my subscription, so that I can stop using the plan.

#### Acceptance Criteria

1. WHEN a user cancels a subscription, THE System SHALL update the payment record status to "CANCELED"
2. WHEN a subscription is canceled, THE System SHALL record the cancellation timestamp
3. WHEN canceling a subscription, THE System SHALL require the payment ID
4. IF the payment is already canceled or rejected, THEN THE System SHALL return an error
5. WHEN a subscription is canceled, THE System SHALL downgrade the user to FREE plan

### Requirement 6: Database Schema Updates

**User Story:** As a developer, I want the database schema to support PIX payments, so that payment data is properly persisted.

#### Acceptance Criteria

1. THE Subscription model SHALL include fields: pix_qr_code, proof_url, proof_uploaded_at, approved_at, approved_by_admin_id, rejected_at, canceled_at
2. WHEN a payment record is created, THE System SHALL automatically set createdAt and updatedAt timestamps
3. THE Subscription model SHALL maintain a foreign key relationship to the User model
4. THE System SHALL create a database migration to add new payment fields
5. THE SubscriptionStatus enum SHALL include: PENDING, PROOF_UPLOADED, APPROVED, REJECTED, CANCELED
6. THE System SHALL add an index on (user_id, status) for efficient payment history queries

### Requirement 7: API Endpoints

**User Story:** As a frontend developer, I want REST API endpoints for PIX payment management, so that I can build the payment UI.

#### Acceptance Criteria

1. THE System SHALL provide POST /payments/pix/select-plan to create a payment record and get PIX QR Code
2. THE System SHALL provide POST /payments/:id/upload-proof to upload payment invoice/proof
3. THE System SHALL provide GET /payments/me to retrieve user's payment history
4. THE System SHALL provide GET /payments/:id to retrieve a specific payment details
5. THE System SHALL provide PUT /payments/:id/cancel to cancel a payment/subscription
6. THE System SHALL provide GET /admin/payments to list all payments (admin only)
7. THE System SHALL provide PUT /admin/payments/:id/approve to approve a payment (admin only)
8. THE System SHALL provide PUT /admin/payments/:id/reject to reject a payment (admin only)
9. ALL endpoints SHALL require authentication except the webhook endpoint
10. ALL endpoints SHALL validate input using Zod schemas
11. GET /payments/me SHALL return payments sorted by creation date (newest first)

### Requirement 8: PIX Configuration

**User Story:** As a system, I want to use a static PIX QR Code, so that users can make payments to the correct account.

#### Acceptance Criteria

1. THE System SHALL use a static PIX QR Code (generated once by the client)
2. THE System SHALL store PIX QR Code in environment variable
3. THE System SHALL store PIX key (email, phone, CPF, or random) in environment variable
4. THE System SHALL store account holder name in environment variable
5. WHEN generating a payment record, THE System SHALL include PIX details in the response
6. THE PIX QR Code SHALL NOT change between requests (static)

### Requirement 9: Error Handling and Logging

**User Story:** As a developer, I want proper error handling and logging, so that I can debug issues and monitor the system.

#### Acceptance Criteria

1. WHEN an error occurs during subscription operations, THE System SHALL log the error with context (user ID, subscription ID, error message)
2. WHEN a file upload fails, THE System SHALL return a user-friendly error message
3. WHEN a database operation fails, THE System SHALL log the failure and return a 500 error
4. THE System SHALL distinguish between client errors (400) and server errors (500)

### Requirement 10: Stripe Integration Remains Unchanged

**User Story:** As a developer, I want Stripe integration to remain fully functional, so that existing users are not affected.

#### Acceptance Criteria

1. WHEN a user selects Stripe payment, THE System SHALL use existing Stripe code (no changes)
2. WHEN a user selects PIX payment, THE System SHALL use new PIX code (no Stripe involvement)
3. THE System SHALL NOT modify any Stripe controllers, services, or repositories
4. THE System SHALL NOT modify any Stripe routes or webhooks
5. BOTH payment methods SHALL coexist without conflicts
