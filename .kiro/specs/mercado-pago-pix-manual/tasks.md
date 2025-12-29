# Implementation Plan: Mercado Pago PIX Manual Payments

## Overview

This plan breaks down the PIX manual payment feature into discrete, incremental tasks. Each task is independent and can be completed in 1-2 hours. **Stripe code is never touched.**

## Phase 1: Database & Backend Setup

- [x] 1. Update Subscription Schema
  - Add PIX fields to Subscription model: pix_qr_code, proof_url, proof_uploaded_at, approved_at, approved_by_admin_id, rejected_at
  - Update SubscriptionStatus enum: add PROOF_UPLOADED, REJECTED
  - Add relationship to User for approved_by_admin
  - Create Prisma migration: `npx prisma migrate dev -n add_pix_fields`
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 2. Create Zod Validation Schemas
  - Create SelectPlanSchema (planId validation)
  - Create UploadProofSchema (file validation)
  - Create ApproveSubscriptionSchema (adminId validation)
  - Store in `back-end/src/schemas/PixSubscriptionSchema.ts`
  - _Requirements: 7.9_

- [x] 3. Create PixSubscriptionRepository Methods
  - Implement createPix(data): Create new PIX subscription
  - Implement findPixById(id): Get subscription by ID
  - Implement findPixByUserId(userId): Get user's subscription
  - Implement updatePixProof(id, proofUrl): Update proof URL and timestamp
  - Implement updatePixStatus(id, status): Update subscription status
  - Implement updatePixApproval(id, adminId, approvedAt): Record admin approval
  - Implement listPixSubscriptions(filters): List all subscriptions (admin)
  - Store in `back-end/src/repositories/SubscriptionRepository.ts` (add methods)
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 4. Create PixSubscriptionService
  - Implement selectPlan(userId, planId): Create subscription, return PIX details
  - Implement uploadProof(subscriptionId, userId, file): Save proof, update status
  - Implement getSubscription(userId): Get user's subscription
  - Implement cancelSubscription(subscriptionId, userId): Cancel and downgrade to FREE
  - Add validation for subscription state transitions
  - Store in `back-end/src/services/PixSubscriptionService.ts`
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 4.1, 5.1_

- [x] 5. Create PixAdminService
  - Implement listSubscriptions(filters): List all subscriptions
  - Implement approveSubscription(subscriptionId, adminId): Approve and activate
  - Implement rejectSubscription(subscriptionId, adminId): Reject and allow re-upload
  - Add admin role validation
  - Store in `back-end/src/services/PixAdminService.ts`
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 6. Create PixSubscriptionController
  - Implement selectPlan(req, res): POST /subscriptions/pix/select-plan
  - Implement uploadProof(req, res): POST /subscriptions/:id/upload-proof
  - Implement getSubscription(req, res): GET /subscriptions/me
  - Implement cancelSubscription(req, res): PUT /subscriptions/:id/cancel
  - Add input validation using Zod schemas
  - Add authentication checks
  - Store in `back-end/src/controllers/PixSubscriptionController.ts`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.8_

- [x] 7. Create PixAdminController
  - Implement listSubscriptions(req, res): GET /admin/subscriptions
  - Implement approveSubscription(req, res): PUT /admin/subscriptions/:id/approve
  - Implement rejectSubscription(req, res): PUT /admin/subscriptions/:id/reject
  - Add admin role validation
  - Store in `back-end/src/controllers/PixAdminController.ts`
  - _Requirements: 7.5, 7.6, 7.7, 7.8_

- [x] 8. Create PIX Routes
  - Register POST /subscriptions/pix/select-plan (auth required)
  - Register POST /subscriptions/:id/upload-proof (auth required, multer)
  - Register GET /subscriptions/me (auth required)
  - Register PUT /subscriptions/:id/cancel (auth required)
  - Register GET /admin/subscriptions (auth required, admin only)
  - Register PUT /admin/subscriptions/:id/approve (auth required, admin only)
  - Register PUT /admin/subscriptions/:id/reject (auth required, admin only)
  - Create `back-end/src/routes/PixSubscriptionRouter.ts`
  - Add to `back-end/src/routes/index.ts`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

- [x] 9. Create File Upload Utility
  - Create multer configuration for proof uploads
  - Validate file type (jpg, png, pdf)
  - Validate file size (max 5MB)
  - Store files in `back-end/uploads/proofs/`
  - Create `back-end/src/utils/fileUpload.ts`
  - _Requirements: 2.3, 2.4_

- [ ] 10. Add Error Handling & Logging
  - Create custom error classes (PixSubscriptionError, InvalidFileError, etc.)
  - Add structured logging for all operations
  - Implement error response formatting
  - Add context to error logs (user ID, subscription ID, etc.)
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 11. Checkpoint - Backend Complete
  - Ensure all backend tests pass
  - Verify database migration runs successfully
  - Test all endpoints manually with Postman/curl
  - Verify Stripe code is completely untouched
  - Ask user if questions arise

## Phase 2: Frontend Implementation

- [ ] 12. Create PIX Payment Modal Component
  - Create `front-end/src/components/Subscription/PixPaymentModal.tsx`
  - Display PIX QR Code (as image or text)
  - Display PIX key and account holder
  - Display amount and plan details
  - Add "I've made the payment" button
  - _Requirements: 1.2, 1.3_

