# Repository Guidelines - SJ Gestor

A comprehensive and objective guide for contributing to SJ Gestor. Keep changes focused, incremental, and consistent with existing code.

## Project Overview

**SJ Gestor** is an integrated business management platform for small and medium-sized Brazilian businesses, combining:
- Client and charge management
- PIX integration via Mercado Pago
- WhatsApp automation via Baileys
- Analytical dashboard
- Subscription plan system

**Technology Stack:**
- **Backend**: Node.js + TypeScript + Express.js + Prisma ORM + PostgreSQL
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Hosting**: Frontend (Vercel), Backend (Railway), Database (PostgreSQL), Storage (Supabase)
- **Integrations**: Mercado Pago, WhatsApp (Baileys), Supabase Storage

## Project Structure

```
├── back-end/                    # Express API + Prisma
│   ├── src/
│   │   ├── controllers/         # HTTP handlers (validation, response)
│   │   ├── services/            # Business logic
│   │   ├── repositories/        # Data access (Prisma queries)
│   │   ├── middlewares/         # Auth, logging, CORS
│   │   ├── routes/              # Route definitions
│   │   ├── schemas/             # Zod validation
│   │   ├── interfaces/          # TypeScript types
│   │   ├── integrations/        # Mercado Pago, Baileys
│   │   ├── utils/               # Helpers, logger, storage
│   │   ├── config/              # Configuration (plans, etc)
│   │   ├── cron/                # Scheduled jobs (node-cron)
│   │   ├── errors/              # Custom error classes
│   │   └── seeds/               # Initial data
│   ├── prisma/
│   │   └── schema/              # Prisma models (modular)
│   ├── scripts/                 # Build scripts (fix-imports.js)
│   ├── api/                     # Vercel entry point (deprecated)
│   ├── server.ts                # Local entry point
│   ├── app.ts                   # Express configuration
│   ├── tsconfig.json            # TypeScript config (ES Modules)
│   ├── vercel.json              # Vercel config (deprecated)
│   └── .vercelignore            # Vercel ignored files
│
├── front-end/                   # React + Vite
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── ui/              # shadcn/ui base components
│   │   │   ├── Client/          # Client components
│   │   │   ├── Charge/          # Charge components
│   │   │   ├── Product/         # Product components
│   │   │   ├── Payments/        # Payment components
│   │   │   └── templates/       # Reusable templates
│   │   ├── pages/               # Pages (routes)
│   │   ├── api/
│   │   │   ├── models/          # API types and interfaces
│   │   │   └── services/        # Request functions
│   │   ├── hooks/               # Custom React hooks
│   │   ├── schemas/             # Zod validation (client)
│   │   ├── utils/               # Utility functions
│   │   ├── types/               # TypeScript types
│   │   ├── constants/           # Constants (auth, etc)
│   │   ├── errors/              # Error handling
│   │   └── lib/                 # Configurations (query client, etc)
│   ├── public/                  # Static assets
│   ├── vite.config.ts           # Vite config (aliases @/*)
│   ├── tailwind.config.ts       # Tailwind config
│   ├── vercel.json              # Vercel config (SPA routing)
│   └── components.json          # shadcn/ui config
│
└── .kiro/                       # Kiro AI configuration
```

## Local Setup

### Prerequisites
- Node.js 20.x
- npm or yarn
- PostgreSQL (local or Docker)
- Git

### Backend Setup

```bash
cd back-end

# 1. Copy environment variables
cp .env.example .env

# 2. Configure .env with:
DATABASE_URL=postgresql://user:password@localhost:5432/sj_gestor
JWT_SECRET=your_secret_here
MERCADO_PAGO_ACCESS_TOKEN=your_token
PIX_QR_CODE=https://your-pix-url.com
PIX_KEY=your_pix_key
PIX_ACCOUNT_HOLDER=Your Name
SUPABASE_URL=https://your-project.supabase.co
SERVICE_ROLE=your_service_role_key
APP_API_URL=http://localhost:3020
FRONTEND_URL=http://localhost:8080

# 3. Install dependencies
npm install

# 4. Generate Prisma Client
npx prisma generate

# 5. Run migrations
npx prisma migrate dev

# 6. Seed (optional)
npm run seed

# 7. Start development
npm run dev
```

### Frontend Setup

```bash
cd front-end

# 1. Copy environment variables
cp .env.example .env

# 2. Configure .env with:
VITE_PUBLIC_API_URL=http://localhost:3020
VITE_API_URL=http://localhost:3020

# 3. Install dependencies
npm install

# 4. Start development (port 8080)
npm run dev
```

### Docker (PostgreSQL)

```bash
cd back-end
docker-compose up -d
```

## Build and Deploy

### Backend (Railway)

```bash
# Build locally
npm run build

# Start locally
npm start

# Deploy: Push to main, Railway auto-deploys
```

