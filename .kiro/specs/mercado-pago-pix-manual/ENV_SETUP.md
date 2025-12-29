# Environment Variables Setup: PIX Manual Payments

## Overview

This guide explains all environment variables needed for the PIX manual payment feature.

## Backend Environment Variables

### Already Configured (No Changes Needed)

```bash
# Server
PORT=3020

# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# JWT Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIREIN=15d

# Application URLs
APP_API_URL=https://your-api-domain.com
APP_URL=https://your-frontend-domain.com

# Stripe (UNCHANGED - keep as is)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### New Variables for PIX (ADD THESE)

```bash
# ============================================
# PIX CONFIGURATION
# ============================================

# PIX QR Code (static, generated once)
# Get from: Mercado Pago dashboard or generate with your bank
# Format: 00020126580014br.gov.bcb.pix0136...
PIX_QR_CODE="00020126580014br.gov.bcb.pix0136xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx5204000053039865802BR5913DONA DO PROJETO6009SAO PAULO62410503***63041D3D"

# PIX Key (email, phone, CPF, or random)
# This is the account identifier for PIX
PIX_KEY="email@dona.com"

# Account Holder Name
# Name that appears in PIX transfer
PIX_ACCOUNT_HOLDER="Dona do Projeto"

# ============================================
# FILE UPLOAD CONFIGURATION
# ============================================

# Directory for proof uploads (relative to back-end/)
UPLOAD_DIR="./uploads/proofs"

# Maximum file size in bytes (5MB = 5242880)
MAX_FILE_SIZE=5242880

# Allowed file types (comma-separated)
ALLOWED_FILE_TYPES="image/jpeg,image/png,application/pdf"
```

## Frontend Environment Variables

### Already Configured (No Changes Needed)

```bash
# API Base URL
VITE_API_URL=https://your-api-domain.com
```

### New Variables for PIX (ADD THESE)

```bash
# ============================================
# PIX DISPLAY CONFIGURATION
# ============================================

# Display PIX QR Code as image or text
# Options: "image" or "text"
VITE_PIX_QR_DISPLAY="image"

# Show PIX key in UI
VITE_PIX_SHOW_KEY="true"
```

## How to Get PIX QR Code

### Option 1: Generate from Your Bank
1. Log into your bank's PIX dashboard
2. Generate a static QR Code for your PIX key
3. Copy the QR Code string (starts with "00020126...")
4. Add to `.env` as `PIX_QR_CODE`

### Option 2: Use Mercado Pago
1. Go to: https://www.mercadopago.com.br/developers/panel
2. Create a PIX key in your account
3. Generate QR Code
4. Copy and add to `.env`

### Option 3: Generate Programmatically
```bash
# Using qrcode library (already in your project)
npm install qrcode-generator
# Then generate in code and store the string
```

## Complete .env.example Template

```bash
# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=3020

# ============================================
# DATABASE
# ============================================
DATABASE_URL="postgresql://user:password@host:port/database"

# ============================================
# JWT AUTHENTICATION
# ============================================
JWT_SECRET=your_jwt_secret_key
JWT_EXPIREIN=15d

# ============================================
# APPLICATION URLs
# ============================================
APP_API_URL=https://your-api-domain.com
APP_URL=https://your-frontend-domain.com

# ============================================
# STRIPE CONFIGURATION (UNCHANGED)
# ============================================
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# ============================================
# MERCADO PAGO - PIX MANUAL PAYMENTS
# ============================================

# Static PIX QR Code
# Get from your bank or Mercado Pago dashboard
PIX_QR_CODE="00020126580014br.gov.bcb.pix0136xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx5204000053039865802BR5913DONA DO PROJETO6009SAO PAULO62410503***63041D3D"

# PIX Key (email, phone, CPF, or random)
PIX_KEY="email@dona.com"

# Account Holder Name
PIX_ACCOUNT_HOLDER="Dona do Projeto"

# ============================================
# FILE UPLOAD CONFIGURATION
# ============================================

# Directory for proof uploads
UPLOAD_DIR="./uploads/proofs"

# Maximum file size (5MB)
MAX_FILE_SIZE=5242880

# Allowed file types
ALLOWED_FILE_TYPES="image/jpeg,image/png,application/pdf"
```

## Complete .env.example for Frontend

```bash
# ============================================
# API CONFIGURATION
# ============================================
VITE_API_URL=https://your-api-domain.com

# ============================================
# PIX DISPLAY CONFIGURATION
# ============================================

# Display PIX QR Code as image or text
VITE_PIX_QR_DISPLAY="image"

# Show PIX key in UI
VITE_PIX_SHOW_KEY="true"
```

## Environment Variables Checklist

### Backend (.env)

- [ ] `PORT` - Server port (default: 3020)
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - JWT signing key
- [ ] `JWT_EXPIREIN` - JWT expiration time
- [ ] `APP_API_URL` - API domain URL
- [ ] `APP_URL` - Frontend domain URL
- [ ] `STRIPE_SECRET_KEY` - Stripe API key (UNCHANGED)
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret (UNCHANGED)
- [ ] `PIX_QR_CODE` - Static PIX QR Code string
- [ ] `PIX_KEY` - PIX key (email, phone, CPF, or random)
- [ ] `PIX_ACCOUNT_HOLDER` - Account holder name
- [ ] `UPLOAD_DIR` - Directory for proof uploads
- [ ] `MAX_FILE_SIZE` - Maximum file size in bytes
- [ ] `ALLOWED_FILE_TYPES` - Allowed MIME types

### Frontend (.env)

- [ ] `VITE_API_URL` - Backend API URL
- [ ] `VITE_PIX_QR_DISPLAY` - QR display mode (image/text)
- [ ] `VITE_PIX_SHOW_KEY` - Show PIX key in UI (true/false)

## Important Notes

1. **Never commit `.env` files** - They contain secrets
2. **Use `.env.example`** - Commit this with placeholder values
3. **PIX QR Code is static** - Generate once, reuse forever
4. **File uploads** - Create `back-end/uploads/proofs/` directory
5. **Stripe unchanged** - Keep all Stripe env vars as they are
6. **File size limit** - 5MB is reasonable for proof images
7. **Allowed file types** - jpg, png, pdf are sufficient

## Directory Structure

Create this directory for file uploads:

```bash
back-end/
├── uploads/
│   └── proofs/          # Proof files stored here
│       ├── {id}-1.jpg
│       ├── {id}-2.png
│       └── ...
```

Add to `.gitignore`:

```bash
# Uploaded files
back-end/uploads/
```

## Testing with Local Files

For development, you can use test images:

```bash
# Create test directory
mkdir -p back-end/uploads/proofs

# Add a test image
cp ~/Pictures/test.jpg back-end/uploads/proofs/
```

## Troubleshooting

### "PIX_QR_CODE not found"
- Check `.env` file exists in `back-end/` directory
- Verify `PIX_QR_CODE` is set
- Restart backend server

### "File upload failed"
- Check `UPLOAD_DIR` directory exists and is writable
- Verify `MAX_FILE_SIZE` is large enough
- Check file MIME type is in `ALLOWED_FILE_TYPES`

### "Stripe still works?"
- Yes! Stripe env vars are unchanged
- Both payment methods coexist independently
- No Stripe code was modified

## Next Steps

1. Update your `.env` files with the variables above
2. Get your PIX QR Code from your bank or Mercado Pago
3. Create the `back-end/uploads/proofs/` directory
4. Start implementing the tasks in `tasks.md`