- [ ] 13. Create Proof Upload Component
  - Create `front-end/src/components/Subscription/ProofUploadForm.tsx`
  - File input for proof (jpg, png, pdf)
  - Preview of selected file
  - Upload button with loading state
  - Success/error messages
  - _Requirements: 2.1, 2.2_

- [ ] 14. Update Plans Page
  - Add payment method selector (Stripe or PIX)
  - When PIX selected: call selectPlan endpoint
  - Show PixPaymentModal with QR Code
  - After payment: show ProofUploadForm
  - Display subscription status
  - _Requirements: 1.1, 1.2_

- [ ] 15. Create Payments History Page
  - Create `front-end/src/pages/Payments.tsx`
  - Display all user's payments in a table/list
  - Show: payment ID, plan name, amount, status, creation date
  - Show status badges (PENDING, PROOF_UPLOADED, APPROVED, REJECTED, CANCELED)
  - Show proof URL (clickable to view)
  - Add re-upload button for REJECTED payments
  - Add cancel button for PENDING/PROOF_UPLOADED payments
  - Sort by creation date (newest first)
  - Only visible to "Usuário Cliente" users
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

- [ ] 16. Add Payments Link to Sidebar
  - Update DashboardLayout or navigation component
  - Add "Pagamentos" link to left sidebar
  - Only show for "Usuário Cliente" user type
  - Link to `/payments` route
  - _Requirements: 4.9_

- [ ] 17. Add Payments Tab to Users Page (Admin Only)
  - Update `front-end/src/pages/Users.tsx`
  - Add "Pagamentos" tab next to users list
  - Only show tab for Admin users
  - Display all payments from all users in a table
  - Show: user name, user email, plan, amount, status, date, proof URL
  - Add filters: status, user, date
  - Add approve/reject buttons for each payment
  - Add modal to view proof/invoice
  - _Requirements: 4.1.1, 4.1.2, 4.1.3, 4.1.4, 4.1.5, 4.1.6, 4.1.7, 4.1.8, 4.1.9, 4.1.10, 4.1.11, 4.1.12_

- [ ] 18. Create Admin Payments Modal Component
  - Create `front-end/src/components/Payments/AdminPaymentModal.tsx`
  - Display payment details (user, plan, amount, status)
  - Display proof/invoice image or PDF
  - Add approve button
  - Add reject button
  - Show approval history
  - _Requirements: 4.1.8, 4.1.9, 4.1.10_

- [ ] 19. Create API Service Functions
  - Create `front-end/src/api/models/payments.ts`
  - selectPlan(planId): POST /payments/pix/select-plan
  - uploadProof(paymentId, file): POST /payments/:id/upload-proof
  - getPayments(): GET /payments/me
  - getPaymentDetails(paymentId): GET /payments/:id
  - cancelPayment(paymentId): PUT /payments/:id/cancel
  - listPayments(): GET /admin/payments
  - approvePayment(paymentId): PUT /admin/payments/:id/approve
  - rejectPayment(paymentId): PUT /admin/payments/:id/reject
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

- [ ] 20. Checkpoint - Frontend Complete
  - Ensure all components render without errors
  - Test full PIX flow: select plan → upload proof → check status
  - Verify payments history page shows all payments
  - Verify admin payments tab in Users page works
  - Test error scenarios
  - Ask user if questions arise

## Phase 3: Integration & Testing

- [ ] 21. Integration Testing
  - Test full PIX flow: select plan → upload proof → admin approve → activate
  - Test error scenarios: invalid file, duplicate payment, unauthorized access
  - Test concurrent operations
  - Test Stripe integration still works (no regression)
  - Test payments history page shows correct data
  - Test admin payments tab shows all payments
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [ ] 22. Property-Based Testing
  - **Property 1: Payment Uniqueness** - User can't have 2 approved payments for same plan
  - **Property 2: Status Transition Validity** - Only valid status transitions allowed
  - **Property 3: Proof Upload Idempotence** - Same proof uploaded twice = same state
  - **Property 4: Admin Approval Atomicity** - Approval either fully succeeds or fails
  - **Property 5: User Data Isolation** - Users can only access their own payments
  - _Requirements: 1.4, 2.1, 3.1, 4.3_

- [ ] 23. Final Checkpoint - All Tests Pass
  - Ensure all unit tests pass
  - Ensure all integration tests pass
  - Ensure all property-based tests pass
  - Verify no console errors or warnings
  - Verify Stripe integration untouched
  - Verify payments page shows all payments correctly
  - Verify admin payments tab shows all payments correctly
  - Ask user if questions arise

- [ ] 21. Final Checkpoint - All Tests Pass
  - Ensure all unit tests pass
  - Ensure all integration tests pass
  - Ensure all property-based tests pass
  - Verify no console errors or warnings
  - Verify Stripe integration untouched
  - Ask user if questions arise

## Environment Variables

Add to `.env`:

```bash
# PIX Configuration
PIX_QR_CODE="00020126580014br.gov.bcb.pix..."
PIX_KEY="email@dona.com"
PIX_ACCOUNT_HOLDER="Dona do Projeto"

# File Upload
UPLOAD_DIR="./uploads/proofs"
MAX_FILE_SIZE=5242880  # 5MB in bytes
```

## Notes

- Tasks are sequential but can be parallelized after checkpoint 11
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- **Stripe code is NEVER modified**
- File uploads use local storage for MVP (migrate to cloud later)
- Admin role validation uses existing auth system
- Payments page is only visible to "Usuário Cliente" users
- Admin payments tab is integrated into Users.tsx page
- Static PIX QR Code is used (generated once by client)
