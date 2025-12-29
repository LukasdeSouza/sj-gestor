# Design Document: Mercado Pago PIX Manual Payments

## Overview

This design implements a simple PIX payment flow for plan subscriptions. Users select a plan, receive a static PIX QR Code, upload payment proof, and admins approve to activate the subscription. **Stripe integration remains completely unchanged and functional.**

## Architecture

### Layered Architecture (PIX Only - Stripe Untouched)

```
┌─────────────────────────────────────────┐
│         Frontend (React)                 │
│  - Plans Page (updated with PIX option)  │
│  - PIX Payment Modal (new)               │
│  - Proof Upload Component (new)          │
│  - Admin Dashboard (new)                 │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      API Layer (Express Routes)          │
│  - POST /subscriptions/pix/select-plan   │
│  - POST /subscriptions/:id/upload-proof  │
│  - GET /subscriptions/me                 │
│  - PUT /subscriptions/:id/cancel         │
│  - GET /admin/subscriptions (admin)      │
│  - PUT /admin/subscriptions/:id/approve  │
│  - PUT /admin/subscriptions/:id/reject   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│    Controllers (Request Handlers)        │
│  - PixSubscriptionController (new)       │
│  - PixAdminController (new)              │
│  - StripePortalController (UNCHANGED)    │
│  - StripeWebhookController (UNCHANGED)   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│    Services (Business Logic)             │
│  - PixSubscriptionService (new)          │
│  - PixAdminService (new)                 │
│  - StripeService (UNCHANGED)             │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   Repositories (Data Access)             │
│  - SubscriptionRepository (updated)      │
│  - StripeRepository (UNCHANGED)          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│    Database (PostgreSQL + Prisma)        │
│  - Subscription model (updated)          │
│  - User model (UNCHANGED)                │
│  - All Stripe fields (UNCHANGED)         │
└──────────────────────────────────────────┘
```

## Components and Interfaces

### 1. PixSubscriptionService
Handles PIX subscription business logic.

```typescript
interface PixSubscriptionService {
  // Select plan and create subscription
  selectPlan(userId: string, planId: PlanId): Promise<{
    subscriptionId: string
    planId: PlanId
    amount: number
    pixQrCode: string
    pixKey: string
    accountHolder: string
  }>
  
  // Upload payment proof
  uploadProof(subscriptionId: string, userId: string, file: Express.Multer.File): Promise<void>
  
  // Get user's subscription
  getSubscription(userId: string): Promise<SubscriptionDetails | null>
  
  // Cancel subscription
  cancelSubscription(subscriptionId: string, userId: string): Promise<void>
}
```

### 2. PixAdminService
Handles admin approval/rejection.

```typescript
interface PixAdminService {
  // List all subscriptions (admin only)
  listSubscriptions(filters?: { status?: SubscriptionStatus }): Promise<SubscriptionDetails[]>
  
  // Approve subscription
  approveSubscription(subscriptionId: string, adminId: string): Promise<void>
  
  // Reject subscription
  rejectSubscription(subscriptionId: string, adminId: string): Promise<void>
}
```

### 3. PixSubscriptionController
Handles HTTP requests for PIX subscriptions.

```typescript
interface PixSubscriptionController {
  selectPlan(req: Request, res: Response): Promise<void>
  uploadProof(req: Request, res: Response): Promise<void>
  getSubscription(req: Request, res: Response): Promise<void>
  cancelSubscription(req: Request, res: Response): Promise<void>
}
```

### 4. PixAdminController
Handles HTTP requests for admin operations.

```typescript
interface PixAdminController {
  listSubscriptions(req: Request, res: Response): Promise<void>
  approveSubscription(req: Request, res: Response): Promise<void>
  rejectSubscription(req: Request, res: Response): Promise<void>
}
```

### 5. SubscriptionRepository (Updated)
Data access layer for subscriptions.

```typescript
interface SubscriptionRepository {
  // Existing Stripe methods (UNCHANGED)
  getByUser(userId: string): Promise<Subscription | null>
  upsertByUser(userId: string, data: any): Promise<Subscription>
  updateStripeRefsByUser(userId: string, refs: any): Promise<Subscription>
  
  // New PIX methods
  createPix(data: CreatePixSubscriptionData): Promise<Subscription>
  findPixById(id: string): Promise<Subscription | null>
  findPixByUserId(userId: string): Promise<Subscription | null>
  updatePixProof(id: string, proofUrl: string): Promise<Subscription>
  updatePixStatus(id: string, status: SubscriptionStatus): Promise<Subscription>
  updatePixApproval(id: string, adminId: string, approvedAt: Date): Promise<Subscription>
  listPixSubscriptions(filters?: any): Promise<Subscription[]>
}
```

## Data Models

### Subscription Model (Updated)

