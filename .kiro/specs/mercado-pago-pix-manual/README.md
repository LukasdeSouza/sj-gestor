# Mercado Pago PIX Manual Payments - Spec Overview

## 🎯 What This Feature Does

Users can subscribe to plans using PIX payments:

1. **Select Plan** → User clicks "Assinar" on a plan
2. **Get QR Code** → System shows static PIX QR Code
3. **Make Payment** → User scans QR Code and pays via PIX
4. **Upload Proof** → User uploads screenshot of payment
5. **Admin Approves** → Admin verifies and approves
6. **Subscription Active** → Plan is activated

## 🔑 Key Points

✅ **Stripe remains completely unchanged** - Both payment methods coexist
✅ **Simple implementation** - No webhooks, no complex integrations
✅ **Manual approval** - Admin has full control
✅ **Local file storage** - Easy to implement, can migrate to cloud later
✅ **Estimated time** - 2-3 days for full implementation

## 📁 Spec Files

| File | Purpose |
|------|---------|
| `requirements.md` | 10 detailed requirements with acceptance criteria |
| `design.md` | Architecture, data models, error handling |
| `tasks.md` | 21 implementation tasks (3 phases) |
| `ENV_SETUP.md` | Environment variables guide |
| `README.md` | This file |

## 🚀 Quick Start

### 1. Review the Spec
- Read `requirements.md` to understand what needs to be built
- Read `design.md` to understand how it's structured
- Read `tasks.md` to see the implementation plan

### 2. Setup Environment
- Follow `ENV_SETUP.md` to configure environment variables
- Get your PIX QR Code from your bank
- Create `back-end/uploads/proofs/` directory

### 3. Implement
- Follow tasks in `tasks.md` sequentially
- Each task takes 1-2 hours
- Checkpoints ensure incremental validation

### 4. Test
- Unit tests for services and controllers
- Integration tests for full flows
- Property-based tests for correctness

## 📊 Implementation Phases

### Phase 1: Backend (Tasks 1-11)
- Database schema updates
- Services and controllers
- API routes
- File upload handling
- Error handling

**Checkpoint 11:** Backend complete, all endpoints working

### Phase 2: Frontend (Tasks 12-18)
- PIX payment modal
- Proof upload component
- Plans page updates
- Admin dashboard
- API service functions

**Checkpoint 18:** Frontend complete, full UI working

### Phase 3: Testing (Tasks 19-21)
- Integration tests
- Property-based tests
- Final validation

**Checkpoint 21:** All tests pass, ready for production

## 🔐 Security

- File upload validation (size, type)
- User data isolation (can't access others' subscriptions)
- Admin-only endpoints protected
- Proof files stored securely
- Audit trail for admin approvals

## 📝 Database Changes

Only the `Subscription` model is updated:

```prisma
// NEW fields added
pix_qr_code           String?
proof_url             String?
proof_uploaded_at     DateTime?
approved_at           DateTime?
approved_by_admin_id  String?
rejected_at           DateTime?

// NEW status values
enum SubscriptionStatus {
  PENDING
  PROOF_UPLOADED
  ACTIVE
  REJECTED
  CANCELED
}
```

**All Stripe fields remain unchanged.**

## 🔄 Stripe Integration

**Stripe code is NEVER modified:**
- StripePortalController.ts - UNCHANGED
- StripeWebhookController.ts - UNCHANGED
- All Stripe routes - UNCHANGED
- All Stripe services - UNCHANGED

**Both payment methods work independently:**
- User selects payment method (Stripe or PIX)
- Each method uses its own code path
- No conflicts or interference

## 📋 Requirements Summary

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Select plan and generate subscription | ✅ |
| 2 | Upload payment proof | ✅ |
| 3 | Admin approves payment | ✅ |
| 4 | Retrieve subscription status | ✅ |
| 5 | Cancel subscription | ✅ |
| 6 | Database schema updates | ✅ |
| 7 | API endpoints | ✅ |
| 8 | PIX configuration | ✅ |
| 9 | Error handling and logging | ✅ |
| 10 | Stripe remains unchanged | ✅ |

## 🧪 Testing Strategy

### Unit Tests
- PixSubscriptionService
- PixAdminService
- PixSubscriptionController
- PixAdminController
- Zod schemas

### Integration Tests
- Full PIX flow
- Error scenarios
- Admin operations
- File uploads

### Property-Based Tests
- Subscription uniqueness
- Status transition validity
- Proof upload idempotence
- Admin approval atomicity
- User data isolation

## 📦 Environment Variables

### Backend (NEW)
```bash
PIX_QR_CODE="..."
PIX_KEY="email@dona.com"
PIX_ACCOUNT_HOLDER="Dona do Projeto"
UPLOAD_DIR="./uploads/proofs"
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES="image/jpeg,image/png,application/pdf"
```

### Frontend (NEW)
```bash
VITE_PIX_QR_DISPLAY="image"
VITE_PIX_SHOW_KEY="true"
```

## 🎯 Success Criteria

✅ All 21 tasks completed
✅ All tests passing
✅ Stripe integration untouched
✅ No console errors or warnings
✅ Full PIX flow working end-to-end
✅ Admin dashboard functional
✅ File uploads working
✅ Error handling comprehensive

## 📞 Questions?

If you have questions about:
- **Requirements** → Check `requirements.md`
- **Architecture** → Check `design.md`
- **Implementation** → Check `tasks.md`
- **Environment** → Check `ENV_SETUP.md`

## 🚀 Ready to Start?

1. Review this README
2. Read `requirements.md`
3. Read `design.md`
4. Follow `tasks.md` sequentially
5. Use `ENV_SETUP.md` for configuration

**Let's build! 🎉**
