# Codebase Index — Acquisitions API

Generated 2026-09-09. A Node.js/Express REST API with JWT auth, backed by Neon Postgres via Drizzle ORM.

## Stack

| Concern | Choice |
| --- | --- |
| Runtime | Node.js, ESM (`"type": "module"`) |
| HTTP | Express 5 |
| DB | Neon serverless Postgres (`@neondatabase/serverless`) |
| ORM / migrations | Drizzle ORM + drizzle-kit |
| Validation | Zod 4 |
| Auth | `jsonwebtoken` (HS256 default), `bcrypt` hashing, httpOnly cookie |
| Logging | Winston (files) + Morgan (HTTP access) |
| Security middleware | helmet, cors, cookie-parser |
| Tooling | ESLint 10 (flat config) + Prettier |

## Import aliases

`package.json` `imports` maps subpath specifiers. Always use these instead of relative paths (`../../`):

```
#config/*      -> ./src/config/*
#controllers/* -> ./src/controllers/*
#models/*      -> ./src/models/*
#routes/*      -> ./src/routes/*
#utils/*       -> ./src/utils/*
#middleware/*  -> ./src/middleware/*   (mapped, directory does not exist yet)
#services/*    -> ./src/services/*
#validations/* -> ./src/validations/*
```

Note: the `.js` extension is required in every import (ESM).

## Scripts

```
npm run dev          nodemon src/index.js
npm run lint         eslint .
npm run lint:fix     eslint . --fix
npm run format       prettier --write .
npm run format:check prettier --check .
npm run db:generate  drizzle-kit generate   (SQL from src/models/*.js)
npm run db:migrate   drizzle-kit migrate
npm run db:studio    drizzle-kit studio
npm test             not configured (exits 1)
```

## Directory map

```
src/
  index.js                    entrypoint: loads dotenv, imports server
  server.js                   app.listen on PORT (default 3000)
  app.js                      express app: middleware chain + route mounting
  config/
    database.js               neon() client + drizzle instance; exports { db, sql }
    logger.js                 winston logger, service meta "acquisitions-api"
  controllers/
    auth.controller.js        signup handler
  services/
    auth.service.js           hashPassword, createUser  (untracked in git)
  models/
    user.model.js             drizzle pgTable "users"
  routes/
    authRoutes.js             POST /register
  validations/
    auth.validation.js        RegisterSchema, LoginSchema (zod)
  utils/
    jwt.js                    jwttoken.sign
    cookies.js                cookied.get/set/clear
    format.js                 formatValidationError
drizzle/
  0000_handy_mongu.sql        initial users table migration
  meta/                       drizzle snapshot + journal
drizzle.config.js             schema ./src/models/*.js -> out ./drizzle, dialect postgresql
eslint.config.js              flat config; ignores node_modules, coverage, logs, drizzle
combined.log / error.log      winston file transports (written to repo root)
```

## Request flow

```
HTTP -> app.js middleware (helmet, cors, cookieParser, json, urlencoded, morgan->winston)
     -> /api/auth  (routes/authRoutes.js)
     -> controllers/auth.controller.js
          zod safeParse (validations/auth.validation.js)
          -> formatValidationError on failure -> 400
          -> services/auth.service.js createUser
               db.select existing by email -> throw if found
               bcrypt.hash(password, 10)
               db.insert(users).returning(...)  (password excluded from return)
          -> jwttoken.sign({ id, email, role })
          -> cookied.set(res, 'token', token)
          -> 201 { message, user }
```

## Routes

| Method | Path | Handler | Status |
| --- | --- | --- | --- |
| GET | `/` | inline in `app.js` | returns plain-text greeting |
| GET | `/health` | inline in `app.js` | `{ status: 'OK', timestamp }` |
| POST | `/api/auth/register` | `signup` | implemented |

`signin` / `signout` are not implemented — `LoginSchema` exists in `auth.validation.js` but has no route, controller, or service consumer yet.

## Data model

`users` (`src/models/user.model.js` → `drizzle/0000_handy_mongu.sql`)

| Column | Type | Notes |
| --- | --- | --- |
| id | serial | primary key |
| name | varchar(255) | not null |
| email | varchar(255) | not null, unique (`users_email_unique`) |
| password | varchar(255) | not null, bcrypt hash |
| role | varchar(50) | not null, default `'user'` |
| created_at | timestamp | not null, default `now()` |

Validation allows `role` of `'user' | 'admin'`; the DB column does not enforce an enum.

## Key module contracts

- **`#config/database.js`** — `db` (drizzle) and `sql` (raw neon tagged template). Reads `DATABASE_URL` at import time.
- **`#config/logger.js`** — default export. Level from `LOG_LEVEL` (default `info`). Always writes `error.log` + `combined.log`; adds a colorized console transport when `NODE_ENV !== 'production'`.
- **`#utils/jwt.js`** — `jwttoken.sign(payload)`, expires in `1d`, secret from `JWT_SECRET` with a hardcoded dev fallback.
- **`#utils/cookies.js`** — `cookied` object. Defaults: `httpOnly`, `sameSite: 'strict'`, `secure` only in production, `maxAge` 15 min.
- **`#utils/format.js`** — `formatValidationError(zodError)` → comma-joined issue messages.
- **`#services/auth.service.js`** — `hashPassword(password)`, `createUser({ name, email, password, role })`. `createUser` throws `'User with this email already exists'`; the controller string-matches that message to return 400.

## Environment variables

From `.env.example` plus code reads:

```
PORT=8383            # server.js falls back to 3000
NODE_ENV=development # gates console logging and cookie `secure`
LOG_LEVEL=info
DATABASE_URL=...     # neon connection string; used by app + drizzle.config.js
JWT_SECRET=...       # NOT in .env.example; falls back to 'your_secret_key'
```

## Conventions

- Controllers own HTTP concerns (status codes, response shape); services own DB/business logic and throw plain `Error`s.
- Validation schemas live in `src/validations/`, one file per domain, exported as `<Name>Schema`.
- Unused Express `next` params are named `_next` (ESLint `argsIgnorePattern: '^_'`).
- Single quotes, semicolons, 2-space indent, `const`/arrow functions — enforced by ESLint.
- Route files export a configured `express.Router()` as default and are mounted with a prefix in `app.js`.

## Gaps / notes for future work

- No `src/middleware/` directory despite the alias — no auth-guard middleware, and no centralized error handler (each controller try/catches).
- No tests and no test runner installed.
- `README.md` is empty.
- `JWT_SECRET` is missing from `.env.example` and has an insecure hardcoded fallback in `src/utils/jwt.js`.
- JWT lifetime (`1d`) and the auth cookie `maxAge` (15 min) disagree.
- `combined.log` and `error.log` are committed to the repo and get modified on every run.
- `src/services/` is untracked in git as of the last commit (`b17f151 feat: implemented routes(50%)`).
