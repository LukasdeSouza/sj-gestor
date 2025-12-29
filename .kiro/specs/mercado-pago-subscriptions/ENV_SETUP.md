# Environment Variables Setup Guide

## Overview

This guide explains all environment variables needed for the Mercado Pago subscriptions feature to work properly.

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
```

### Mercado Pago Variables (Already Configured)

```bash
# Mercado Pago Access Token
# Get from: https://www.mercadopago.com.br/developers/panel/credentials
# This is your API key for making requests to MP
MERCADO_PAGO_ACCESS_TOKEN=TEST-8766826831414285-121717-fd1aca74673b48d35c17bd0326f1e5aa-1008890767

# Mercado Pago Webhook Secret
# Get from: https://www.mercadopago.com.br/developers/panel/webhooks
# Used to validate webhook signatures from MP
MERCADO_PAGO_WEBHOOK_SECRET=e21ed38f227bb60cfffacc68019166fd3e23ab0dccadcab707517c58531fe908
```

### New Variables for Subscriptions (ADD THESE)

```bash
# Mercado Pago Webhook URL
# This is the public URL where MP will send webhook events
# Format: https://your-domain.com/webhooks/mercadopago
MERCADO_PAGO_WEBHOOK_URL=https://your-api-domain.com/webhooks/mercadopago

# Mercado Pago Sandbox Mode (optional, for testing)
# Set to "true" for sandbox/testing, "false" for production
MERCADO_PAGO_SANDBOX_MODE=true

# Subscription Retry Configuration (optional)
# Number of times to retry failed MP API calls
SUBSCRIPTION_RETRY_ATTEMPTS=3

# Subscription Retry Delay (optional)
# Milliseconds to wait between retries (exponential backoff)
SUBSCRIPTION_RETRY_DELAY_MS=1000
```

## Frontend Environment Variables

### Already Configured (No Changes Needed)

```bash
# API Base URL
VITE_API_URL=https://your-api-domain.com
```

### New Variables for Subscriptions (ADD THESE)

```bash
# Mercado Pago Public Key
# Get from: https://www.mercadopago.com.br/developers/panel/credentials
# This is the PUBLIC key for card tokenization on frontend
VITE_MERCADO_PAGO_PUBLIC_KEY=TEST-1234567890abcdef1234567890abcdef

# Mercado Pago Sandbox Mode (optional, for testing)
# Must match backend setting
VITE_MERCADO_PAGO_SANDBOX_MODE=true
```

## How to Get These Values

### 1. Mercado Pago Access Token

1. Go to: https://www.mercadopago.com.br/developers/panel/credentials
2. You'll see two keys:
   - **Access Token** (starts with `TEST-` or `APP-`)
   - **Public Key** (for frontend)
3. Copy the Access Token and add to backend `.env`

### 2. Mercado Pago Public Key

1. Same page as above: https://www.mercadopago.com.br/developers/panel/credentials
2. Copy the **Public Key** and add to frontend `.env`

### 3. Mercado Pago Webhook Secret

1. Go to: https://www.mercadopago.com.br/developers/panel/webhooks
2. You'll see your webhook secret
3. Copy and add to backend `.env`

### 4. Mercado Pago Webhook URL

1. This is YOUR application's webhook endpoint
2. Format: `https://your-api-domain.com/webhooks/mercadopago`
3. Examples:
   - Production: `https://api.sj-gestor.com/webhooks/mercadopago`
   - Staging: `https://staging-api.sj-gestor.com/webhooks/mercadopago`
   - Local testing: Use ngrok to expose local server: `https://abc123.ngrok.io/webhooks/mercadopago`

## Complete .env.example Template

Here's the updated `.env.example` with all variables:

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
# MERCADO PAGO - PAYMENT GATEWAY
# ============================================
# Access Token for API requests
# Get from: https://www.mercadopago.com.br/developers/panel/credentials
MERCADO_PAGO_ACCESS_TOKEN=TEST-your-access-token-here

# Webhook Secret for signature validation
# Get from: https://www.mercadopago.com.br/developers/panel/webhooks
MERCADO_PAGO_WEBHOOK_SECRET=your-webhook-secret-here

# Public webhook URL (where MP sends events)
# Format: https://your-domain.com/webhooks/mercadopago
MERCADO_PAGO_WEBHOOK_URL=https://your-api-domain.com/webhooks/mercadopago

