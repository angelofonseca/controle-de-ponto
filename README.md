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

```
controle-de-ponto/
├── backend/                    # API NestJS + Prisma + PostgreSQL
│   ├── prisma/
│   │   ├── schema.prisma       # Modelo de dados
│   │   └── seed.ts             # Dados de teste
│   └── src/
│       ├── auth/               # Autenticação JWT
│       ├── companies/          # Gestão de empresas
│       ├── users/              # Gestão de usuários
│       ├── employees/          # Perfis de colaboradores
│       ├── work-schedules/     # Jornadas de trabalho
│       ├── time-records/       # Registros de ponto
│       ├── attendance/         # Frequência e dashboard
│       ├── qrcode/             # Sessões QR code
│       ├── common/             # Guards, decorators, utils
│       └── prisma/             # Serviço do Prisma
├── frontend/                   # SvelteKit + TypeScript + Tailwind
│   └── src/
│       ├── routes/
│       │   ├── login/          # Tela de login
│       │   ├── register/       # Cadastro empresa/admin
│       │   ├── dashboard/      # Dashboard do colaborador
│       │   └── admin/          # Painel administrativo
│       └── lib/
│           ├── api/            # Cliente HTTP
│           ├── stores/         # Estado global (Svelte stores)
│           ├── types/          # Tipagem TypeScript
│           └── utils/          # Utilitários
├── .github/workflows/          # GitHub Actions
├── docker-compose.yml          # Ambiente local completo
├── .env.example                # Variáveis de ambiente de exemplo
└── README.md
```

---

## 🚀 Stack

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | SvelteKit + TypeScript + Tailwind CSS |
| **Backend** | NestJS + TypeScript |
| **Banco de Dados** | PostgreSQL 16 |
| **ORM** | Prisma |
| **Autenticação** | JWT + Refresh Token |
| **Validação** | class-validator |
| **Documentação** | Swagger / OpenAPI |
| **Testes (Backend)** | Jest |
| **Testes (Frontend)** | Vitest |
| **Containerização** | Docker + Docker Compose |
| **CI/CD** | GitHub Actions |
| **Registry** | GitHub Container Registry (GHCR) |

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

> Edite o `.env` com suas configurações, especialmente `JWT_SECRET` e `JWT_REFRESH_SECRET`.

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

Após executar o seed, use estas credenciais:

| Perfil | E-mail | Senha |
|--------|--------|-------|
| **Admin** | admin@empresademo.com | Admin@123 |
| **Colaborador** | joao.silva@empresademo.com | Employee@123 |
| **Colaborador** | maria.santos@empresademo.com | Employee@123 |
| **Colaborador** | carlos.oliveira@empresademo.com | Employee@123 |

---

## 🛠️ Desenvolvimento

### Backend

```bash
cd backend

# Instalar dependências
npm install

# Gerar Prisma client
npx prisma generate

# Criar/atualizar banco de dados (dev)
npx prisma migrate dev

# Seed com dados de teste
npm run prisma:seed

# Iniciar em modo dev (hot reload)
npm run start:dev

# Rodar testes
npm test

# Build para produção
npm run build
```

### Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar em modo dev
npm run dev

# Rodar testes
npm run test:run

# Build para produção
npm run build
npm run preview
```

### Prisma Studio (interface visual do banco)

```bash
cd backend
npm run prisma:studio
# Acesse: http://localhost:5555
```

---

## 🔌 API

### Endpoints Principais

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/api/auth/login` | Login | ❌ |
| POST | `/api/auth/refresh` | Renovar token | ❌ |
| POST | `/api/auth/logout` | Logout | ✅ |
| POST | `/api/companies` | Criar empresa | ❌ |
| POST | `/api/users` | Criar usuário | ❌ |
| GET | `/api/users/me` | Meus dados | ✅ |
| GET | `/api/employees` | Listar colaboradores | ✅ Admin |
| POST | `/api/employees` | Criar colaborador | ✅ Admin |
| POST | `/api/time-records/manual` | Registrar ponto manual | ✅ |
| POST | `/api/time-records/qrcode` | Registrar via QR code | ✅ |
| GET | `/api/time-records/me` | Meus registros | ✅ |
| GET | `/api/time-records/company` | Registros da empresa | ✅ Admin |
| GET | `/api/attendance/me` | Minha frequência | ✅ |
| GET | `/api/attendance/company` | Frequência da empresa | ✅ Admin |
| GET | `/api/attendance/dashboard` | Dashboard do dia | ✅ Admin |
| POST | `/api/qrcode/session` | Criar sessão QR code | ✅ Admin |
| GET | `/api/qrcode/session/current` | QR code ativo | ✅ Admin |

Documentação completa: **http://localhost:3000/docs**

---

## 🗃️ Modelo de Dados

```
Company ──< User ──< TimeRecord
             │
             └──< EmployeeProfile >── WorkSchedule
             │
             └──< AttendanceDay

Company ──< QrCodeSession ──< TimeRecord
```

### Enums

**Role:** `COMPANY_ADMIN` | `EMPLOYEE`

**TimeRecordType:** `CLOCK_IN` | `BREAK_START` | `BREAK_END` | `CLOCK_OUT`

**RecordMethod:** `MANUAL` | `QR_CODE`

**AttendanceStatus:** `ON_TIME` | `LATE` | `ABSENT` | `IN_PROGRESS` | `COMPLETED` | `INCONSISTENT`

### Fluxo de registro

```
CLOCK_IN → BREAK_START → BREAK_END → CLOCK_OUT
```

---

## 🐳 Docker

### Imagens disponíveis no GHCR

```bash
# Backend
docker pull ghcr.io/angelofonseca/controle-de-ponto/backend:latest

# Frontend
docker pull ghcr.io/angelofonseca/controle-de-ponto/frontend:latest
```

### Build manual

```bash
# Backend
docker build -t controle-ponto-backend ./backend

# Frontend
docker build -t controle-ponto-frontend ./frontend
```

---

## ⚙️ GitHub Actions

| Workflow | Trigger | O que faz |
|----------|---------|-----------|
| **CI** | Push/PR em main e develop | Lint, testes e build de backend e frontend |
| **Docker Publish** | Push em main e tags `v*.*.*` | Build e publicação das imagens no GHCR |
| **CodeQL** | Push/PR + semanal | Análise de segurança do código |

---

## 🔒 Segurança

- Senhas armazenadas com `bcrypt` (salt rounds: 10)
- JWT com expiração curta (15 min) + Refresh Token (7 dias)
- Refresh tokens armazenados no banco com possibilidade de revogação
- Guards de autenticação e autorização por perfil
- CORS configurável por variável de ambiente
- Validação de entrada em todos os endpoints
- Isolamento de dados por empresa

---

## 🗺️ Roadmap

- [ ] Geolocalização no registro de ponto
- [ ] Selfie / reconhecimento facial
- [ ] Justificativa de atraso/falta
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Integração com folha de pagamento
- [ ] Notificações push
- [ ] App mobile (Capacitor.js)
- [ ] Multi-idioma

---

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch (`git checkout -b feature/minha-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

---

## 📄 Licença

MIT © [Controle de Ponto](https://github.com/angelofonseca/controle-de-ponto)