# ⏰ Controle de Ponto

> Sistema completo de controle de ponto (relógio de ponto) para empresas — multiempresa, moderno, seguro e pronto para evoluir.

[![CI](https://github.com/angelofonseca/controle-de-ponto/actions/workflows/ci.yml/badge.svg)](https://github.com/angelofonseca/controle-de-ponto/actions/workflows/ci.yml)
[![CodeQL](https://github.com/angelofonseca/controle-de-ponto/actions/workflows/codeql.yml/badge.svg)](https://github.com/angelofonseca/controle-de-ponto/actions/workflows/codeql.yml)
[![Docker Publish](https://github.com/angelofonseca/controle-de-ponto/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/angelofonseca/controle-de-ponto/actions/workflows/docker-publish.yml)

---

## 📖 Sobre

O **Controle de Ponto** é um sistema web responsivo (e futuro mobile) para gestão de jornada de trabalho. Permite que empresas registrem, visualizem e analisem os pontos de seus colaboradores — com suporte a registro manual e via QR code.

### Funcionalidades do MVP

- 🏢 Cadastro de empresa e administrador
- 👥 Gestão de múltiplos colaboradores
- 🔐 Autenticação segura com JWT + Refresh Token
- ⏰ Registro manual de ponto (entrada, intervalo, saída)
- 📷 Registro via QR Code
- 📊 Dashboard administrativo com visão geral do dia
- 📋 Histórico individual de registros
- ⚠️ Detecção de atrasos e faltas
- 📈 Relatórios por período e colaborador
- 📚 Documentação interativa da API (Swagger)

---

## 🏗️ Arquitetura

### Visão geral

```
┌────────────────────────────────────────────────────────────┐
│                       CLIENTS                               │
│   Browser (SvelteKit)   │   Futuro: Mobile (Capacitor)     │
└──────────────┬──────────┴──────────────┬───────────────────┘
               │  HTTPS / REST           │
┌──────────────▼─────────────────────────▼───────────────────┐
│                   NestJS API (Monolito Modular)             │
│                                                             │
│  Auth │ Companies │ Users │ Employees │ WorkSchedules      │
│  TimeRecords │ Attendance │ QRCode │ Health                │
│                                                             │
│  Guards: JWT Auth → Roles → Company Isolation               │
│  Pipes: Validation │ Swagger: OpenAPI 3.0                  │
└──────────────┬──────────────────────────────────────────────┘
               │  Prisma ORM
┌──────────────▼──────────────────────────────────────────────┐
│                   PostgreSQL 16                              │
│  companies │ users │ time_records │ attendance_days │ ...    │
└─────────────────────────────────────────────────────────────┘
```

### Decisões arquiteturais

| Decisão | Justificativa |
|---------|---------------|
| **Monolito modular** | Complexidade adequada para MVP. Cada módulo NestJS é um bounded context que pode ser extraído para microserviço se necessário. |
| **Multitenancy por filtro** | Isolamento por `companyId` em toda query. Simples, eficiente e suficiente para MVP. Migração para schema-per-tenant é possível futuramente. |
| **JWT stateless + refresh token no banco** | Access token curto (15min) para escalabilidade. Refresh token persistido permite revogação e auditoria. |
| **Frontend SPA com SSR** | SvelteKit com Node adapter. Responsivo web-first, pronto para empacotamento mobile via Capacitor. |
| **RecordMethod como enum** | Extensível por design. Adicionar `GEOLOCATION`, `FACIAL`, `BIOMETRIC` é adicionar um valor ao enum + handler. |

### Estrutura de pastas

```
controle-de-ponto/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma           # Modelo de dados
│   │   ├── seed.ts                 # Dados de teste
│   │   └── migrations/
│   └── src/
│       ├── main.ts                 # Bootstrap + Swagger
│       ├── app.module.ts           # Root module
│       ├── auth/                   # Autenticação JWT
│       ├── companies/              # Gestão de empresas
│       ├── users/                  # Gestão de usuários
│       ├── employees/              # Perfis de colaboradores
│       ├── work-schedules/         # Jornadas de trabalho
│       ├── time-records/           # Registros de ponto
│       ├── attendance/             # Frequência e dashboard
│       ├── qrcode/                 # Sessões QR code
│       ├── common/                 # Guards, decorators
│       ├── health/                 # Health check
│       └── prisma/                 # Serviço do Prisma
├── frontend/
│   └── src/
│       ├── routes/
│       │   ├── login/              # Tela de login
│       │   ├── register/           # Cadastro empresa + admin
│       │   ├── dashboard/          # Dashboard do colaborador
│       │   └── admin/              # Painel administrativo
│       └── lib/
│           ├── api/                # Cliente HTTP tipado
│           ├── stores/             # Estado global (Svelte stores)
│           ├── types/              # Tipagem TypeScript
│           └── utils/              # Formatação, helpers
├── .github/workflows/              # CI, Docker Publish, CodeQL
├── docker-compose.yml
├── .env.example
├── CONVENTIONS.md                  # Convenções de código
└── README.md
```

---

## 🚀 Stack

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| **Frontend** | SvelteKit + TypeScript + Tailwind CSS | Bundle menor, reatividade nativa, SSR built-in, Node adapter para Docker, path aliases. Pronto para Capacitor. |
| **Backend** | NestJS + TypeScript | DI, módulos, guards, pipes, interceptors, Swagger integrado. Framework mais maduro do ecossistema Node para APIs corporativas. |
| **Banco de Dados** | PostgreSQL 16 | ACID, tipos ricos (date, jsonb, arrays), performance para queries analíticas, extensível (PostGIS futuro). |
| **ORM** | Prisma | Type-safe, migrations declarativas, Prisma Studio para debug. |
| **Autenticação** | JWT + Refresh Token | Stateless, escalável. Access token curto + refresh revogável. |
| **Validação** | class-validator | Decorators declarativos, integração nativa com NestJS ValidationPipe. |
| **Documentação** | Swagger / OpenAPI | Auto-gerada a partir do código, interativa para testes. |
| **Testes** | Jest (backend) + Vitest (frontend) | Ecossistema padrão para cada stack. |
| **Containerização** | Docker + Docker Compose | Ambiente reproduzível, multi-stage builds para dev e prod. |
| **CI/CD** | GitHub Actions + GHCR | Integrado ao repositório, cache nativo, GHCR sem custo. |

---

## 📦 Rodando Localmente

### Pré-requisitos

- [Node.js 20+](https://nodejs.org/)
- [Docker](https://www.docker.com/) e Docker Compose

### 1. Clone o repositório

```bash
git clone https://github.com/angelofonseca/controle-de-ponto.git
cd controle-de-ponto
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

> Edite o `.env` conforme necessário, especialmente `JWT_SECRET` e `JWT_REFRESH_SECRET` em produção.

### 3. Suba com Docker Compose

```bash
docker compose up -d
```

Isso irá iniciar:
- 🐘 PostgreSQL na porta `5432`
- 🚀 Backend (NestJS) na porta `3000`
- 🌐 Frontend (SvelteKit) na porta `5173`

### 4. Execute as migrações e seeds

```bash
# Entrar no container do backend
docker compose exec backend sh

# Dentro do container:
npx prisma migrate deploy
npx prisma db seed
```

Ou localmente (com Node.js instalado):

```bash
cd backend
npm install
npx prisma migrate dev
npm run prisma:seed
```

### 5. Acesse o sistema

| Serviço | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |
| **API (Swagger)** | http://localhost:3000/docs |
| **Health check** | http://localhost:3000/api/health |

---

## 🔐 Credenciais de Teste

Após executar o seed:

| Perfil | E-mail | Senha |
|--------|--------|-------|
| **Admin** | admin@empresademo.com | Admin@123 |
| **Colaborador** | joao.silva@empresademo.com | Employee@123 |
| **Colaborador** | maria.santos@empresademo.com | Employee@123 |
| **Colaborador** | carlos.oliveira@empresademo.com | Employee@123 |

---

## 🔌 API

### Endpoints

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/api/auth/login` | Login | ❌ |
| POST | `/api/auth/refresh` | Renovar token | ❌ |
| POST | `/api/auth/logout` | Logout | ✅ |
| POST | `/api/companies` | Criar empresa | ❌ |
| GET | `/api/companies` | Listar empresas | ✅ Admin |
| GET | `/api/companies/:id` | Buscar empresa | ✅ |
| PATCH | `/api/companies/:id` | Atualizar empresa | ✅ Admin |
| DELETE | `/api/companies/:id` | Desativar empresa | ✅ Admin |
| POST | `/api/users` | Criar usuário | ❌ |
| GET | `/api/users/me` | Meus dados | ✅ |
| GET | `/api/users/company` | Listar usuários da empresa | ✅ Admin |
| GET | `/api/users/:id` | Buscar usuário | ✅ |
| PATCH | `/api/users/:id` | Atualizar usuário | ✅ |
| DELETE | `/api/users/:id` | Desativar usuário | ✅ Admin |
| POST | `/api/employees` | Criar colaborador | ✅ Admin |
| GET | `/api/employees` | Listar colaboradores | ✅ Admin |
| GET | `/api/employees/:id` | Buscar colaborador | ✅ |
| PATCH | `/api/employees/:id` | Atualizar colaborador | ✅ Admin |
| POST | `/api/work-schedules` | Criar jornada | ✅ Admin |
| GET | `/api/work-schedules` | Listar jornadas | ✅ |
| GET | `/api/work-schedules/:id` | Buscar jornada | ✅ |
| PATCH | `/api/work-schedules/:id` | Atualizar jornada | ✅ Admin |
| DELETE | `/api/work-schedules/:id` | Remover jornada | ✅ Admin |
| POST | `/api/time-records/manual` | Registrar ponto manual | ✅ |
| POST | `/api/time-records/qrcode` | Registrar via QR code | ✅ |
| GET | `/api/time-records/me` | Meus registros | ✅ |
| GET | `/api/time-records/company` | Registros da empresa | ✅ Admin |
| GET | `/api/attendance/me` | Minha frequência | ✅ |
| GET | `/api/attendance/company` | Frequência da empresa | ✅ Admin |
| GET | `/api/attendance/dashboard` | Dashboard do dia | ✅ Admin |
| POST | `/api/attendance/absent/:userId/:date` | Marcar falta | ✅ Admin |
| POST | `/api/qrcode/session` | Criar sessão QR code | ✅ Admin |
| GET | `/api/qrcode/session/current` | QR code ativo | ✅ Admin |
| GET | `/api/qrcode/session/history` | Histórico QR codes | ✅ Admin |
| GET | `/api/qrcode/validate/:token` | Validar QR token | ❌ |
| GET | `/api/health` | Health check | ❌ |

Documentação interativa: **http://localhost:3000/docs**

### Fluxo de Autenticação

```
1. POST /api/auth/login { email, password }
   → { user, accessToken (15min), refreshToken (7d) }

2. Requisições autenticadas:
   Header: Authorization: Bearer <accessToken>

3. Token expirado? POST /api/auth/refresh { refreshToken }
   → { user, newAccessToken, newRefreshToken }
   (refresh token anterior é revogado — rotation)

4. POST /api/auth/logout { refreshToken? }
   → Revoga refresh tokens do usuário
```

---

## 🗃️ Modelo de Dados

```
Company ──1:N─── User ───1:N─── TimeRecord
                  │                  │
                  ├──1:1─── EmployeeProfile ───N:1─── WorkSchedule
                  │
                  ├──1:N─── AttendanceDay
                  │
                  └──1:N─── RefreshToken

Company ──1:N─── WorkSchedule
Company ──1:N─── QrCodeSession ───1:N─── TimeRecord
```

### Entidades

| Entidade | Descrição |
|----------|-----------|
| **Company** | Empresa cadastrada. Raiz do isolamento multiempresa. |
| **User** | Usuário do sistema (admin ou colaborador). Sempre vinculado a uma empresa. |
| **RefreshToken** | Token de refresh persistido para revogação e rotation. |
| **EmployeeProfile** | Dados profissionais do colaborador (matrícula, cargo, departamento, jornada). |
| **WorkSchedule** | Jornada de trabalho com horários, dias úteis e tolerância de atraso. |
| **TimeRecord** | Registro individual de ponto com tipo, método e timestamp. |
| **AttendanceDay** | Resumo diário de frequência: horas trabalhadas, atraso, status. |
| **QrCodeSession** | Sessão de QR code gerada pelo admin, com expiração e tipo permitido. |

### Enums

| Enum | Valores |
|------|---------|
| **Role** | `COMPANY_ADMIN`, `EMPLOYEE` |
| **TimeRecordType** | `CLOCK_IN`, `BREAK_START`, `BREAK_END`, `CLOCK_OUT` |
| **RecordMethod** | `MANUAL`, `QR_CODE` |
| **AttendanceStatus** | `ON_TIME`, `LATE`, `ABSENT`, `IN_PROGRESS`, `COMPLETED`, `INCONSISTENT` |

### Fluxo de registro de ponto

```
CLOCK_IN → BREAK_START → BREAK_END → CLOCK_OUT
```

Cada tipo só é aceito se o anterior na sequência já foi registrado no dia.

---

## 🧮 Regras de Negócio

### Registro de Ponto

1. **Sequência obrigatória:** `CLOCK_IN → BREAK_START → BREAK_END → CLOCK_OUT`. Qualquer violação retorna erro 400.
2. **Primeiro registro do dia deve ser `CLOCK_IN`.**
3. **Após `CLOCK_OUT`, dia encerrado.** Nenhum novo registro aceito.
4. **Cada registro armazena:** tipo, método (MANUAL/QR_CODE), timestamp completo, observações opcionais.

### Cálculo de Horas

```
Horas trabalhadas = (CLOCK_OUT - CLOCK_IN) - (BREAK_END - BREAK_START)
```

- Calculado em minutos, armazenado em `AttendanceDay.totalMinutes`.
- `expectedMinutes` calculado a partir de `WorkSchedule.startTime / endTime / breakDuration`.

### Atraso

```
Se (CLOCK_IN.recordedAt - WorkSchedule.startTime) > WorkSchedule.toleranceMinutes:
  status = LATE
  lateMinutes = diferença em minutos
```

### Falta

- Admin marca manualmente via `POST /api/attendance/absent/:userId/:date`.
- Sets `AttendanceDay.status = ABSENT, totalMinutes = 0`.
- Futuramente: job automático no final do dia para marcar quem não registrou.

### QR Code

1. Admin gera sessão com tipo permitido e expiração (1-60 min).
2. Sistema gera QR code (DataURL) contendo `{ token, type, expiresAt }`.
3. Colaborador escaneia (ou insere token manualmente).
4. Sistema valida: existência, empresa, expiração, uso.
5. Cria `TimeRecord` com `method = QR_CODE` e `qrCodeSessionId`.

### Isolamento Multiempresa

- Todo user tem `companyId`.
- Todo controller filtra por `companyId` do JWT.
- Admin: vê dados de sua empresa.
- Colaborador: vê apenas seus próprios dados.
- `RolesGuard` + verificação de `companyId` no service.

---

## 🛠️ Desenvolvimento

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run start:dev          # Hot reload na porta 3000
npm test                   # Testes unitários
npm run prisma:studio      # Interface visual do banco
```

### Frontend

```bash
cd frontend
npm install
npm run dev                # Dev server na porta 5173
npm run test:run           # Testes unitários
npm run check              # Svelte type checking
npm run build              # Build de produção
```

---

## 🐳 Docker

### Estratégia

- **Desenvolvimento:** Multi-stage build, stage `development` com bind mounts e hot-reload.
- **Produção:** Stage `production` com imagem mínima (~150MB), healthchecks.

### Imagens no GHCR

```bash
docker pull ghcr.io/angelofonseca/controle-de-ponto/backend:latest
docker pull ghcr.io/angelofonseca/controle-de-ponto/frontend:latest
```

### Build manual

```bash
docker build -t controle-ponto-backend ./backend
docker build -t controle-ponto-frontend ./frontend
```

### Separação dev/prod

| Aspecto | Desenvolvimento | Produção |
|---------|-----------------|----------|
| **Stage** | `development` | `production` |
| **Volumes** | Bind mount `./backend:/app` | Apenas código compilado |
| **Hot reload** | `npm run start:dev` | `node dist/main` |
| **Variáveis** | `.env` local | Secrets do CI/CD |
| **JWT_SECRET** | String de dev | Secret forte (32+ chars) |
| **CORS** | `localhost:*` | Domínios específicos |
| **NODE_ENV** | `development` | `production` |

---

## ⚙️ GitHub Actions

| Workflow | Trigger | O que faz |
|----------|---------|-----------|
| **CI** | Push/PR em main e develop | Lint, svelte-check, testes, build de backend e frontend |
| **Docker Publish** | Push em main e tags `v*.*.*` | Build e publicação das imagens no GHCR |
| **CodeQL** | Push/PR + semanal (segunda 3h) | Análise de segurança do código TypeScript |

### Workflows futuros (pós-MVP)

| Workflow | Quando adicionar | O que faz |
|----------|------------------|-----------|
| **Dependabot** | Sprint 2 | Atualização automática de dependências |
| **Release Drafter** | Primeira release | Changelog automático baseado em PRs |
| **Deploy Staging** | Quando tiver ambiente | Deploy automático para staging |
| **E2E Tests** | Sprint 3 | Testes end-to-end com Playwright |
| **Lighthouse CI** | Sprint 3 | Performance audit do frontend |

---

## 🔒 Segurança

- Senhas armazenadas com `bcrypt` (salt rounds: 10)
- JWT com expiração curta (15 min) + Refresh Token (7 dias)
- Refresh token rotation: novo token a cada refresh, antigo revogado
- Guards globais: `JwtAuthGuard` + `RolesGuard`
- CORS restrito por variável de ambiente
- Validação de entrada: `whitelist: true`, `forbidNonWhitelisted: true`
- Isolamento de dados por empresa em toda query
- `@Public()` decorator para endpoints sem autenticação
- CodeQL para análise de segurança automatizada

---

## 🗺️ Roadmap por Fases

### Fase 1 — MVP (Atual) ✅

- [x] Cadastro de empresa e admin
- [x] Cadastro de colaboradores
- [x] Login com JWT + refresh token
- [x] Autorização por perfil (admin/colaborador)
- [x] Registro manual de ponto (sequência validada)
- [x] Registro via QR code
- [x] Dashboard do admin (KPIs diários)
- [x] Dashboard do colaborador (status do dia)
- [x] Histórico de registros
- [x] Relatórios com filtros (data, colaborador)
- [x] Detecção de atrasos
- [x] Marcação de faltas
- [x] Swagger/OpenAPI
- [x] Docker + Docker Compose
- [x] CI (lint, testes, build)
- [x] Publicação GHCR
- [x] CodeQL

### Fase 2 — Refinamento (2-3 semanas)

- [ ] Testes unitários abrangentes (>70% coverage backend)
- [ ] Testes E2E com Playwright
- [ ] Validação de CNPJ
- [ ] Paginação nos endpoints de listagem
- [ ] Busca/filtro avançado de colaboradores
- [ ] Edição de perfil do próprio usuário
- [ ] Alterar senha
- [ ] Job automático de marcação de faltas
- [ ] Notificação de QR code prestes a expirar
- [ ] UI: Skeleton loading, animações de transição
- [ ] Dependabot

### Fase 3 — Expansão (1-2 meses)

- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Fechamento mensal (resumo para RH)
- [ ] Justificativa de atraso/falta (com aprovação do admin)
- [ ] Histórico de alterações (audit log)
- [ ] Notificações in-app
- [ ] Múltiplas jornadas por colaborador
- [ ] Hora extra (cálculo e aprovação)
- [ ] Banco de horas

### Fase 4 — Mobile e Integrações (2-3 meses)

- [ ] Empacotamento mobile com Capacitor (iOS/Android)
- [ ] Câmera nativa para QR code (plugin Capacitor)
- [ ] Geolocalização no registro de ponto
- [ ] Selfie no registro (prova visual)
- [ ] Push notifications (OneSignal/FCM)
- [ ] Multi-idioma (i18n)

### Fase 5 — Enterprise (3-6 meses)

- [ ] Reconhecimento facial
- [ ] Integração com folha de pagamento
- [ ] SSO / SAML / OAuth2 corporativo
- [ ] Multi-filial
- [ ] Relatórios avançados com gráficos
- [ ] API pública para integrações de terceiros
- [ ] SLA monitoring e observabilidade

---

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch (`git checkout -b feature/minha-feature`)
3. Commit suas mudanças (Conventional Commits: `feat: ...`, `fix: ...`)
4. Push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

Veja [CONVENTIONS.md](CONVENTIONS.md) para padrões de código e organização.

---

## 📄 Licença

MIT © [Controle de Ponto](https://github.com/angelofonseca/controle-de-ponto)