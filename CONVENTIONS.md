# Convenções de Código e Organização

## Estrutura do Projeto

```
controle-de-ponto/
├── backend/          # API NestJS
├── frontend/         # SvelteKit
├── .github/          # CI/CD
├── docker-compose.yml
├── .env.example
└── README.md
```

## Git

### Branches

- `main` — produção, protegida
- `develop` — desenvolvimento integrado
- `feature/*` — novas funcionalidades
- `fix/*` — correções
- `hotfix/*` — correções urgentes em produção

### Commits (Conventional Commits)

```
<tipo>(<escopo>): <descrição>

feat(auth): adiciona refresh token rotation
fix(time-records): corrige validação de sequência
chore(docker): atualiza versão do PostgreSQL
docs(readme): adiciona instruções de setup
test(auth): adiciona testes do login
refactor(attendance): extrai cálculo de horas
```

**Tipos:** `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `style`, `perf`, `ci`

## Backend (NestJS)

### Módulos

Cada feature é um módulo NestJS independente:

```
src/<feature>/
├── <feature>.module.ts
├── <feature>.controller.ts
├── <feature>.service.ts
├── <feature>.service.spec.ts     (testes unitários)
└── dto/
    ├── create-<feature>.dto.ts
    ├── update-<feature>.dto.ts
    └── filter-<feature>.dto.ts   (quando aplicável)
```

### Naming

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Arquivo | kebab-case | `time-records.service.ts` |
| Classe | PascalCase | `TimeRecordsService` |
| Método | camelCase | `createManual()` |
| Variável | camelCase | `todayRecords` |
| Constante | UPPER_SNAKE_CASE | `VALID_SEQUENCE` |
| DTO | PascalCase + Dto | `CreateManualTimeRecordDto` |
| Enum (Prisma) | PascalCase | `TimeRecordType` |
| Tabela (DB) | snake_case plural | `time_records` |
| Coluna (DB) | snake_case | `created_at` |

### Controller

- Decorators Swagger em todos os endpoints (`@ApiTags`, `@ApiOperation`, `@ApiBearerAuth`)
- `@Public()` para endpoints sem autenticação
- `@Roles(Role.COMPANY_ADMIN)` para endpoints administrativos
- `@CurrentUser()` para obter o usuário autenticado
- Retornar diretamente o resultado do service (sem try/catch no controller)

### Service

- Validações de negócio no service, não no controller
- Isolamento multiempresa: **sempre** filtrar por `companyId` do `requestingUser`
- Usar `NotFoundException`, `ForbiddenException`, `ConflictException`, `BadRequestException`
- Reutilizar `findOne()` internamente para validar existência e permissão

### DTOs

- Usar `class-validator` para validação
- Usar `@ApiProperty()` / `@ApiPropertyOptional()` para Swagger
- Update DTOs estendem `PartialType(CreateDto)`
- Não expor campos internos (password hash) nos retornos

### Prisma

- Model IDs: UUID (`@default(uuid())`)
- Timestamps: `createdAt`/`updatedAt` com `@map("snake_case")`
- Soft delete: campo `active: Boolean` (nunca deletar registros)
- Relações com `onDelete: Cascade` onde faz sentido
- `@@map("table_name")` para nomes de tabela em snake_case

## Frontend (SvelteKit)

### Estrutura

```
src/
├── app.html          # HTML base
├── app.css           # Tailwind + componentes globais
├── hooks.server.ts   # Middleware SvelteKit
├── lib/
│   ├── api/          # Cliente HTTP (classe ApiClient)
│   ├── stores/       # Svelte stores (auth)
│   ├── types/        # Interfaces TypeScript
│   └── utils/        # Helpers (formatação, labels)
└── routes/
    ├── +layout.svelte    # Layout raiz com Toaster
    ├── +page.svelte      # Landing page
    ├── login/            # Rota pública
    ├── register/         # Rota pública
    ├── dashboard/        # Rotas do colaborador
    │   └── +layout.svelte  # Guard de autenticação
    └── admin/            # Rotas do administrador
        └── +layout.svelte  # Guard de autenticação + role admin
```

### Naming

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Arquivo Svelte | kebab-case | `+page.svelte` |
| Variável | camelCase | `todayRecords` |
| Store | camelCase | `authStore` |
| Tipo/Interface | PascalCase | `TimeRecord` |
| Função utilitária | camelCase | `formatDate()` |

### Componentes

- Usar `<script lang="ts">` em todos os componentes
- Estado local com `let` (reativo por padrão no Svelte)
- Estado global com Svelte stores (`$lib/stores/`)
- Formatação de datas sempre com `pt-BR` locale
- Toast notifications com `svelte-sonner`
- Loading states com spinner animado
- Empty states com ícone + mensagem

### API Client

- Classe `ApiClient` centralizada em `$lib/api/index.ts`
- Método `request<T>()` genérico com tipagem
- Interceptação automática do token JWT
- Tratamento de erros centralizado em `handleResponse()`

### CSS / Tailwind

- Utility-first com Tailwind
- Componentes reutilizáveis em `@layer components` no `app.css`
- Classes padrão: `.btn`, `.btn-primary`, `.btn-secondary`, `.input`, `.card`, `.badge`
- Mobile-first (breakpoints: `sm:`, `md:`, `lg:`)
- Cores primárias customizadas via `tailwind.config.js`

## Variáveis de Ambiente

| Variável | Descrição | Default |
|----------|-----------|---------|
| `DATABASE_URL` | Connection string PostgreSQL | — |
| `JWT_SECRET` | Chave secreta do access token | — |
| `JWT_REFRESH_SECRET` | Chave secreta do refresh token | — |
| `JWT_EXPIRES_IN` | Expiração do access token | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Expiração do refresh token | `7d` |
| `CORS_ORIGINS` | Origens permitidas (CSV) | `http://localhost:5173` |
| `QRCODE_EXPIRATION_MINUTES` | Expiração padrão do QR code | `10` |
| `PUBLIC_API_URL` | URL da API (frontend) | `http://localhost:3000` |

**Regras:**
- Nunca commitar `.env` com secrets reais
- Usar `.env.example` como referência
- Em produção: usar secrets do CI/CD ou vault
- `JWT_SECRET` deve ter pelo menos 32 caracteres em produção

## Segurança

- Senhas hashadas com `bcrypt` (salt rounds: 10)
- JWT access token: 15 min de vida
- Refresh token: 7 dias, armazenado no banco, revogável
- Guards globais: `JwtAuthGuard` + `RolesGuard`
- CORS restrito por variável de ambiente
- Validação de entrada com `class-validator` + `whitelist: true` + `forbidNonWhitelisted: true`
- Isolamento de dados por `companyId` em toda query

## Testes

### Backend (Jest)

```bash
cd backend
npm test              # Watch mode
npm run test:cov      # Coverage report
```

- Testes unitários: `*.spec.ts` ao lado do service
- Mock do Prisma com `jest.fn()`
- Mock do JwtService para testes de auth

### Frontend (Vitest)

```bash
cd frontend
npm run test:run      # Single run
npm test              # Watch mode
```

- Testes unitários em `*.test.ts` ao lado do módulo
- Foco em utilitários e lógica pura
- Ambiente: `node` (sem DOM por padrão)

## Docker

- **Dev:** `docker compose up` com bind mounts e hot-reload
- **Prod:** Multi-stage builds, imagens mínimas (~150MB)
- **Healthchecks:** PostgreSQL (`pg_isready`), Backend (`/api/health`), Frontend (HTTP)
- **Network:** Rede bridge isolada `controle_ponto_network`
