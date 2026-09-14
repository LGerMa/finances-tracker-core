# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run start:dev       # Run with file watching
npm run build           # Compile TypeScript

# Linting & formatting
npm run lint            # ESLint with auto-fix
npm run format          # Prettier

# Testing
npm run test            # Unit tests
npm run test:watch      # Watch mode
npm run test:cov        # Coverage
npm run test:e2e        # End-to-end tests
# Run a single test file:
npx jest src/auth/tests/auth.service.spec.ts

# Database migrations
npm run migrations:generate -- --name=MigrationName   # Auto-generate from entity changes
npm run migrations:create -- --name=MigrationName     # Empty migration
npm run migrations:run      # Apply pending migrations
npm run migrations:revert   # Rollback last migration
npm run migrations:show     # List migration status
```

Docker runs the app on port **5005** and PostgreSQL on **25432**. Env files live in `.envs/` (`.core.env` for the app, `.db.env` for the database).

## Reference

**[DESIGN.md](DESIGN.md)** is the authoritative source for this project — entity schemas, API endpoints and their request/response shapes, auth flows, and planned module structure. Read it before implementing any new feature or making schema changes.

## Architecture

**NestJS REST API** for personal expense tracking. All routes are prefixed with `/api` and support URI versioning (`/api/v1/...`). Swagger docs at `/api/docs`.

### Module structure

Each domain module lives in `src/<domain>/` with this layout:
```
controllers/   # Route handlers, Swagger decorators
services/      # Business logic, repository access
dtos/          # Request/response shapes (class-validator)
entities/      # TypeORM entities
enums/         # TypeScript enums — <entity>.enum.ts
interfaces/    # Internal service contracts
tests/         # Unit tests
```

Current modules: `auth`, `users`, `tags`, `expenses`. Common utilities (interceptors, base entity, shared DTOs) live in `src/common/`.

### Authentication — `@lgerma/nestjs-doorkeeper`

This is an **esbuild-compiled** NestJS library. Two important consequences:

1. **Every constructor parameter in services must use `@Inject()`** (metadata reflection breaks with esbuild). This applies to ALL params in the constructor — mixing explicit and implicit injection in the same constructor breaks the implicit ones. Example:
   ```ts
   constructor(
     @Inject(DoorkeeperAuthService) private readonly doorkeeperAuthService: DoorkeeperAuthService,
   )
   ```
2. Any module that uses a doorkeeper-provided service must also add `TypeOrmModule.forFeature([...])` explicitly — it won't be picked up automatically.

`AuthKeeperModule.forRoot()` exports `JwtAuthGuard` but does **not** register it globally on its own. `AppModule` must register it via `{ provide: APP_GUARD, useClass: JwtAuthGuard }` (imported from `@nestjs/core` and `@lgerma/nestjs-doorkeeper`). This makes all routes protected by default; use `@Public()` to opt out. Use `@CurrentUser()` in controllers to get `{ id: string }` of the authenticated user. Both decorators are imported from `@lgerma/nestjs-doorkeeper`.

### Database

- PostgreSQL via TypeORM. **`synchronize` is disabled** — always use migrations for schema changes.
- `AbstractEntity` (`src/common/entities/abstract.entity.ts`) provides `id` (UUID), `created_at`, `updated_at`. Extend it for all entities.
- Entity discovery pattern: `src/**/*.entity.ts`. Migration files: `src/database/migrations/`.
- Data source config for the CLI: `src/database/data-source.ts`.

### DTOs and response typing

- **Request DTOs** live in `dtos/<entity>.dto.ts`. Export `CreateEntityDto` and `UpdateEntityDto` from the same file — `UpdateEntityDto extends PartialType(CreateEntityDto)` (use `PartialType` from `@nestjs/swagger` to preserve Swagger metadata). Use class-validator decorators.
- **Interfaces** (in `interfaces/`) define the shape used for internal service communication and private method return types. Never use `any`.
- **Response classes** live in `dtos/<entity>.response.dto.ts`, implement the interface, and add `@ApiProperty()` on every field for Swagger. Nested objects get their own class and interface pair.
- Services return the **interface**; controllers declare the **class** so Swagger sees the full schema.
- This separation is critical for cross-module service calls (e.g. `DashboardService` calling `ExpensesService` and `IncomeService`). If services returned response classes, consumers would import Swagger-decorated DTOs into the service layer — wrong layer coupling. Interfaces keep service contracts free of presentation concerns.

```ts
// interfaces/user-profile.interface.ts
export interface IUserProfileEmbedded { name: string | null; ... }
export interface IUserProfile { id: string; profile: IUserProfileEmbedded; ... }

// dtos/user-profile.response.dto.ts
export class UserProfileEmbedded implements IUserProfileEmbedded {
  @ApiProperty({ nullable: true }) name: string | null;
}
export class UserProfileResponse implements IUserProfile {
  @ApiProperty() id: string;
  @ApiProperty({ type: () => UserProfileEmbedded }) profile: UserProfileEmbedded;
}

// services/user.service.ts
async getMe(userId: string): Promise<IUserProfile> { ... }

// controllers/user.controller.ts
@ApiOkResponse({ type: UserProfileResponse })
getMe(@CurrentUser() user: { id: string }): Promise<UserProfileResponse> {
  return this.userService.getMe(user.id); // IUserProfile is structurally compatible
}
```

### Pagination

Use `src/common/dtos/page-options.dto.ts`, `page-meta.dto.ts`, and `page.dto.ts` for all paginated endpoints.

In every paginated service method, always instantiate `PageOptionsDto` from the query values so `skip` is computed reliably (the constructor won't run when the DTO is deserialized from query params):

```ts
const page = queryDto.page ?? 1;
const take = queryDto.take ?? 10;
const pageOptionsDto = new PageOptionsDto(page, take); // computes skip internally

// use pageOptionsDto.skip / pageOptionsDto.take in query builder
const meta = new PageMetaDto({ pageOptionsDto, itemCount });
return new PageDto(items.map(...), meta);
```

Query DTOs that add filters (date range, tags, etc.) extend `PageOptionsDto`.

### Global behaviors (src/main.ts)

- `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` — DTOs must use class-validator decorators; unknown fields are rejected.
- `ResponseInterceptor` wraps all responses in a standard envelope.
- `RequestLoggerInterceptor` logs every incoming request.
- Swagger bearer auth token name is `'JWT-auth'` — use `@ApiBearerAuth('JWT-auth')` on protected controllers.
