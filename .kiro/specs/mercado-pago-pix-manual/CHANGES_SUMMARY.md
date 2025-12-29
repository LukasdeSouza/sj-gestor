# Changes Summary: PIX Manual Payments Spec

## 🎯 Key Changes Made

Based on your feedback, the spec has been updated with these important changes:

### 1. **Static PIX QR Code (Option 1)**
- ✅ Client generates QR Code once from their bank
- ✅ QR Code is stored in `.env` as `PIX_QR_CODE`
- ✅ Same QR Code is used for all payments (no generation needed)
- ✅ Simplifies implementation significantly

### 2. **Payment Records Instead of Subscriptions**
- ✅ Each plan selection creates a **Payment Record** (not a subscription)
- ✅ Payment record tracks the entire payment lifecycle
- ✅ Status flow: PENDING → PROOF_UPLOADED → APPROVED → (subscription activated)
- ✅ Clearer separation between payment and subscription

### 3. **Payments History Page for "Usuário Cliente"**
- ✅ New page: `/payments` (Pagamentos)
- ✅ Only visible to users with type "Usuário Cliente"
- ✅ Shows all user's payments in a table/list
- ✅ Displays: Payment ID, Plan, Amount, Status, Date, Proof URL
- ✅ Status badges: PENDING, PROOF_UPLOADED, APPROVED, REJECTED, CANCELED
- ✅ Actions: Re-upload proof (if REJECTED), Cancel (if PENDING/PROOF_UPLOADED)
- ✅ Sorted by creation date (newest first)
- ✅ Added to left sidebar menu

### 4. **Invoice/Proof Upload**
- ✅ User uploads invoice or screenshot of PIX payment
- ✅ File stored with payment record
- ✅ Admin can view proof before approving
- ✅ User can re-upload if rejected

### 5. **Updated Database Schema**
```prisma
// Status enum updated
enum PaymentStatus {
  PENDING           // Awaiting PIX payment
  PROOF_UPLOADED    // Invoice/proof submitted
  APPROVED          // Approved and subscription activated
  REJECTED          // Rejected, can re-upload
  CANCELED          // Canceled by user
}

// New fields in Subscription model
pix_qr_code           String?    // Static QR Code
proof_url             String?    // Invoice/proof URL
proof_uploaded_at     DateTime?  // When proof was uploaded
approved_at           DateTime?  // When admin approved
approved_by_admin_id  String?    // Which admin approved
rejected_at           DateTime?  // When rejected
canceled_at           DateTime?  // When canceled
```

### 6. **Updated API Endpoints**
```
POST   /payments/pix/select-plan        # Create payment record
POST   /payments/:id/upload-proof       # Upload invoice/proof
GET    /payments/me                     # Get user's payment history
GET    /payments/:id                    # Get specific payment details
PUT    /payments/:id/cancel             # Cancel payment/subscription
GET    /admin/payments                  # List all payments (admin)
PUT    /admin/payments/:id/approve      # Approve payment (admin)
PUT    /admin/payments/:id/reject       # Reject payment (admin)
```

### 7. **Updated Frontend Components**
- ✅ Task 15: **NEW** Payments History Page (`/pages/Payments.tsx`)
- ✅ Task 16: **NEW** Add Payments link to sidebar
- ✅ Task 17: **NEW** Add Payments Tab to Users.tsx (Admin Only)
- ✅ Task 18: **NEW** Admin Payments Modal Component
- ✅ Task 19: Updated API service to use `/payments/` endpoints
- ✅ Task 20: Checkpoint

### 8. **Updated Requirements**
- ✅ Requirement 1: "Select Plan and Create Payment Record"
- ✅ Requirement 2: "Upload Payment Invoice/Proof"
- ✅ Requirement 3: "Admin Approves Payment"
- ✅ Requirement 4: **NEW** "View Payment History"
- ✅ Requirement 5: "Cancel Payment/Subscription"
- ✅ Requirement 6: Database schema with PaymentStatus enum
- ✅ Requirement 7: Updated endpoints with `/payments/` prefix
- ✅ Requirement 8: Static PIX QR Code configuration
- ✅ Requirement 9: Error handling and logging
- ✅ Requirement 10: Stripe integration remains unchanged

## 📊 Task Count Update

| Phase | Before | After | Change |
|-------|--------|-------|--------|
| Backend | 11 | 11 | No change |
| Frontend | 8 | 9 | +1 (Admin Payments Tab) |
| Testing | 3 | 3 | No change |
| **Total** | **22** | **23** | **+1** |

## 🔄 User Flow

```
1. User selects plan
   ↓
2. System creates Payment Record (PENDING)
   ↓
3. User sees static PIX QR Code
   ↓
4. User scans QR Code and pays via PIX
   ↓
5. User uploads invoice/proof
   ↓
6. Payment status → PROOF_UPLOADED
   ↓
7. Admin reviews and approves
   ↓
8. Payment status → APPROVED
   ↓
9. Subscription activated
   ↓
10. User can view payment in Payments page
```

## 📱 Payments Page Features

**For "Usuário Cliente" users:**
- View all their payments
- See payment status
- View proof/invoice
- Re-upload if rejected
- Cancel if pending
- Track subscription history

**For Admins (in Users.tsx):**
- New "Pagamentos" tab in Users page
- View all payments from all users
- Filter by status, user, date
- View proof/invoice in modal
- Approve or reject payments
- See approval history
- Manage user access to plans

## 🔐 Security & Access Control

- ✅ Payments page only visible to "Usuário Cliente" users
- ✅ Users can only see their own payments
- ✅ Admins can see all payments
- ✅ File upload validation (size, type)
- ✅ Proof files stored securely
- ✅ Audit trail for admin approvals

## ✅ Stripe Integration

**UNCHANGED:**
- StripePortalController.ts
- StripeWebhookController.ts
- All Stripe routes
- All Stripe services
- All Stripe fields in Subscription model

**Both payment methods coexist independently**

## 🚀 Implementation Timeline

- **Phase 1 (Backend)**: 1 day (11 tasks)
- **Phase 2 (Frontend)**: 1.5 days (9 tasks)
- **Phase 3 (Testing)**: 0.5 day (3 tasks)
- **Total**: ~3 days

## 📝 Environment Variables

**NEW:**
```bash
PIX_QR_CODE="00020126580014br.gov.bcb.pix..."  # Static QR Code from client
PIX_KEY="email@dona.com"
PIX_ACCOUNT_HOLDER="Dona do Projeto"
UPLOAD_DIR="./uploads/proofs"
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES="image/jpeg,image/png,application/pdf"
```

## 🎯 Next Steps

1. ✅ Review updated spec files
2. ✅ Get static PIX QR Code from client
3. ✅ Update `.env` with PIX configuration
4. ✅ Start implementing tasks in order
5. ✅ Follow checkpoints for validation

## 📚 Updated Files

- ✅ `requirements.md` - Updated with new requirements
- ✅ `design.md` - Updated with PaymentStatus enum
- ✅ `tasks.md` - Updated with Payments page tasks
- ✅ `ENV_SETUP.md` - Already covers static QR Code
- ✅ `README.md` - Already covers overview
- ✅ `CHANGES_SUMMARY.md` - This file

---

**Ready to implement! 🚀**
