# SJ Gestor

A modern billing collection management system with WhatsApp integration, built for Brazilian businesses. Automate your billing reminders and manage clients, products, and PIX payment keys all in one place.

## Features

- **Client Management** - Add, edit, and organize clients with phone validation, due dates, and automatic billing preferences
- **Product/Service Catalog** - Create and manage your products and services with pricing
- **PIX Key Management** - Store multiple PIX keys (CPF, CNPJ, Email, Phone, Random) for payment collection
- **Message Templates** - Create customizable message templates with variables ({nome}, {valor}, {vencimento})
- **WhatsApp Integration** - Connect your WhatsApp account via QR code and send automated billing reminders
- **Dashboard** - Overview of your business with statistics and quick access to key features
- **Multi-tenant** - Secure user authentication with isolated data per user

## Tech Stack

**Frontend:**
- React 18.3.1 with TypeScript
- Vite 5.4.19 - Build tool and dev server
- React Router DOM 6.30.1 - Client-side routing
- TanStack React Query 5.83.0 - Server state management

**UI Framework:**
- shadcn/ui - Component library built on Radix UI
- Tailwind CSS 3.4.17 - Utility-first CSS
- Lucide React - Icon library

**Form Management:**
- React Hook Form 7.61.1 - Form state management
- Zod 4.1.12 - Schema validation

**Backend:**
- Supabase - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Edge Functions (Deno-based)
  - Real-time subscriptions

## Getting Started

### Prerequisites

- Node.js (recommended: install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm, yarn, or bun package manager

### Installation

1. Clone the repository:
```bash
git clone <YOUR_GIT_URL>
cd agendapix
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env` file in the root directory with the following variables:
```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## Available Scripts

- `npm run dev` - Start development server (port 8080)
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
agendapix/
├── src/
│   ├── assets/              # Images and static assets
│   ├── components/
│   │   ├── ui/             # shadcn/ui components
│   │   ├── DashboardLayout.tsx  # Main layout with sidebar
│   │   └── NavLink.tsx     # Custom navigation link
│   ├── hooks/              # Custom React hooks
│   ├── integrations/
│   │   └── supabase/       # Supabase client and types
│   ├── lib/                # Utility functions
│   ├── pages/              # Route pages
│   ├── App.tsx             # Main app component with routes
│   └── main.tsx            # Application entry point
├── supabase/
│   ├── functions/
│   │   └── whatsapp-qr/    # WebSocket edge function for QR codes
│   └── migrations/         # Database migrations
├── public/                 # Static public assets
└── index.html              # HTML template
```

## Database Schema

The application uses Supabase with the following tables:

- **clients** - Client records with phone, email, product_id, due_date, auto_billing
- **products** - Product/service catalog with name, value, description
- **pix_keys** - PIX payment keys (cpf, cnpj, email, phone, random)
- **message_templates** - Reusable message templates with variables
- **messages** - Message log with status and delivery tracking
- **profiles** - User profiles (full_name)
- **whatsapp_connections** - WhatsApp connection status per user

## Key Features

### Phone Validation
Custom Brazilian phone number validation with automatic formatting and E.164 normalization.

### WhatsApp Integration
Real-time WhatsApp QR code generation via WebSocket using Supabase Edge Functions. Connect your WhatsApp account and send automated billing reminders to clients.

### Multi-tenant Architecture
Each user has isolated data with secure authentication through Supabase. All tables use `user_id` foreign keys for data separation.

### Responsive Design
Mobile-first design with a sidebar that collapses on mobile devices for optimal user experience on any screen size.

## Development

This project was built with [Lovable](https://lovable.dev) and can be edited in multiple ways:

- **Lovable Platform**: Visit your [Lovable Project](https://lovable.dev/projects/d5889d8c-8fea-4b14-8dd2-6127440bb411) to edit via prompts
- **Local IDE**: Clone the repo and push changes
- **GitHub Codespaces**: Launch a cloud development environment
- **Direct GitHub edits**: Edit files directly in the GitHub interface

## Deployment

To deploy this application:

1. **Via Lovable**: Open [Lovable](https://lovable.dev/projects/d5889d8c-8fea-4b14-8dd2-6127440bb411) and click Share → Publish
2. **Custom Domain**: Navigate to Project > Settings > Domains to connect your custom domain

Read more: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]
