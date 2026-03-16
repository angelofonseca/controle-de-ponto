# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Controle de Ponto** is a multi-tenant time tracking system. Companies register and manage employees who clock in/out manually or via QR code. The backend is a NestJS modular monolith, the frontend is SvelteKit with SSR, and the database is PostgreSQL accessed via Prisma.

## Development Commands

### Running with Docker (recommended)
```bash
docker compose up -d        # Start all services (postgres, backend, frontend)
docker compose down         # Stop all services
docker compose logs backend # View backend logs
```

### Backend (from `backend/`)
```bash
npm run start:dev           # Hot-reload dev server
npm run lint                # ESLint with auto-fix
npm run format              # Prettier formatting
npm test                    # Jest watch mode
npm run test:cov            # Coverage report
npm run test:e2e            # End-to-end tests
npm run prisma:migrate      # Interactive migrations
npm run prisma:migrate:prod # Deploy migrations (production)
npm run prisma:seed         # Seed database
npm run prisma:studio       # Visual DB explorer
npm run prisma:generate     # Regenerate Prisma client after schema changes
```

### Frontend (from `frontend/`)
```bash
npm run dev                 # Vite dev server on port 5173
npm run check               # Svelte type checking
npm run lint                # Prettier + ESLint check
npm run format              # Prettier + ESLint fix
npm run test:run            # Single Vitest run
npm test                    # Vitest watch mode
npm run test:coverage       # Coverage report
```

### Running a single test
```bash
# Backend (from backend/)
npx jest src/auth/auth.service.spec.ts

# Frontend (from frontend/)
npx vitest run src/lib/utils/someUtil.test.ts
```

## Architecture

### Component Layout
```
Browser (SvelteKit SSR)
    ↓ REST API
NestJS Backend (port 3000)
    ↓ Prisma ORM
PostgreSQL 16
```

### Backend Module Structure (`backend/src/`)
| Module | Purpose |
|--------|---------|
| `auth/` | Login, register, refresh tokens, logout |
| `companies/` | Company management |
| `users/` | User accounts (admin or employee) |
| `employees/` | Employee professional profiles |
| `work-schedules/` | Company work hours and tolerance |
| `time-records/` | Clock in/out events (manual or QR code) |
| `attendance/` | Daily summaries and admin dashboard KPIs |
| `qrcode/` | QR code session management |
| `common/` | Shared guards, decorators (`@Public()`, `@Roles()`, `@CurrentUser()`) |
| `prisma/` | Prisma service wrapper |

### Multitenancy
Every service filters all queries by `companyId` from the JWT payload. Company data isolation is enforced at the application layer—there is no DB-level row security. The JWT payload shape is `{ sub, email, role, companyId }`.

### Authentication Flow
- `POST /api/auth/login` → returns `accessToken` (15 min) + `refreshToken` (7 days)
- Access token sent as `Authorization: Bearer <token>` header
- Refresh tokens are persisted in DB and rotated on every refresh (old one revoked)
- `@Public()` decorator bypasses `JwtAuthGuard` globally applied to all routes
- `@Roles(Role.COMPANY_ADMIN)` enforces role via `RolesGuard`

### Frontend Structure (`frontend/src/`)
- `lib/api/index.ts` — `ApiClient` class: injects JWT, handles 401 with token refresh
- `lib/stores/` — Svelte writable stores for auth state (persisted in localStorage)
- `lib/types/` — TypeScript interfaces mirroring backend DTOs
- `routes/dashboard/+layout.svelte` — Auth guard for `EMPLOYEE` role
- `routes/admin/+layout.svelte` — Auth guard for `COMPANY_ADMIN` role
- `app.css` — Global Tailwind + custom classes: `.btn`, `.input`, `.card`, `.badge`

### Database Key Relationships
```
Company → User (1:N)
User → RefreshToken (1:N)
User → EmployeeProfile (1:1)
User → TimeRecord (1:N)
User → AttendanceDay (1:N)
Company → WorkSchedule (1:N)
WorkSchedule → EmployeeProfile (1:N)
Company → QrCodeSession (1:N)
QrCodeSession → TimeRecord (1:N)
```

Key enums: `Role` (COMPANY_ADMIN, EMPLOYEE), `TimeRecordType` (CLOCK_IN, BREAK_START, BREAK_END, CLOCK_OUT), `RecordMethod` (MANUAL, QR_CODE), `AttendanceStatus` (ON_TIME, LATE, ABSENT, IN_PROGRESS, COMPLETED, INCONSISTENT).

Time records must follow the sequence: CLOCK_IN → BREAK_START → BREAK_END → CLOCK_OUT (enforced in service layer).

## Conventions

### Commit Messages (Conventional Commits)
```
feat(scope): description
fix(scope): description
```
Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `style`, `perf`, `ci`

### Naming
- **Files:** kebab-case (`time-records.service.ts`)
- **Classes/DTOs:** PascalCase (`CreateManualTimeRecordDto`)
- **DB tables/columns:** snake_case
- Update DTOs use `PartialType(CreateDto)` from `@nestjs/swagger`

### Validation
- Global validation pipe: `whitelist: true, forbidNonWhitelisted: true`
- All DTOs use `class-validator` decorators
- All endpoints decorated with `@ApiTags`, `@ApiOperation`, `@ApiBearerAuth` for Swagger (available at `/api/docs`)

### Security
- Passwords hashed with bcrypt (10 salt rounds)
- CORS restricted via `CORS_ORIGINS` env var (comma-separated)
- `active: Boolean` field on users for soft deletes (never hard delete)

## Environment Variables

Copy `.env.example` to `.env`. Key variables:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — signing keys for tokens
- `CORS_ORIGINS` — comma-separated allowed origins
- `PUBLIC_API_URL` — frontend's backend URL
- `QRCODE_EXPIRATION_MINUTES` — QR session validity (default: 10)
