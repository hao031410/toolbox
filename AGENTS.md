# Repository Guidelines

## Project Structure & Module Organization
This repository is an npm workspace monorepo. `apps/web` contains the Next.js 16 frontend (`src/app`, `src/components`, `src/lib`). `apps/api` contains the NestJS 11 backend (`src/*` modules, `test/*` e2e tests, `prisma/schema.prisma`). Shared operational files live in `docker/` and `docker-compose.yml`. Project docs belong in `doc/`. Local JSON persistence data should stay in `temp/`. Treat `output/` as disposable prototype output, not source of truth.

## Build, Test, and Development Commands
Run all commands from the repository root unless a package path is shown.

```bash
npm ci                # install workspace dependencies
npm run dev           # start web on :3000 and api on :3001
npm run lint          # lint api and web
npm run build         # build api first, then web
npm run test --workspace api
npm run test:e2e --workspace api
npm run test:cov --workspace api
```

Use `docker-compose.yml` only for deployment-style verification, not normal feature development.

## Coding Style & Naming Conventions
Use TypeScript across both apps. Follow the existing style: single quotes in API code, semicolons enabled, and clear module-based organization on the Nest side. Keep React components, pages, and Nest classes in PascalCase; utilities, DTO files, and route segments use kebab-case or framework defaults such as `create-history.dto.ts` and `calculator/page.tsx`. Run ESLint before submitting changes. API formatting is enforced through Prettier + `eslint-plugin-prettier`; web linting follows `eslint-config-next`.

## Testing Guidelines
Backend tests use Jest. Unit tests should end with `.spec.ts`; e2e tests live under `apps/api/test` and use `*.e2e-spec.ts`. Add or update tests for service, controller, validation, and persistence changes. There is currently no frontend test suite, so any UI change should at minimum pass `npm run lint` and `npm run build`.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commits: `feat: ...`, `fix: ...`, `chore: ...`. Keep commits focused and scoped to one change. PRs should include a short summary, affected areas (`web`, `api`, `docker`, `doc`), validation steps you ran, and screenshots for visible UI changes. Link related issues when applicable.

## Security & Configuration Tips
Do not commit secrets. Keep runtime configuration in `.env` files derived from the provided examples. Prefer `PERSISTENCE_DRIVER=json` for local development and verify any `DATABASE_URL` or storage-path change before merging.
