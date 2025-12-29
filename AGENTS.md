# Repository Guidelines

Guia rápido e objetivo para contribuir com o AgendaPix. Mantenha mudanças focadas, incrementais e consistentes com o código existente.

## Estrutura do Projeto
- Back-end (Express + Prisma): `back-end/src/{controllers,services,repositories,routes,schemas,utils,integrations,seeds}` e `back-end/prisma/`.
- Front-end (Vite + React + shadcn/ui): `front-end/src/{pages,components,hooks,api,schemas,utils}`.
- Aliases (front): importe com `@/*` (ver `front-end/vite.config.ts` e `front-end/tsconfig*.json`).

## Como Rodar, Build e Testes
- Back-end dev: `cd back-end && npm run dev` (tsx watch). Copie `.env.example` → `.env` e defina `DATABASE_URL`, `APP_API_URL`, chaves de pagamento.
- Back-end build/start: `npm run build` → `npm start`.
- Prisma: `npx prisma generate`, `npx prisma migrate dev -n <nome>`, `npx prisma db push`.
- Seed: `cd back-end && npm run seed` (requer DB válido e migrações aplicadas).
- Testes API: `cd back-end && npm test` (Jest, ESM).
- Front-end dev: `cd front-end && npm run dev` (Vite em 8080). Build/preview: `npm run build` → `npm run preview`.

## Estilo de Código e Convenções
- TypeScript em todo o projeto; indentação de 2 espaços. Prefira funções pequenas, tipadas e puras.
- Arquitetura (back-end): Controllers (HTTP), Services (regras), Repositories (todas as chamadas Prisma).
- Nomes: Components em PascalCase; funções/variáveis em camelCase; constantes em UPPER_SNAKE.
- Lint/format: siga o estilo existente; front-end possui `npm run lint`.

## Testes
- Use Jest no back-end. Testes em `back-end/tests`, nomeando `*.test.ts`.
- Em services/controllers: faça mock de repositórios; cubra sucesso e erros comuns; evite rede/DB real.

## Commits e Pull Requests
- Branch: trabalhe na branch acordada (padrão `portal-code-alteracoes`).
- Commits: imperativos e curtos (ex.: `add products pagination`). Agrupe mudanças relacionadas.
- PRs: descreva objetivo, passos de verificação, prints (front) e issues relacionadas. Evite refactors não relacionados.

## Segurança e Configuração
- Não faça commit de segredos. Back-end usa `.env`; front usa envs do Vite.
- Para pagamentos, configure `MERCADO_PAGO_ACCESS_TOKEN`, `APP_API_URL`, `APP_URL`.
- Prisma: aplique migrações antes do seed; prefira um cliente Prisma único por processo (singleton) via repositórios.

## Instruções para Agentes
- Não faça commit/push sem autorização explícita. Trabalhe na branch solicitada.
- Não apague migrations nem altere histórico sem instrução. Evite ações destrutivas.
- Siga o split Controller → Service → Repository; toda consulta Prisma deve ficar no Repository.
- Quando possível, use filtros server-side e debounce para buscas/paginação no front.

