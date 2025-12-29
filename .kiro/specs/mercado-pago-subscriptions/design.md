# Design Document: Mercado Pago Subscriptions

## Overview

This design implements recurring subscription management through Mercado Pago's preapproval API. The system enables users to create subscription plans, authorize customers for recurring charges, and manage the subscription lifecycle (create, cancel, update). All subscription events are synchronized with Mercado Pago via webhooks.

## Architecture

### Layered Architecture

```
┌─────────────────────────────────────────┐
│         Frontend (React)                 │
│  - Subscription Checkout Component       │
│  - Card Tokenization (MP SDK)            │
│  - Subscription Management UI            │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      API Layer (Express Routes)          │
│  - POST /subscriptions/authorize         │
│  - PUT /subscriptions/:id/cancel         │
│  - PUT /subscriptions/:id/amount         │
│  - PUT /subscriptions/:id/card           │
│  - GET /subscriptions/:id                │
│  - POST /webhooks/mercadopago            │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│    Controllers (Request Handlers)        │
│  - SubscriptionController                │
│  - WebhookController (updated)           │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│    Services (Business Logic)             │
│  - SubscriptionService                   │
│  - MercadoPagoService (new)              │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   Repositories (Data Access)             │
│  - SubscriptionRepository                │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│    Database (PostgreSQL + Prisma)        │
│  - Subscription model (updated)          │
└──────────────────────────────────────────┘
```

## Components and Interfaces

### 1. MercadoPagoService
Handles all Mercado Pago API interactions.

```typescript
interface MercadoPagoService {
  // Plan management
  createPlan(planData: CreatePlanDTO): Promise<{ id: string }>
  
  // Subscription management
  createPreapproval(preapprovalData: CreatePreapprovalDTO): Promise<{ id: string }>
  cancelPreapproval(preapprovalId: string): Promise<void>
  updatePreapprovalAmount(preapprovalId: string, amount: number): Promise<void>
  updatePreapprovalCard(preapprovalId: string, cardTokenId: string): Promise<void>
  getPreapproval(preapprovalId: string): Promise<PreapprovalData>
  
  // Webhook validation
  validateWebhookSignature(body: any, signature: string): boolean
}
```

### 2. SubscriptionService
Orchestrates subscription business logic.

```typescript
interface SubscriptionService {
  authorizeSubscription(userId: string, authData: AuthorizeSubscriptionDTO): Promise<Subscription>
  cancelSubscription(subscriptionId: string): Promise<void>
  updateSubscriptionAmount(subscriptionId: string, newAmount: number): Promise<void>
  updateSubscriptionCard(subscriptionId: string, cardTokenId: string): Promise<void>
  getSubscriptionDetails(subscriptionId: string): Promise<SubscriptionDetails>
  handleWebhookEvent(event: WebhookEvent): Promise<void>
}
```

### 3. SubscriptionController
Handles HTTP requests and responses.

```typescript
interface SubscriptionController {
  authorize(req: Request, res: Response): Promise<void>
  cancel(req: Request, res: Response): Promise<void>
  updateAmount(req: Request, res: Response): Promise<void>
  updateCard(req: Request, res: Response): Promise<void>
  getDetails(req: Request, res: Response): Promise<void>
}
```

### 4. SubscriptionRepository
Data access layer for subscriptions.

```typescript
interface SubscriptionRepository {
  create(data: CreateSubscriptionData): Promise<Subscription>
  findById(id: string): Promise<Subscription | null>
  findByUserId(userId: string): Promise<Subscription[]>
  findByMpPreapprovalId(mpPreapprovalId: string): Promise<Subscription | null>
  update(id: string, data: UpdateSubscriptionData): Promise<Subscription>
  delete(id: string): Promise<void>
}
```

## Data Models

### Subscription Model (Updated)

```prisma
model Subscription {
  id                    String             @id @unique @default(uuid()) @db.Uuid
  user_id               String             @db.Uuid
  plan_id               PlanId
  status                SubscriptionStatus @default(PENDING)
  
  // Mercado Pago fields
  mp_preapproval_id     String?            @unique @db.VarChar(100)
  mp_plan_id            String?            @db.VarChar(100)
  mp_card_token_id      String?            @db.VarChar(255)
  
  // Subscription details
  customer_email        String             @db.VarChar(255)
  billing_day           Int?               // Day of month (1-31)
  frequency             String?            @db.VarChar(50) // "monthly", "yearly"
  amount                Decimal            @db.Decimal(10, 2)
  
  // Tracking
  last_charge_date      DateTime?
  authorized_at         DateTime?
  canceled_at           DateTime?
  
  // Relationships
  user                  User               @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt
  
  @@unique([user_id])
  @@index([user_id])
  @@index([mp_preapproval_id])
}

enum SubscriptionStatus {
  PENDING
  AUTHORIZED
  ACTIVE
  PAUSED
  CANCELED
}
```

