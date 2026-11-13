# CampusQuiz

Institutional examination platform featuring multi-tenant isolation, database-level integrity enforcement, and real-time session monitoring.

[![Python Version](https://img.shields.io/badge/python-3.10%20%7C%203.11%20%7C%203.12-blue)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-3178C6)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4.5-646CFF)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-4169E1)](https://www.postgresql.org/)
[![Test Suite](https://img.shields.io/badge/Tests-264%20backend%20%7C%20146%20frontend-brightgreen)](tests/)

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Screenshots and Demos](#screenshots-and-demos)
- [Tech Stack](#tech-stack)
- [Architecture and Security Model](#architecture-and-security-model)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation and Setup](#installation-and-setup)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)
- [Contact and Acknowledgements](#contact-and-acknowledgements)

---

## Overview

CampusQuiz (internally designated QuizRizz) is an institutional assessment platform built for colleges and universities. Traditional learning management systems often couple business logic, scoring formulas, and session timers in client-side code or unhardened application endpoints, leaving them vulnerable to race conditions, credential tampering, and cross-tenant leakage.

CampusQuiz addresses these vulnerabilities through an architecture anchored directly in the database:
- **Zero-leak multi-tenancy**: Institutional data boundaries are physically enforced at the PostgreSQL schema layer via composite foreign keys `(college_id, ...)` across all relational tables.
- **Definer security model**: Runtime application servers run under a restricted database role (`campusquiz_app`) with direct data-modification privileges (`INSERT`, `UPDATE`, `DELETE`) permanently revoked on critical tables. All attempt creation, response autosaving, session transitions, and score calculations execute via hardened PostgreSQL `SECURITY DEFINER` stored procedures.
- **Cryptographic HMAC execution tickets**: Stored procedures verify cryptographically signed tokens containing user identity, token version, role, and expiry epoch to prevent session spoofing across connection pools.
- **High-concurrency live monitoring**: Real-time instructor oversight runs over WebSockets using single-use ticket exchange and first-frame authentication, avoiding credential exposure in reverse-proxy access logs.

The system serves three primary institutional personas:
1. **Administrators**: Configure college academic structures (academic years, departments, branches, classes, subjects), enroll students, and assign faculty.
2. **Faculty**: Author questions (single-choice MCQ, true/false, multiple-select), assemble and publish structured quizzes, schedule exam sessions, and track student progress live.
3. **Students**: Join sessions via secure access codes, complete tests through a monotonic autosave interface with server-authoritative countdowns, and review detailed score breakdowns once released.

---

## Key Features

- **Multi-Tenant College Isolation**: Strict physical data separation ensuring users and administrators cannot query or modify entities outside their assigned institution.
- **Database-Enforced Business Rules**: Atomic quiz publishing, attempt lifecycle controls, and scoring logic implemented entirely inside transactional stored procedures.
- **Proportional Multiple-Select Scoring**: Partial credit algorithms compute proportional weights for correct selections with penalty subtractions for incorrect choices, preserving negative marks without arbitrary zero-clamping.
- **Version-Gated Atomic Autosave**: Debounced student answer sync with monotonic client version tracking to prevent out-of-order writes and stale overwrite race conditions.
- **Server-Authoritative Session Lifecycle**: Countdown timers bound to server-calculated deadlines; client clock tampering cannot prolong exam attempts.
- **Automated Attempt Expiration Sweeper**: Background worker that continuously detects expired attempts and automatically scores and locks them.
- **Single-Use WebSocket Tickets**: Ephemeral, single-use tickets for WebSocket handshakes with first-frame payload authentication, eliminating token leakage in URLs and logs.
- **Confidential Pre-Release Result Masking**: Zero-leak student results policy withholding raw marks, correct options, and teacher explanations until faculty formally releases session scores.
- **Role-Based Dynamic Routing**: Unified authentication flow with client-side role switching for users holding multiple academic designations (Admin, Faculty, Student).
- **In-Memory Token Retention**: Zero storage of access and refresh tokens in `localStorage` or `sessionStorage` to mitigate Cross-Site Scripting (XSS) attack vectors.

---

## Screenshots and Demos

### User Authentication
<!-- SCREENSHOT: Replace the path below with your image. Suggested: Capture the login interface at /login with credentials form -->
![User Login Interface](docs/Screenshots/01-auth-login.png)
*Caption: Authentication portal supporting email and password login with Argon2 credential verification.*

### Institutional Administration Overview
<!-- SCREENSHOT: Replace the path below with your image. Suggested: Capture the /admin dashboard showing statistics and navigation tabs -->
![Admin Dashboard Overview](docs/Screenshots/03-admin-dashboard.png)
*Caption: Administrator control center displaying college statistics, academic structures, and membership directories.*

### Faculty Quiz Builder and Publishing
<!-- SCREENSHOT: Replace the path below with your image. Suggested: Capture /faculty/quizzes/build showing question ordering and marks -->
![Quiz Assembly and Publishing](docs/Screenshots/06-faculty-quiz-builder.png)
*Caption: Interactive quiz builder with question reordering, score weight overrides, and atomic publishing.*

### Student Session Lobby
<!-- SCREENSHOT: Replace the path below with your image. Suggested: Capture /student/sessions/:id/lobby waiting for teacher trigger -->
![Student Session Lobby](docs/Screenshots/09-student-session-lobby.png)
*Caption: Pre-exam waiting room synchronizing session start state via real-time WebSocket connection.*


---

## Tech Stack

### Backend
- **Framework**: [FastAPI 0.111.0+](https://fastapi.tiangolo.com/) with [Pydantic v2](https://docs.pydantic.dev/) (validation, serialization, settings management)
- **ASGI Server**: [Uvicorn 0.30.0+](https://www.uvicorn.org/)
- **Database Engine**: [SQLAlchemy 2.0.30+](https://www.sqlalchemy.org/) with asynchronous driver [asyncpg 0.29.0+](https://github.com/MagicStack/asyncpg)
- **Database Migration Driver**: [psycopg2-binary 2.9.9+](https://www.psycopg.org/)
- **Authentication and Security**: [Argon2-cffi 23.1.0+](https://argon2-cffi.readthedocs.io/), [PyJWT 2.8.0+](https://pyjwt.readthedocs.io/), standard library `hmac` and `hashlib` (HMAC-SHA256)
- **Real-Time Engine**: [WebSockets 12.0+](https://websockets.readthedocs.io/) with in-memory Pub/Sub connection hub

### Frontend
- **Framework**: [React 18.3.1](https://react.dev/) with [TypeScript 5.6.3](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6.4.5](https://vitejs.dev/)
- **Client Routing**: [React Router 7.18.5](https://reactrouter.com/)
- **Styling**: [Tailwind CSS 3.4.14](https://tailwindcss.com/) with PostCSS and Autoprefixer
- **Component Icons**: [Lucide React 0.460.0](https://lucide.dev/)

### Database
- **Database**: [PostgreSQL 15+](https://www.postgresql.org/) (Compatible with Neon Serverless PostgreSQL)
- **Extensions**: `pgcrypto` for UUID generation and cryptographic primitives
- **Access Model**: Two-role separation (`campusquiz_definer` for DDL/procedures, `campusquiz_app` for application runtime)

### Tooling and Testing
- **Backend Testing**: `pytest 8.x` with `pytest-asyncio`
- **Frontend Testing**: `Vitest 4.1.12` with `@testing-library/react` and `jsdom`
- **Code Quality**: TypeScript compiler (`tsc --noEmit`)

---

## Architecture and Security Model

The system follows a zero-trust, multi-layered security architecture designed to prevent unauthorized mutations, cross-tenant data leakage, and credential theft:

```
+-------------------------------------------------------------------------------+
|                             CLIENT APPLICATION                                |
|  - React 18 SPA (Cloudflare Pages)                                            |
|  - In-memory token storage (No localStorage / sessionStorage)                 |
|  - Short-lived Single-Use WebSocket Tickets (60-second validity)             |
+---------------------------------------+---------------------------------------+
                                        | HTTPS / WSS
                                        v
+-------------------------------------------------------------------------------+
|                            FASTAPI BACKEND SERVICE                            |
|  - Scoped JWT verification (Subject, College UUID, Token Version, Roles)      |
|  - Dependency-injected role enforcement (require_roles("ADMIN", "FACULTY"))   |
|  - In-memory WebSocket Session Room Hub                                       |
|  - Background Timeout Sweeper worker                                          |
|  - Direct unpooled connection using restricted 'campusquiz_app' role          |
+---------------------------------------+---------------------------------------+
                                        | PostgreSQL Wire Protocol
                                        v
+-------------------------------------------------------------------------------+
|                          POSTGRESQL DATABASE (NEON)                           |
|  +-------------------------------------------------------------------------+  |
|  | ROLE: campusquiz_app (Least Privilege)                                  |  |
|  | - SELECT on read-models; INSERT on draft entities                       |  |
|  | - REVOKED: Direct INSERT/UPDATE/DELETE on quiz_attempts & responses     |  |
|  +-------------------------------------------------------------------------+  |
|  | SECURITY DEFINER PROCEDURES (Owned by campusquiz_definer)               |  |
|  | - fn_verify_actor_context: Cryptographic HMAC validation of actor payload |  |
|  | - sp_publish_quiz: Validates marks and freezes assessment schema        |  |
|  | - sp_start_quiz_attempt: Enforces 1-attempt constraint and starts timer  |  |
|  | - sp_save_student_response: Version-checked monotonic atomic autosave     |  |
|  | - sp_finalize_attempt: Evaluates responses, computes score, locks attempt|  |
|  +-------------------------------------------------------------------------+  |
|  | MULTI-TENANT ISOLATION                                                  |  |
|  | - Physical composite foreign keys (college_id, ...) on all tables      |  |
+-------------------------------------------------------------------------------+
```

### Stored Procedure Directory

All operational state transitions execute through these PostgreSQL procedures:

| Stored Procedure | Security Access | Description |
| :--- | :--- | :--- |
| `sp_publish_quiz` | Faculty / Admin | Atomically calculates total marks, verifies question counts, and transitions quiz to published state. |
| `sp_activate_quiz_session` | Faculty / Admin | Freezes quiz content into an immutable JSON snapshot and opens the session for student entry. |
| `sp_pause_quiz_session` | Faculty / Admin | Pauses an active session, temporarily halting student response acceptance. |
| `sp_resume_quiz_session` | Faculty / Admin | Transitions a paused session back to active status. |
| `sp_complete_quiz_session` | Faculty / Admin | Closes an active or paused session, preventing further submissions. |
| `sp_start_quiz_attempt` | Student | Idempotently creates or resumes an attempt, starts the duration clock, and returns sanitized questions without correct options. |
| `sp_save_student_response` | Student | Validates option IDs, enforces version-gated monotonic autosave, and persists student selections. |
| `sp_finalize_attempt` | Student / System | Computes final question scores using proportional weights, updates attempt records, and permanently locks edits. |
| `sp_get_student_attempt_results` | Student / Faculty | Evaluates session result-release policies and returns total marks and detailed question breakdowns. |

---

## Project Structure

```text
Quiz-fixed/
├── .env.example                               # Backend environment configuration template
├── pyrefly.toml                               # Backend typing and verification configuration
├── pytest.ini                                 # Pytest configuration with pythonpath declaration
├── requirements.txt                           # Backend Python dependencies
├── app/                                       # FastAPI core application package
│   ├── main.py                                # Application factory, lifespan, CORS, and router registration
│   ├── api/                                   # API route handlers
│   │   ├── deps.py                            # Database, authentication, and role dependency providers
│   │   ├── health.py                          # Liveness (/health/live) and readiness (/health/ready) probes
│   │   └── v1/
│   │       ├── api.py                         # API v1 router aggregation
│   │       └── endpoints/                     # Domain route controllers
│   │           ├── administration.py          # Institutional administration CRUD operations
│   │           ├── auth.py                    # Login, token refresh, logout, profile, and WS ticket generation
│   │           ├── authoring.py               # Question bank and quiz composition endpoints
│   │           ├── lifecycle.py               # Session creation, status transitions, and results release
│   │           ├── student.py                 # Student session discovery, attempts, autosave, and submission
│   │           └── websockets.py              # WebSocket endpoints for monitor and student lobby
│   ├── core/                                  # Security and runtime infrastructure
│   │   ├── config.py                          # Pydantic BaseSettings loading .env with secret validation
│   │   ├── hmac_tickets.py                    # Database HMAC actor context generator
│   │   ├── security.py                        # Argon2 hashing and PyJWT token generation
│   │   ├── ws_hub.py                          # In-memory WebSocket room hub and presence manager
│   │   └── ws_tickets.py                      # Ephemeral WebSocket ticket validator and cache
│   ├── db/                                    # Database connection layer
│   │   ├── session.py                         # Async SQLAlchemy engine initialization
│   │   └── sp_caller.py                       # Helper utility for calling stored procedures
│   ├── schemas/                               # Pydantic validation schemas
│   │   ├── administration.py                  # Institution, user, and enrollment DTOs
│   │   ├── auth.py                            # Authentication request/response schemas
│   │   ├── authoring.py                       # Question and quiz definition schemas
│   │   ├── lifecycle.py                       # Quiz publishing and session management schemas
│   │   ├── student.py                         # Attempt, autosave response, and result schemas
│   │   └── websocket.py                       # WebSocket message schemas
│   ├── services/                              # Application business logic layer
│   │   ├── administration_service.py          # Administration business operations
│   │   ├── auth_service.py                    # User authentication and token lifecycle logic
│   │   ├── authoring_service.py               # Question bank authorization and assembly logic
│   │   ├── lifecycle_service.py               # Session workflow and procedure coordinator
│   │   └── student_service.py                 # Attempt coordination, autosave, and scoring services
│   └── workers/                               # Asynchronous background tasks
│       └── timeout_sweeper.py                 # Sweeper job auto-submitting expired attempts
├── database/                                  # Database migrations and tooling
│   ├── 01_schema.sql                          # Core schema tables, indexes, and constraints
│   ├── 02_procedures.sql                      # Hardened stored procedures and scoring algorithms
│   ├── 03_permissions.sql                     # Privilege hardening and campusquiz_app grants
│   ├── 04_security_hardening.sql              # Function search_path pinning and secret rotation
│   ├── 05_fix_for_share_of.sql                # Row-locking concurrency fix for attempt creation
│   ├── 06_fix_student_response_record.sql     # Autosave scalar variable assignment fix
│   ├── 07_revoke_app_student_responses_mutation.sql # Least-privilege lock on responses table
│   ├── 08_fix_multiple_select_scoring_penalty.sql   # Scoring formula precision and penalty preservation
│   ├── campusquiz_complete.sql                # Consolidated database DDL for greenfield deployments
│   ├── auth_utils.py                          # Python HMAC signature generator
│   ├── test_suite.sql                         # 35-assertion transactional SQL test suite
│   ├── test_verify_and_migrate.py             # 80-test Python unit test suite for migration engine
│   └── verify_and_migrate.py                  # CLI runner for schema migrations and health checks
├── frontend/                                  # React 18 single-page application
│   ├── .env.example                           # Frontend environment configuration template
│   ├── index.html                             # Single-page HTML entry point
│   ├── package.json                           # Node.js dependencies and script definitions
│   ├── postcss.config.js                      # PostCSS pipeline configuration
│   ├── tailwind.config.js                     # Tailwind CSS styling design tokens
│   ├── tsconfig.json                          # TypeScript project configuration
│   ├── vite.config.ts                         # Vite configuration, path aliases, proxy, and test runner
│   ├── public/
│   │   └── _redirects                         # Cloudflare Pages SPA client-side routing fallback
│   └── src/                                   # Frontend TypeScript source code
│       ├── App.tsx                            # Root application component and routing configuration
│       ├── main.tsx                           # React DOM root bootstrapping
│       ├── api/                               # HTTP and WebSocket API clients
│       │   ├── adminApi.ts                    # Administration endpoint calls and college caching
│       │   ├── authApi.ts                     # Authentication and session ticket calls
│       │   ├── client.ts                      # Centralized fetch wrapper with in-memory tokens
│       │   ├── facultyApi.ts                  # Question bank, quiz builder, and session calls
│       │   ├── sessionApi.ts                  # Live session monitoring operations
│       │   └── studentApi.ts                  # Student session discovery, attempt, and autosave calls
│       ├── components/                        # Shared and feature UI components
│       │   ├── auth/                          # ProtectedRoute and role authentication wrappers
│       │   ├── common/                        # Reusable inputs, modals, alerts, and loaders
│       │   └── layout/                        # Role-specific navigation bars, headers, and sidebars
│       ├── context/                           # React Context providers
│       │   ├── AuthContext.tsx                # Authentication state, active role, and credentials
│       │   └── ToastContext.tsx               # Application notification toast system
│       ├── hooks/                             # Custom React hooks
│       │   └── useCollege.ts                  # Cached institutional profile data hook
│       ├── pages/                             # Route view pages
│       │   ├── NotFoundPage.tsx               # 404 route fallback view
│       │   ├── admin/                         # Administrator management pages
│       │   ├── auth/                          # Login and role selection views
│       │   ├── faculty/                       # Faculty question bank, quizzes, and live monitor
│       │   └── student/                       # Student dashboard, waiting lobby, attempt, and results
│       ├── test/                              # Vitest component and integration tests
│       │   ├── admin.test.tsx                 # Administration UI view tests
│       │   ├── auth.test.tsx                  # Authentication and login flow tests
│       │   ├── client.test.ts                 # API client URL construction and refresh tests
│       │   ├── faculty.test.tsx               # Faculty dashboard and quiz authoring tests
│       │   ├── routes.test.tsx                # Role-based route protection tests
│       │   ├── session.test.tsx               # Live session monitor UI tests
│       │   ├── setup.ts                       # Vitest global environment and matchers setup
│       │   ├── student.test.tsx               # Student attempt workspace and response tests
│       │   └── websocket.test.ts              # WebSocket client connectivity tests
│       └── types/                             # TypeScript interface definitions
│           ├── admin.ts                       # Institutional schema entities
│           ├── api.ts                         # API envelope and error contracts
│           ├── auth.ts                        # User credentials, tokens, and roles
│           ├── faculty.ts                     # Questions, quizzes, and authoring models
│           ├── session.ts                     # Session lifecycle and monitor models
│           ├── student.ts                     # Attempt records, response payloads, and results
│           └── websocket.ts                   # WebSocket event frames
├── docs/                                      # Engineering specifications and audits
│   ├── ARCHITECTURE_AND_DEVELOPER_HANDOFF.md # System architecture and procedure guide
│   ├── PHASE_10A_FRONTEND_INTEGRATION_AUDIT.md # Frontend contract verification audit
│   ├── PHASE_10G_DEPLOYMENT_AND_RELEASE_READINESS.md # Deployment readiness and security audit
│   └── screenshots/                          # Repository screenshot asset directory
│       └── .gitkeep                           # Git directory preservation anchor
├── scripts/                                   # Diagnostic and maintenance automation
│   ├── bootstrap_admin.py                     # CLI script to provision the initial institutional admin
│   ├── inspect_foreign_keys.py                # Schema foreign key relationship validator
│   └── inspect_reset_data.py                  # Database state diagnostic script
└── tests/                                     # Backend Pytest test suites
    ├── test_administration.py                 # Institutional CRUD endpoint tests
    ├── test_attempt_engine.py                 # Student attempt creation and autosave tests
    ├── test_authentication.py                 # Argon2 login, JWT validation, and logout tests
    ├── test_authoring.py                      # Question bank and quiz builder tests
    ├── test_backend_foundation.py             # FastAPI foundation, CORS, and health probe tests
    ├── test_finalization_scoring.py           # Scoring formulas, penalty deductions, and locks
    ├── test_lifecycle.py                      # Quiz publishing and session state machine tests
    ├── test_student_lobby.py                  # Student waiting lobby and access code tests
    └── test_websockets.py                     # WebSocket first-frame auth and room tests
```

---

## Prerequisites

Ensure the following runtimes and tools are installed before setting up the platform:

| Runtime / Tool | Required Version | Verification Command |
| :--- | :--- | :--- |
| **Python** | `3.10.x` to `3.12.x` | `python --version` |
| **Node.js** | `20.x` or `22.x` (LTS recommended) | `node --version` |
| **npm** | `10.x+` | `npm --version` |
| **PostgreSQL** | `15+` (or Neon Serverless account) | `psql --version` |
| **Git** | `2.40+` | `git --version` |

---

## Installation and Setup

Follow these steps to set up a complete local development environment.

### 1. Clone the Repository

```bash
git clone https://github.com/pragya-shree/Quiz.git
cd Quiz
```

### 2. Configure Backend Python Environment

Create a virtual environment and install backend dependencies:

```bash
# On Linux / macOS
python -m venv .venv
source .venv/bin/activate

# On Windows (PowerShell)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install required Python packages
pip install -r requirements.txt
```

### 3. Configure Frontend Node.js Environment

Install dependencies for the frontend workspace:

```bash
cd frontend
npm install
cd ..
```

### 4. Configure Environment Variables

Create environment configuration files from the provided templates:

```bash
# Backend configuration
cp .env.example .env

# Frontend configuration
cp frontend/.env.example frontend/.env
```

Review and update the variables in `.env` and `frontend/.env` according to the [Configuration](#configuration) section.

### 5. Initialize the Database and Apply Migrations

Ensure your PostgreSQL instance is running and your `MIGRATION_DATABASE_URL` connects as a database owner:

```bash
# Check current migration status
python database/verify_and_migrate.py --status

# Apply all database migrations sequentially (01 through 08)
python database/verify_and_migrate.py --migrate
```

### 6. Bootstrap Initial Institutional Administrator

Run the interactive admin creation utility to provision the default institutional college and administrator account:

```bash
python scripts/bootstrap_admin.py
```

Prompts will ask for an administrator email and a secure password (minimum 12 characters).

---

## Configuration

### Backend Environment Variables (`.env`)

| Variable Name | Description | Example / Default Value | Required / Optional |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Direct unpooled database connection string for migration verification. | `postgresql://campusquiz_app:pass@ep-xyz.neon.tech/quizdb?sslmode=require` | Required |
| `APP_DATABASE_URL` | Direct unpooled database connection string used at runtime by the FastAPI backend under the restricted `campusquiz_app` role. | `postgresql://campusquiz_app:pass@ep-xyz.neon.tech/quizdb?sslmode=require` | Required |
| `MIGRATION_DATABASE_URL` | Privileged database owner connection string used exclusively by `database/verify_and_migrate.py` to run DDL migrations. | `postgresql://neondb_owner:pass@ep-xyz.neon.tech/quizdb?sslmode=require` | Required for migrations |
| `AUTH_HMAC_SECRET` | Cryptographic secret for signing database actor context payloads. Must be at least 32 bytes and match `app_auth_config`. | `c97f4a5... (64-character random hex string)` | Required |
| `JWT_SECRET_KEY` | Independent cryptographic secret for signing user access and refresh JWTs. Must be at least 32 bytes and distinct from `AUTH_HMAC_SECRET`. | `3e8b1d9... (64-character random hex string)` | Required |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| Validity duration of user access tokens in minutes. | `15` | Optional (Default: `15`) |
| `REFRESH_TOKEN_EXPIRE_DAYS`  | Validity duration of user refresh tokens in days. | `7` | Optional (Default: `7`) |
| `DEFAULT_COLLEGE_ID`         | UUID of the default institution used during fallback resolution. | `511a5ce7-0665-496a-b246-72bb0821de81` | Optional |
| `CORS_ORIGINS`               | Comma-separated list of allowed frontend client origins. | `http://localhost:5173,http://127.0.0.1:5173,https://campusquiz.pages.dev` | Required |

> **Security Note:** `JWT_SECRET_KEY` and `AUTH_HMAC_SECRET` must be completely independent secrets. The backend service enforces startup validation to ensure both are at least 32 bytes long and not identical.

### Frontend Environment Variables (`frontend/.env`)

| Variable Name | Description | Example / Default Value | Required / Optional |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base path or absolute URL for REST API calls. Leave as `/api/v1` for local development via Vite proxy. | `/api/v1` (Local) or `https://campusquiz-backend.onrender.com/api/v1` (Prod) | Required |
| `VITE_BACKEND_TARGET` | Target HTTP server URL used by Vite development proxy. | `http://127.0.0.1:8000` | Required for dev proxy |
| `VITE_BACKEND_WS_TARGET` | Target WebSocket server URL used by Vite development proxy. | `ws://127.0.0.1:8000` | Required for dev proxy |
| `VITE_WS_BASE_URL` | Optional explicit WebSocket base URL for production environments. When omitted, derived automatically from `VITE_API_BASE_URL`. | `wss://campusquiz-backend.onrender.com` | Optional |

---

## Usage

### Development Mode

Run the backend and frontend in separate terminal windows.

#### 1. Start the Backend API Server

```bash
# Activate virtual environment
source .venv/bin/activate  # Or .\.venv\Scripts\Activate.ps1 on Windows

# Launch FastAPI with auto-reload
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The API documentation and Swagger UI are accessible at `http://127.0.0.1:8000/docs`.

#### 2. Start the Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend application will be accessible at `http://localhost:5173`.

#### 3. Run the Background Timeout Sweeper (Optional)

In development, you can execute the background sweeper manually or run it in a continuous loop:

```bash
# Run one pass of the attempt expiration sweeper
python -m app.workers.timeout_sweeper
```

---

### Production Mode

#### 1. Start the Backend Application

Run the FastAPI application via Uvicorn with factory loading and production settings:

```bash
uvicorn app.main:create_app --factory --host 0.0.0.0 --port 8000 --workers 4
```

#### 2. Build the Frontend SPA

Build the compiled static assets for production deployment:

```bash
cd frontend
npm run build
```

The compiled bundle will be emitted to `frontend/dist/`. Serve these static files using an edge CDN (such as Cloudflare Pages) or an HTTP server configured with SPA fallback routing.

---

## API Documentation

The backend exposes an interactive OpenAPI specification at `/docs` and a raw JSON schema at `/openapi.json`.

### Health Diagnostics

#### Check Service Liveness
- **Method**: `GET`
- **Endpoint**: `/health/live`
- **Auth**: None
- **Response**: `200 OK`
  ```json
  {
    "status": "alive"
  }
  ```

#### Check Database Readiness
- **Method**: `GET`
- **Endpoint**: `/health/ready`
- **Auth**: None
- **Response**: `200 OK`
  ```json
  {
    "status": "ready"
  }
  ```

---

### Authentication (`/api/v1/auth`)

#### User Login
- **Method**: `POST`
- **Endpoint**: `/api/v1/auth/login`
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "email": "faculty@college.ac.in",
    "password": "CorrectHorseBatteryStaple123"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "expires_in": 900,
    "user": {
      "id": "e2a47249-1ef0-4820-94f4-5fca0874e508",
      "email": "faculty@college.ac.in",
      "first_name": "Alan",
      "last_name": "Turing",
      "college_id": "511a5ce7-0665-496a-b246-72bb0821de81",
      "roles": ["FACULTY"]
    }
  }
  ```

#### Refresh Access Token
- **Method**: `POST`
- **Endpoint**: `/api/v1/auth/refresh`
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  }
  ```
- **Response**: `200 OK` (Returns new token pair)

#### Revoke Tokens (Logout)
- **Method**: `POST`
- **Endpoint**: `/api/v1/auth/logout`
- **Auth**: Bearer Token
- **Request Body**:
  ```json
  {
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  }
  ```
- **Response**: `204 No Content`

#### Generate WebSocket Ticket
- **Method**: `POST`
- **Endpoint**: `/api/v1/auth/ws-ticket`
- **Auth**: Bearer Token
- **Request Body**:
  ```json
  {
    "session_id": "778e24c3-63a2-4663-8a9d-5a953a9926cb"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "ticket": "wst_c31f498da1c27...",
    "expires_in": 60
  }
  ```

---

### Student Examination (`/api/v1/student`)

#### Start Quiz Attempt
- **Method**: `POST`
- **Endpoint**: `/api/v1/student/sessions/{session_id}/start`
- **Auth**: Bearer Token (`STUDENT`)
- **Response**: `200 OK`
  ```json
  {
    "attempt_id": "b0645d9e-c852-45e0-8a1a-3e8bc803e1c4",
    "session_id": "778e24c3-63a2-4663-8a9d-5a953a9926cb",
    "quiz_title": "Data Structures Mid-Term",
    "status": "IN_PROGRESS",
    "started_at": "2026-11-13T10:00:00Z",
    "deadline": "2026-11-13T11:00:00Z",
    "questions": [
      {
        "id": "c1f72d5b-213e-4b2a-8bf8-d5861ea5521b",
        "question_text": "What is the worst-case time complexity of QuickSort?",
        "question_type": "MCQ",
        "marks": "2.000000",
        "options": [
          { "id": "99b0c74b-5776-4d1a-a5f1-3ec7d23a483e", "option_text": "O(N log N)" },
          { "id": "42f7c03d-8e45-4b08-8e8e-d9ea9d20c57c", "option_text": "O(N^2)" }
        ]
      }
    ]
  }
  ```

#### Save Student Response (Autosave)
- **Method**: `POST`
- **Endpoint**: `/api/v1/student/attempts/{attempt_id}/responses`
- **Auth**: Bearer Token (`STUDENT`)
- **Request Body**:
  ```json
  {
    "question_id": "c1f72d5b-213e-4b2a-8bf8-d5861ea5521b",
    "selected_option_ids": ["42f7c03d-8e45-4b08-8e8e-d9ea9d20c57c"],
    "is_flagged_for_review": false,
    "client_version": 3,
    "client_timestamp": "2026-11-13T10:14:22Z"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "status": "SAVED",
    "saved_version": 3,
    "question_id": "c1f72d5b-213e-4b2a-8bf8-d5861ea5521b"
  }
  ```

#### Finalize and Submit Attempt
- **Method**: `POST`
- **Endpoint**: `/api/v1/student/attempts/{attempt_id}/submit`
- **Auth**: Bearer Token (`STUDENT`)
- **Response**: `200 OK`
  ```json
  {
    "attempt_id": "b0645d9e-c852-45e0-8a1a-3e8bc803e1c4",
    "status": "FINALIZED",
    "is_results_released": false,
    "message": "Attempt submitted successfully."
  }
  ```

---

### Real-Time WebSocket API

All WebSocket connections authenticate via a first-frame JSON payload within 5.0 seconds of opening the socket:
```json
{
  "action": "AUTH",
  "ticket": "wst_c31f498da1c27..."
}
```

1. **Faculty Session Monitor**: `/api/v1/ws/sessions/{session_id}/monitor`
   - Emits `MONITOR_SYNC_STATE` upon connection with complete enrolled roster, connectivity indicators, and real-time answered counts.
   - Emits `STUDENT_PRESENCE_UPDATED` and `STUDENT_PROGRESS_UPDATED` frames as students connect and answer questions.
2. **Student Session Lobby**: `/api/v1/ws/sessions/{session_id}/student`
   - Emits `SESSION_STATUS_CHANGED` frames whenever instructors transition session state (`READY_TO_START`, `SESSION_PAUSED`, `COMPLETED`).

---

## Testing

The project maintains comprehensive test coverage across both the backend service and the frontend single-page application.

### Backend Tests

Backend tests are executed using `pytest`. The suite covers authentication, role authorization, stored procedure callers, attempt lifecycle transitions, proportional scoring algorithms, and WebSocket protocols.

```bash
# Run the complete backend test suite (264 tests)
pytest

# Run tests with quiet reporting
pytest -q

# Run specific functional sub-suites
pytest tests/test_authentication.py
pytest tests/test_attempt_engine.py
pytest tests/test_finalization_scoring.py
pytest tests/test_websockets.py
pytest database/test_verify_and_migrate.py
```

### Frontend Tests

Frontend tests run using `vitest` in a `jsdom` simulated browser environment.

```bash
cd frontend

# Run all frontend tests once (146 tests)
npm test

# Run frontend tests in watch mode
npm test -- --watch

# Perform strict TypeScript type checking
npm run lint

# Verify production production bundle build
npm run build
```

---

## Deployment

The platform is designed to be deployed across separate, horizontally scalable tiers:
- **Frontend SPA**: Hosted on Cloudflare Pages (Edge CDN).
- **Backend API**: Hosted on Render as a Python Web Service (Uvicorn).
- **Relational Database**: Hosted on Neon Serverless PostgreSQL.

```
                      +-----------------------------+
                      |       CLOUDFLARE PAGES      |
                      |   - Static SPA Distribution |
                      |   - /_redirects SPA Fallback|
                      +--------------+--------------+
                                     |
                                     | HTTPS / WSS
                                     v
                      +-----------------------------+
                      |      RENDER WEB SERVICE     |
                      |   - FastAPI / Uvicorn ASGI  |
                      |   - In-memory WebSocket Hub |
                      +--------------+--------------+
                                     |
                                     | Direct TCP (SSL)
                                     v
                      +-----------------------------+
                      |   NEON SERVERLESS POSTGRES  |
                      |   - Direct Unpooled Endpoint|
                      |   - Stored Procedure Engine |
                      +-----------------------------+
```

### 1. Frontend Deployment (Cloudflare Pages)

1. Connect the GitHub repository to **Cloudflare Pages**.
2. Set the build configuration:
   - **Framework Preset**: `Vite` (or `None`)
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
   - **Root Directory**: `frontend`
   - **Node.js Version**: `20.18.0` (set via `NODE_VERSION=20.18.0` in Environment Variables)
3. Ensure the single-page application routing file `frontend/public/_redirects` is deployed:
   ```text
   /*    /index.html   200
   ```
4. Configure Cloudflare Pages Environment Variables:
   - `VITE_API_BASE_URL`: `https://<your-render-backend>.onrender.com/api/v1`
   - `VITE_BACKEND_TARGET`: `https://<your-render-backend>.onrender.com`
   - `VITE_BACKEND_WS_TARGET`: `wss://<your-render-backend>.onrender.com`

### 2. Backend Deployment (Render Web Service)

1. Create a new **Web Service** on Render and connect your repository.
2. Select runtime **Python 3**.
3. Specify build and start commands:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**:
     ```bash
     uvicorn app.main:create_app --factory --host 0.0.0.0 --port $PORT
     ```
4. Set required Environment Variables:
   - `APP_DATABASE_URL`: Direct unpooled connection string using `campusquiz_app` role (`sslmode=require`).
   - `DATABASE_URL`: Connection string for migration status verification.
   - `MIGRATION_DATABASE_URL`: Privileged connection string for schema migrations.
   - `JWT_SECRET_KEY`: Random 64-character hex string.
   - `AUTH_HMAC_SECRET`: Random 64-character hex string (distinct from `JWT_SECRET_KEY`).
   - `CORS_ORIGINS`: `https://<your-cloudflare-subdomain>.pages.dev`
5. Configure health probe path: `/health/live`.

### 3. Database Deployment (Neon PostgreSQL)

1. Create a Neon PostgreSQL project running PostgreSQL 15 or higher.
2. Ensure you obtain the **direct unpooled connection string** (e.g. `ep-xyz.us-east-2.aws.neon.tech`), not the PgBouncer pooler endpoint (`ep-xyz-pooler.neon.tech`), as required for transaction locks and prepared statements.
3. Apply the migrations sequentially using `database/verify_and_migrate.py --migrate` with `MIGRATION_DATABASE_URL`.
4. Run `database/03_permissions.sql` to verify least-privilege role boundaries on `campusquiz_app`.

---

## Contributing

We welcome contributions to CampusQuiz. Follow this workflow to submit improvements:

1. **Fork the Repository**: Create a personal fork on GitHub.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/institutional-analytics
   ```
3. **Adhere to Code Standards**:
   - Maintain documentation and type hints across all Python functions.
   - Do not weaken database check constraints, triggers, or stored procedure permissions.
   - Never write access or refresh tokens to browser `localStorage` or `sessionStorage`.
   - Ensure the definer security model is preserved: direct table mutations for attempts or responses must not be added.
4. **Execute Verification Checks**:
   ```bash
   # Backend checks
   pytest
   
   # Frontend checks
   cd frontend
   npm test
   npm run lint
   npm run build
   ```
5. **Open a Pull Request**: Submit your pull request with a descriptive title, references to relevant issues, and a checklist of executed test commands.

---

## Roadmap

Planned architectural enhancements identified in codebase documentation:

- [ ] **Distributed WebSocket Message Bus**: Transition in-memory `SessionRoomHub` to a Redis Pub/Sub backplane to support horizontal multi-instance backend scaling.
- [ ] **Platform Super-Administrator Dashboard**: Centralized UI for creating new colleges and provisioning administrative credentials across multiple independent institutions.
- [ ] **Formula and Rich Math Question Support**: LaTeX / KaTeX rendering in student exam view and faculty question authoring interface.
- [ ] **Plagiarism and Tab-Switch Detection**: Configurable proctoring heuristics tracking window focus events via WebSocket heartbeat payloads.
- [ ] **Bulk Roster Import**: CSV / Excel parser for batch enrolling students and provisioning faculty profiles within classes.
- [ ] **Advanced Analytics and Question Item Analysis**: Psychometric item difficulty (p-value) and discrimination index calculations for published quiz assessments.

---

## License

<!-- TODO: confirm project license type before public release (e.g., MIT, Apache 2.0, or Proprietary) -->
This project does not currently contain a formal open-source license file. All rights are reserved by the project authors and institutional contributors.

---

## Contact and Acknowledgements

- **Maintained By**: CampusQuiz Core Engineering Team
- **Issue Tracker**: [GitHub Issues](https://github.com/pragya-shree/Quiz/issues)
- **Repository**: [https://github.com/pragya-shree/Quiz](https://github.com/pragya-shree/Quiz)
- Special thanks to the engineering contributors and academic advisors at IIIT Kota.