**Environment Variables on Railway:**
- Same as local `.env`
- `NODE_ENV=production`
- `DATABASE_URL` (provided by Railway)

### Frontend (Vercel)

```bash
# Build
npm run build

# Preview
npm run preview

# Deploy: Push to main, Vercel auto-deploys
```

**Vercel Configuration:**
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment: `VITE_PUBLIC_API_URL=https://your-backend-railway.com`

## Code Style and Conventions

### TypeScript
- Indentation: 2 spaces
- Always typed (avoid `any` when possible)
- Interfaces for public types, types for internal
- Well-named generics

### Naming
- **Components**: PascalCase (`PopUpCreateClient.tsx`)
- **Functions/Variables**: camelCase (`getUserPayments()`)
- **Constants**: UPPER_SNAKE_CASE (`TOKEN_COOKIE_KEY`)
- **Files**: PascalCase (components), camelCase (utils)
- **Database**: snake_case (columns), PascalCase (models)

### Backend Architecture

**Request Flow:**
```
Route → Middleware (Auth) → Controller → Service → Repository → Prisma
```

**Responsibilities:**
- **Controller**: Input validation, service call, response formatting
- **Service**: Business logic, orchestration, complex validations
- **Repository**: ALL Prisma queries, abstract data access
- **Middleware**: Authentication, logging, CORS, error handling

**Example:**
```typescript
// routes/ClientRouter.ts
router.post('/clients', AuthMiddleware, ClientController.create);

// controllers/ClientController.ts
static async create(req: Request, res: Response) {
  const validation = CreateClientSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ error: validation.error });
  
  const result = await ClientService.create(validation.data);
  return res.json({ data: result });
}

// services/ClientService.ts
static async create(data: CreateClientDTO) {
  // Complex validations, business rules
  return ClientRepository.create(data);
}

// repositories/ClientRepository.ts
static async create(data: CreateClientDTO) {
  return prisma.client.create({ data });
}
```

### Frontend
- Functional components with hooks
- Custom hooks for reusable logic
- React Query for caching/synchronization
- Zod for client-side validation
- Cookies (js-cookie) for token storage

## Testing

### Backend (Jest)

```bash
npm test                    # Run tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # Coverage
```

**Structure:**
- Tests in `back-end/tests/`
- Naming: `*.test.ts`
- Mock repositories in services/controllers
- Avoid real network/DB

**Example:**
```typescript
describe('ClientService', () => {
  it('should create client', async () => {
    const mockRepo = jest.spyOn(ClientRepository, 'create')
      .mockResolvedValue({ id: '1', name: 'Test' });
    
    const result = await ClientService.create({ name: 'Test' });
    expect(result.id).toBe('1');
  });
});
```

## Commits and Pull Requests

### Branch
- Default: `portal-code-alteracoes`
- Feature: `feature/descriptive-name`
- Bug: `fix/descriptive-name`

### Commits
- Imperative and short: `add client pagination`, `fix auth token validation`
- Group related changes
- Avoid giant commits

### Pull Requests
- Describe objective and context
- Verification steps
- Screenshots (frontend)
- Related issues
- Avoid unrelated refactors

## Security and Configuration

### Environment Variables
- **Never** commit `.env`
- Use `.env.example` as template
- Different values for dev/staging/prod
- Sensitive secrets: tokens, keys, URLs

### Authentication
- JWT with `jsonwebtoken`
- Password with `bcrypt`
- Token stored in cookie (httpOnly when possible)
- `AuthMiddleware` on protected routes

### Database
- Prisma Client singleton (via repositories)
- Migrations before seed
- Models in separate files (`prisma/schema/`)
- Always typed with Prisma types

### Storage
- Supabase Storage for files
- Public bucket for PIX proofs
- Upload via `uploadProofToStorage()` in `utils/supabaseStorage.ts`
- Public URLs returned to client

## Instructions for Agents

### General
- **Do not commit/push** without explicit authorization
- Work on the requested branch
- Do not delete migrations or alter history
- Avoid destructive actions

### Code
- Follow Controller → Service → Repository split
- All Prisma queries must be in Repository
- Validate input in Controller with Zod
- Handle errors with custom classes

### Performance
- Use server-side filters (don't fetch all and filter on front)
- Debounce on searches/pagination on front
- Indexes on database for frequent queries
- Cache with React Query

### Known Issues
- **Vercel + Baileys**: Serverless doesn't support persistent connections. Baileys runs on Railway.
- **ES Modules**: TypeScript compiles to ESM, `fix-imports.js` script adds `.js` extensions
- **Multer**: Uses memory storage, uploads to Supabase
- **SSE**: Works only on Railway, not on Vercel

## Useful Resources

- [Prisma Docs](https://www.prisma.io/docs/)
- [Express Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Baileys](https://github.com/WhiskeySockets/Baileys)
- [Mercado Pago SDK](https://github.com/mercadopago/sdk-nodejs)