# Sandbox mode for testing (true/false)
MERCADO_PAGO_SANDBOX_MODE=true

# ============================================
# SUBSCRIPTION CONFIGURATION
# ============================================
# Retry attempts for failed MP API calls
SUBSCRIPTION_RETRY_ATTEMPTS=3

# Delay between retries in milliseconds
SUBSCRIPTION_RETRY_DELAY_MS=1000
```

## Complete .env.example for Frontend

```bash
# ============================================
# API CONFIGURATION
# ============================================
VITE_API_URL=https://your-api-domain.com

# ============================================
# MERCADO PAGO - CARD TOKENIZATION
# ============================================
# Public Key for card tokenization
# Get from: https://www.mercadopago.com.br/developers/panel/credentials
VITE_MERCADO_PAGO_PUBLIC_KEY=TEST-your-public-key-here

# Sandbox mode for testing (true/false)
# Must match backend setting
VITE_MERCADO_PAGO_SANDBOX_MODE=true
```

## Testing with Mercado Pago Sandbox

### Test Card Numbers

Use these card numbers in sandbox mode:

```
# Visa - Approved
4111 1111 1111 1111
Expiry: 11/25
CVV: 123

# Mastercard - Approved
5555 5555 5555 4444
Expiry: 11/25
CVV: 123

# Visa - Declined
4000 0000 0000 0002
Expiry: 11/25
CVV: 123
```

### Test Webhook Events

To test webhooks locally:

1. **Install ngrok**: https://ngrok.com/download
2. **Expose local server**:
   ```bash
   ngrok http 3020
   ```
3. **Update webhook URL** in MP dashboard:
   ```
   https://abc123.ngrok.io/webhooks/mercadopago
   ```
4. **Set in .env**:
   ```bash
   MERCADO_PAGO_WEBHOOK_URL=https://abc123.ngrok.io/webhooks/mercadopago
   ```

## Environment Variables Checklist

### Backend (.env)

- [ ] `PORT` - Server port (default: 3020)
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - JWT signing key
- [ ] `JWT_EXPIREIN` - JWT expiration time
- [ ] `APP_API_URL` - API domain URL
- [ ] `APP_URL` - Frontend domain URL
- [ ] `MERCADO_PAGO_ACCESS_TOKEN` - MP API key
- [ ] `MERCADO_PAGO_WEBHOOK_SECRET` - MP webhook secret
- [ ] `MERCADO_PAGO_WEBHOOK_URL` - Your webhook endpoint
- [ ] `MERCADO_PAGO_SANDBOX_MODE` - Testing mode (true/false)
- [ ] `SUBSCRIPTION_RETRY_ATTEMPTS` - Retry count (optional)
- [ ] `SUBSCRIPTION_RETRY_DELAY_MS` - Retry delay (optional)

### Frontend (.env)

- [ ] `VITE_API_URL` - Backend API URL
- [ ] `VITE_MERCADO_PAGO_PUBLIC_KEY` - MP public key
- [ ] `VITE_MERCADO_PAGO_SANDBOX_MODE` - Testing mode (true/false)

## Important Notes

1. **Never commit `.env` files** - They contain secrets
2. **Use `.env.example`** - Commit this with placeholder values
3. **Access Token vs Public Key**:
   - Access Token: Backend only (secret)
   - Public Key: Frontend (public, safe to expose)
4. **Webhook URL must be public** - MP needs to reach it
5. **Sandbox vs Production**:
   - Sandbox: Use TEST- prefixed tokens
   - Production: Use APP- prefixed tokens
6. **Webhook Secret validation** - Critical for security

## Troubleshooting

### "Invalid Access Token"
- Check token is not expired
- Verify you're using the correct token (TEST- for sandbox, APP- for production)
- Regenerate token in MP dashboard if needed

### "Webhook signature invalid"
- Verify webhook secret matches MP dashboard
- Check webhook URL is publicly accessible
- Ensure request body is not modified before validation

### "Card token invalid"
- Verify card number is valid for sandbox/production mode
- Check card hasn't expired
- Ensure public key matches environment (sandbox/production)

## Next Steps

1. Update your `.env` files with the variables above
2. Get your credentials from Mercado Pago dashboard
3. Test with sandbox credentials first
4. Once working, switch to production credentials
5. Start implementing the tasks in `tasks.md`
