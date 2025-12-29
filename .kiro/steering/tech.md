# Technology Stack

## Backend
- **Runtime**: Node.js with TypeScript (ES Modules)
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Payment Processing**: Mercado Pago SDK
- **WhatsApp Integration**: @whiskeysockets/baileys
- **Validation**: Zod schemas
- **Testing**: Jest with Supertest
- **File Processing**: Multer, PDF-lib
- **Scheduling**: node-cron
- **Documentation**: Swagger (swagger-jsdoc, swagger-ui-express)

## Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives
- **Notifications**: Sonner, React Toastify
- **Charts**: Recharts
- **Theme**: next-themes for dark/light mode

## Development Tools
- **Package Manager**: npm (backend), supports Bun (frontend)
- **Code Quality**: ESLint with Airbnb config
- **Database Migrations**: Prisma migrate
- **Environment**: Docker Compose for PostgreSQL

## Common Commands

### Backend
```bash
npm run dev          # Start development server with tsx watch
npm run build        # Compile TypeScript to JavaScript
npm start            # Run production server
npm run seed         # Seed database with test data
npm test             # Run Jest tests
```

### Frontend
```bash
npm run dev          # Start Vite development server (port 8080)
npm run build        # Build for production
npm run build:dev    # Build for development mode
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Database
```bash
npx prisma generate  # Generate Prisma client
npx prisma migrate   # Run database migrations
npx prisma studio    # Open Prisma Studio GUI
```

## Environment Setup
- Backend uses `.env` file for configuration
- Frontend uses `.env` file for API endpoints
- Docker Compose provides PostgreSQL on port 5433
- Prisma schema uses folder-based organization