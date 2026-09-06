# Keru — Core API

**Keru** — _Keep Expenses Recorded & Understood_. A personal expense-tracking
API: log expenses and income, organise them with tags, attribute spending to
specific cards/accounts, set monthly budgets, schedule recurring entries, and
view dashboard analytics.

Built with **NestJS** + **TypeORM** + **PostgreSQL**. REST, all routes under
`/api`, URI-versioned (`/api/v1/...`). Interactive docs at `/api/docs`.

---

## Getting started

```bash
npm install

# copy and fill the env files
# .envs/.core.env  — app config
# .envs/.db.env    — database config

# run the database + app with Docker (app on :5005, Postgres on :25432)
docker compose up

# or run the app directly against a local Postgres
npm run start:dev
```

### Migrations

`synchronize` is disabled — all schema changes go through migrations.

```bash
npm run migrations:generate -- --name=SomeChange   # from entity changes
npm run migrations:create   -- --name=SomeChange   # empty migration
npm run migrations:run
npm run migrations:revert
npm run migrations:show
```

### Tests

```bash
npm run test          # unit
npm run test:watch
npm run test:cov
npm run test:e2e
npx jest src/expenses/tests/expenses.service.spec.ts   # a single file
```

### Lint / format

```bash
npm run lint          # ESLint, autofix
npm run format        # Prettier
```

---

## Architecture

Each domain module lives in `src/<domain>/`:

```
controllers/   route handlers, Swagger decorators
services/      business logic, repository access
dtos/          request shapes (class-validator) + response classes (@ApiProperty)
entities/      TypeORM entities (extend AbstractEntity)
enums/         <entity>.enum.ts
interfaces/    internal service contracts (no `any`)
tests/         unit tests
```

Shared code (interceptors, `AbstractEntity`, pagination DTOs) lives in
`src/common/`.

### Modules

| Module            | Responsibility                                                        |
| ----------------- | -------------------------------------------------------------------- |
| `auth`            | Email/password auth, sessions, token rotation (`@lgerma/nestjs-doorkeeper`) |
| `users`           | Profile (`GET`/`PATCH /users/me`)                                    |
| `tags`            | User-defined tags; starter tags seeded on registration              |
| `payment-sources` | User aliases for cards/accounts (e.g. `visa 8943`); expenses can be attributed to and filtered by one |
| `expenses`        | Expense CRUD, filtering (date range, tags, payment method, payment source), pagination |
| `income`          | Income CRUD (fixed / sporadic) with tags                            |
| `budgets`         | Monthly budget per tag, with spend status                           |
| `recurring`       | Recurring entries, processed on a schedule (`@nestjs/schedule`)     |
| `dashboard`       | Aggregated summaries and tag-based analytics                        |

### Conventions

- **Auth** — all routes protected by a global `JwtAuthGuard`; opt out with
  `@Public()`. `@CurrentUser()` gives `{ id: string }`. Protected controllers
  carry `@ApiBearerAuth('JWT-auth')`.
- **Validation** — global `ValidationPipe` with `whitelist` +
  `forbidNonWhitelisted`; every DTO field needs a class-validator decorator.
- **Responses** — wrapped by `ResponseInterceptor` in a `{ code, message, data }`
  envelope.
- **Typing** — services return interfaces (`interfaces/`), controllers declare
  Swagger-decorated response classes (`dtos/*.response.dto.ts`). Keeps the
  service layer free of presentation concerns for cross-module calls.
- **Pagination** — use `PageOptionsDto` / `PageMetaDto` / `PageDto` from
  `src/common/dtos/`; construct `new PageOptionsDto(page, take)` in the service.
- **Soft delete** — `AbstractEntity` provides `deleted_at`; delete endpoints use
  `softRemove`.

---

## API reference

- Swagger UI: `/api/docs`
- OpenAPI JSON: `/api/docs-json`
