# SJ Gestor

Um sistema moderno de gestão de cobranças com integração ao WhatsApp, construído para otimizar o fluxo de caixa de empresas brasileiras. Automatize seus lembretes de vencimento, gerencie clientes, produtos e chaves PIX em um só lugar.

## 🚀 Funcionalidades

- **Gestão de Clientes**: Cadastro completo com validação de telefone (WhatsApp), datas de vencimento e preferências de cobrança automática.
- **Catálogo de Produtos/Serviços**: Gerenciamento de itens com preços e descrições para facilitar a cobrança.
- **Chaves PIX**: Suporte a múltiplas chaves (CPF, CNPJ, Email, Telefone, Aleatória) para recebimento.
- **Templates de Mensagem**: Criação de modelos personalizados com variáveis dinâmicas (`{nome}`, `{valor}`, `{vencimento}`) para envio no WhatsApp.
- **Integração WhatsApp**: Conexão via QR Code em tempo real (WebSocket) para envio automático de lembretes.
- **Dashboard**: Visão geral do negócio com métricas de inadimplência e faturamento.
- **Multi-usuário (Multi-tenant)**: Dados isolados por usuário com autenticação segura via Supabase.

## 🛠️ Arquitetura e Tecnologias

O projeto utiliza uma arquitetura moderna e escalável, separada em Frontend e Backend as a Service (BaaS).

### Frontend
- **React 18.3**: Biblioteca principal para construção da interface.
- **Vite**: Build tool rápida e servidor de desenvolvimento.
- **TypeScript**: Tipagem estática para maior segurança e manutenibilidade.
- **TanStack Query (React Query)**: Gerenciamento de estado do servidor e cache.
- **React Router DOM**: Roteamento no lado do cliente (SPA).
- **Tailwind CSS + Shadcn/ui**: Estilização moderna e componentes acessíveis baseados no Radix UI.
- **Zod + React Hook Form**: Validação de esquemas e manipulação de formulários robusta.

### Backend & Serviços
- **Supabase**: Plataforma completa de backend.
  - **PostgreSQL**: Banco de dados relacional robusto.
  - **Auth**: Autenticação segura.
  - **Edge Functions**: Funções serverless (Deno) para lógica específica (ex: WebSocket do WhatsApp).
  - **Realtime**: Subscrições para atualizações em tempo real.

## 📂 Estrutura do Projeto

A estrutura de pastas foi organizada para facilitar a escalabilidade e manutenção:

```bash
front-end/
├── src/
│   ├── api/                # Serviços de comunicação com o backend
│   ├── assets/             # Imagens e arquivos estáticos
│   ├── components/         # Componentes React reutilizáveis
│   │   ├── ui/             # Componentes base (shadcn/ui) ex: botões, inputs
│   │   └── ...             # Componentes específicos (ex: MaintenanceBanner)
│   ├── hooks/              # Custom Hooks (lógica reutilizável)
│   ├── pages/              # Páginas da aplicação (Rotas)
│   │   ├── WhatsApp.tsx    # Tela de conexão e status do WhatsApp
│   │   ├── Clients.tsx     # Listagem e gestão de clientes
│   │   ├── Dashboard.tsx   # Visão geral e métricas
│   │   └── ...
│   ├── schemas/            # Esquemas de validação Zod (ex: WhatsAppSchema)
│   ├── utils/              # Funções utilitárias (ex: formatação de moeda, telefone)
│   ├── App.tsx             # Componente raiz e configuração de rotas
│   └── main.tsx            # Ponto de entrada da aplicação
├── supabase/               # Configurações do Supabase
│   └── functions/          # Edge Functions (ex: whatsapp-qr)
└── ...
```

## 📦 Instalação e Execução

### Pré-requisitos
- Node.js atualizado.
- Gerenciador de pacotes (npm, yarn ou bun).

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd agendapix/front-end
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as Variáveis de Ambiente:**
   Crie um arquivo `.env` na raiz do `front-end` (use `.env.example` como base):
   ```env
   VITE_SUPABASE_PROJECT_ID="seu-project-id"
   VITE_SUPABASE_PUBLISHABLE_KEY="sua-publishable-key"
   VITE_SUPABASE_URL="https://seu-project-id.supabase.co"
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse via `http://localhost:8080`.

## 📘 Guia de Uso

### 1. Dashboard
Ao entrar no sistema, você verá o Painel de Controle. Ele exibe métricas vitais como total de clientes, cobranças pendentes e status da conexão. Use o menu lateral (que se recolhe em mobile) para navegar.

### 2. Conexão com WhatsApp
Para que o sistema envie cobranças, seu WhatsApp deve estar conectado:
1. Navegue até o menu **WhatsApp**.
2. Clique em **Conectar WhatsApp**.
3. O sistema gerará um **QR Code** único (via WebSocket).
4. Abra o WhatsApp no seu celular > Menu > Aparelhos Conectados > Conectar Aparelho.
5. Escaneie o código na tela.
6. O status mudará para **Conectado** (Verde).

### 3. Gestão de Clientes
Aqui você cadastra quem deve receber as cobranças.
- **Novo Cliente**: Clique em "+ Novo Cliente". Preencha Nome e Telefone (o sistema formata automaticamente).
- **Vencimento**: Define quando a cobrança deve ser feita.
- **Status de Cobrança**:
  - 🟢 **Check Verde (com data)**: Cobrança já enviada com sucesso no dia/hora mostrados.
  - 🕒 **Relógio Amarelo (Pendente)**: Cobrança agendada ou ainda não enviada.
- **Pagamentos**: Clique no ícone de "Dinheiro" na linha do cliente para registrar um pagamento manual se necessário.

### 4. Produtos e Chaves PIX
- **Produtos**: Cadastre os serviços ou itens que você vende. Isso facilita na hora de gerar descrições de cobrança.
- **Chaves PIX**: Cadastre suas chaves para que o cliente saiba onde pagar. Elas podem ser inseridas automaticamente nas mensagens de cobrança usando templates.

### 5. Automação
O "cérebro" do sistema. Com o WhatsApp conectado e clientes cadastrados com data de vencimento, o sistema monitora diariamente e envia as mensagens conforme os Templates configurados, sem que você precise cobrar um por um.

## 📜 Scripts Disponíveis

- `npm run dev`: Inicia o servidor local.
- `npm run build`: Gera o build de produção.
- `npm run preview`: Visualiza o build gerado localmente.
- `npm run lint`: Verifica erros de código (ESLint).

---
Desenvolvido com ❤️