### DTOs (Data Transfer Objects)

```typescript
// Request DTOs
interface AuthorizeSubscriptionDTO {
  planId: PlanId
  customerEmail: string
  cardTokenId: string
  billingDay?: number
  startDate: Date
}

interface UpdateAmountDTO {
  subscriptionId: string
  newAmount: number
}

interface UpdateCardDTO {
  subscriptionId: string
  cardTokenId: string
}

// Response DTOs
interface SubscriptionDetails {
  id: string
  status: SubscriptionStatus
  amount: number
  frequency: string
  customerEmail: string
  lastChargeDate?: Date
  authorizedAt?: Date
  canceledAt?: Date
}

interface WebhookEvent {
  id: string
  type: string
  data: {
    id: string
    status: string
    [key: string]: any
  }
}
```

## Error Handling

### Error Types

```typescript
class SubscriptionError extends Error {
  constructor(message: string, public code: string, public statusCode: number) {
    super(message)
  }
}

// Specific errors
class InvalidCardTokenError extends SubscriptionError {}
class SubscriptionNotFoundError extends SubscriptionError {}
class MercadoPagoAPIError extends SubscriptionError {}
class InvalidWebhookSignatureError extends SubscriptionError {}
```

### Error Handling Strategy

1. **Validation Errors** (400): Invalid input, missing fields
2. **Authentication Errors** (401): Missing or invalid token
3. **Not Found Errors** (404): Subscription doesn't exist
4. **Mercado Pago Errors** (502): API failures, retry with exponential backoff
5. **Server Errors** (500): Unexpected errors, log and alert

## Testing Strategy

### Unit Tests
- MercadoPagoService: Mock MP API responses
- SubscriptionService: Mock repository and MP service
- SubscriptionRepository: Test database operations
- Validation: Test Zod schemas

### Integration Tests
- Full subscription flow: authorize → charge → cancel
- Webhook processing: validate signature → update status
- Error scenarios: invalid card, API failures

### Property-Based Tests
- Subscription state transitions are valid
- Amount updates preserve subscription integrity
- Webhook events idempotent (same event processed twice = same result)

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Subscription Authorization Idempotence
*For any* valid authorization request, authorizing the same subscription twice should result in only one active subscription (idempotent operation).
**Validates: Requirements 2.1, 2.2**

### Property 2: Cancellation State Transition
*For any* authorized subscription, after cancellation, the subscription status should be "canceled" and no further charges should occur.
**Validates: Requirements 3.1, 3.2**

### Property 3: Amount Update Consistency
*For any* subscription with an updated amount, the new amount should be reflected in both the database and Mercado Pago's records.
**Validates: Requirements 4.1, 4.2**

### Property 4: Card Update Idempotence
*For any* subscription with a card update, updating the card twice with the same token should result in the same state.
**Validates: Requirements 5.1, 5.2**

### Property 5: Webhook Event Idempotence
*For any* webhook event, processing the same event twice should result in the same subscription state (no duplicate charges or status changes).
**Validates: Requirements 7.1, 7.2, 7.3**

### Property 6: Status Retrieval Accuracy
*For any* subscription, the retrieved status should match the current state in the database.
**Validates: Requirements 6.1, 6.2**

### Property 7: Authorization Requires Valid Card Token
*For any* authorization attempt with an invalid card token, the system should reject it and not create a subscription.
**Validates: Requirements 2.5**

### Property 8: Cancellation Prevents Further Charges
*For any* canceled subscription, attempting to update its amount or card should fail with an appropriate error.
**Validates: Requirements 3.4, 4.5**

## Deployment Considerations

- Mercado Pago webhook endpoint must be publicly accessible
- Webhook signature validation is critical for security
- Implement retry logic for failed MP API calls
- Monitor webhook processing latency
- Set up alerts for failed subscription operations
- Database migration must be tested before production deployment

## Security Considerations

- Card tokens are never stored in plain text (handled by MP)
- Webhook signatures must be validated
- All endpoints require authentication (except webhooks)
- Sensitive data (card tokens) logged only in debug mode
- Rate limiting on subscription endpoints
- Audit trail for all subscription changes
