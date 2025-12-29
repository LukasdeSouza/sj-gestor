# Project Structure

## Repository Organization
```
├── back-end/           # Node.js/Express API server
├── front-end/          # React/Vite client application
└── .kiro/              # Kiro AI assistant configuration
```

## Backend Structure (`back-end/`)
```
├── prisma/
│   └── schema/         # Prisma schema files (modular organization)
│       ├── *.prisma    # Individual model files
│       └── migrations/ # Database migration history
├── src/
│   ├── controllers/    # Route handlers and request/response logic
│   ├── services/       # Business logic layer
│   ├── repositories/   # Data access layer (Prisma queries)
│   ├── middlewares/    # Express middleware (auth, logging, etc.)
│   ├── routes/         # API route definitions
│   ├── schemas/        # Zod validation schemas
│   ├── interfaces/     # TypeScript type definitions
│   ├── integrations/   # External service integrations (Mercado Pago)
│   ├── utils/          # Utility functions and helpers
│   ├── config/         # Configuration files
│   ├── cron/           # Scheduled job definitions
│   └── seeds/          # Database seeding scripts
├── server.ts           # Application entry point
└── app.ts              # Express app configuration
```

## Frontend Structure (`front-end/`)
```
├── src/
│   ├── components/     # Reusable React components
│   │   ├── ui/         # shadcn/ui base components
│   │   ├── Client/     # Client-specific components
│   │   ├── Charge/     # Charge-specific components
│   │   ├── Product/    # Product-specific components
│   │   └── templates/  # Template-specific components
│   ├── pages/          # Route-level page components
│   ├── api/
│   │   ├── models/     # API data models and types
│   │   └── services/   # API service functions
│   ├── hooks/          # Custom React hooks
│   ├── schemas/        # Zod validation schemas (client-side)
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript type definitions
│   ├── constants/      # Application constants
│   ├── errors/         # Error handling utilities
│   └── lib/            # Library configurations
├── public/             # Static assets
└── components.json     # shadcn/ui configuration
```

## Architecture Patterns

### Backend Layered Architecture
- **Controllers**: Handle HTTP requests/responses, input validation
- **Services**: Implement business logic, orchestrate operations
- **Repositories**: Abstract data access, contain Prisma queries
- **Middlewares**: Cross-cutting concerns (auth, logging, CORS)

### Frontend Component Organization
- **Pages**: Route-level components in `/pages`
- **Feature Components**: Grouped by domain (Client, Charge, Product)
- **UI Components**: Reusable base components from shadcn/ui
- **Popup Components**: Modal dialogs for CRUD operations (PopUpCreate*, PopUpAlter*)

### Database Schema Organization
- **Modular Prisma**: Separate `.prisma` files per domain model
- **Main Schema**: `schema.prisma` contains generator and datasource config
- **Migration Management**: Timestamped migration folders

## Naming Conventions
- **Files**: PascalCase for components, camelCase for utilities
- **Components**: PascalCase (e.g., `PopUpCreateClient.tsx`)
- **Services/Repositories**: PascalCase with suffix (e.g., `ClientService.ts`)
- **API Routes**: RESTful conventions with plural nouns
- **Database**: snake_case for columns, PascalCase for models

## Key Configuration Files
- `tsconfig.json`: TypeScript configuration with ES modules
- `package.json`: Dependencies and npm scripts
- `docker-compose.yml`: PostgreSQL database setup
- `vite.config.ts`: Frontend build configuration with path aliases
- `tailwind.config.ts`: Styling configuration with custom theme