```prisma
model Subscription {
  id                    String             @id @unique @default(uuid()) @db.Uuid
  user_id               String             @db.Uuid
  plan_id               PlanId
  status                PaymentStatus      @default(PENDING)
  
  // Stripe fields (UNCHANGED)
  stripe_customer_id    String?            @db.VarChar(100)
  stripe_subscription_id String?           @db.VarChar(100)
  stripe_payment_intent_id String?         @db.VarChar(100)
  
  // Mercado Pago fields (existing)
  mp_preference_id      String?            @db.VarChar(100)
  mp_payment_id         String?            @db.VarChar(100)
  
  // PIX Payment fields (NEW)
  pix_qr_code           String?            @db.Text
  proof_url             String?            @db.VarChar(500)
  proof_uploaded_at     DateTime?
  approved_at           DateTime?
  approved_by_admin_id  String?            @db.Uuid
  rejected_at           DateTime?
  canceled_at           DateTime?
  
  // Tracking
  activated_at          DateTime?
  
  // Relationships
  user                  User               @relation(fields: [user_id], references: [id], onDelete: Cascade)
  approved_by_admin     User?              @relation("ApprovedPayments", fields: [approved_by_admin_id], references: [id], onDelete: SetNull)
  
  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt
  
  @@unique([user_id])
  @@index([user_id])
  @@index([user_id, status])
  @@index([status])
}

enum PaymentStatus {
  PENDING           // Awaiting PIX payment
  PROOF_UPLOADED    // Invoice/proof submitted, awaiting admin approval
  APPROVED          // Approved and subscription activated
  REJECTED          // Rejected, can re-upload
  CANCELED          // Canceled by user
}
```

### DTOs (Data Transfer Objects)

```typescript
// Request DTOs
interface SelectPlanDTO {
  planId: PlanId
}

interface UploadProofDTO {
  subscriptionId: string
  file: Express.Multer.File
}

// Response DTOs
interface SubscriptionDetails {
  id: string
  status: SubscriptionStatus
  planId: PlanId
  amount: number
  pixQrCode?: string
  pixKey?: string
  proofUrl?: string
  proofUploadedAt?: Date
  approvedAt?: Date
  activatedAt?: Date
  canceledAt?: Date
}

interface AdminSubscriptionDetails extends SubscriptionDetails {
  userId: string
  userEmail: string
  approvedByAdminId?: string
  rejectedAt?: Date
}
```

## File Storage Strategy

### Option 1: Local Storage (Simplest)
```
back-end/uploads/proofs/
├── {subscriptionId}-{timestamp}.jpg
├── {subscriptionId}-{timestamp}.png
└── ...
```

### Option 2: Cloud Storage (Recommended for Production)
- AWS S3
- Google Cloud Storage
- Cloudinary

**For MVP: Use local storage, migrate to cloud later**

## Error Handling

### Error Types

```typescript
class PixSubscriptionError extends Error {
  constructor(message: string, public code: string, public statusCode: number) {
    super(message)
  }
}

class InvalidFileError extends PixSubscriptionError {}
class SubscriptionNotFoundError extends PixSubscriptionError {}
class SubscriptionAlreadyActiveError extends PixSubscriptionError {}
class UnauthorizedError extends PixSubscriptionError {}
```

## Security Considerations

- File upload validation (size, type, virus scan)
- User can only access their own subscription
- Admin-only endpoints require admin role
- Proof files stored securely (not in public folder)
- Sensitive data (PIX key) not logged
- Rate limiting on upload endpoint
- Audit trail for admin approvals

## Testing Strategy

### Unit Tests
- PixSubscriptionService: Mock repository
- PixAdminService: Mock repository
- PixSubscriptionController: Mock service
- Validation: Test Zod schemas

### Integration Tests
- Full PIX flow: select plan → upload proof → approve
- Error scenarios: invalid file, duplicate subscription
- Admin operations: approve, reject, list

## Correctness Properties

### Property 1: Subscription Uniqueness
*For any* user, there should be at most one active subscription at a time.
**Validates: Requirements 1.4**

### Property 2: Status Transition Validity
*For any* subscription, status transitions should follow valid paths:
- PENDING → PROOF_UPLOADED → ACTIVE
- PENDING → PROOF_UPLOADED → REJECTED → PROOF_UPLOADED
- Any status → CANCELED
**Validates: Requirements 2.1, 3.1, 5.1**

### Property 3: Proof Upload Idempotence
*For any* subscription, uploading the same proof twice should result in the same state.
**Validates: Requirements 2.1, 2.2**

### Property 4: Admin Approval Atomicity
*For any* subscription approval, either the entire operation succeeds (status + timestamp + admin ID) or fails completely.
**Validates: Requirements 3.1, 3.3**

### Property 5: User Data Isolation
*For any* user, they can only access their own subscription, not others'.
**Validates: Requirements 4.3**

## Deployment Considerations

- File upload directory must be writable
- Proof files should be backed up
- Consider CDN for proof file delivery
- Monitor upload endpoint for abuse
- Set up alerts for failed approvals
- Database migration must be tested before production

## Stripe Integration Guarantee

**CRITICAL:** The following remain completely unchanged:
- StripePortalController.ts
- StripeWebhookController.ts
- All Stripe routes
- All Stripe fields in Subscription model
- All Stripe services and repositories
- Stripe webhook handling

**Both payment methods coexist independently.**
