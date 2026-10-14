# AGENTS.md

## Project

- Angular 22 standalone app with SSR (Angular SSR + Express 5). Single project `app_uno` (the underscore is intentional), source root `src`, component prefix `app`.
- Entrypoints: `src/main.ts` (browser), `src/main.server.ts` + `src/server.ts` (Express SSR handler). SSR is always on (`outputMode: "server"` in `angular.json`); builds emit `dist/app_uno/browser` and `dist/app_uno/server`.
- Root component is `src/app/app.ts` (class `App`), not `app.component.ts` — Angular 22 file naming. Routes live in `src/app/app.routes.ts` (currently empty).

## Convenciones del proyecto (obligatorias)

- Estructura **componente-servicio**: cada componente se acompaña de su servicio (`<feature>/<feature>.ts` + `<feature>.service.ts`) que concentra datos y lógica; el componente maneja solo la vista.
- Todas las interfaces se definen en un directorio `interfaces/` (`src/app/interfaces/`), no junto a los componentes que las usan.
- Los componentes siempre usan template externo (`templateUrl` con un `.html` separado del `.ts`); nunca template inline en `@Component`.

## Commands

- `npm start` — dev server at http://localhost:4200
- `npm run build` — production build (default configuration, enforces budgets)
- `npx ng test --watch=false` — run all unit tests once. `ng test` watches interactively, so pass `--watch=false` for a one-shot run.
- Single test: `npx ng test --filter '<name regex>'`. Single file: `npx ng test --include 'src/app/foo.spec.ts'` (combine with `--watch=false`).
- Typecheck without building: `npx tsc -p tsconfig.app.json --noEmit` (there is no `typecheck` script).
- `npm run serve:ssr:app_uno` — serve the built SSR app (port from `PORT`, default 4000). Requires a prior `npm run build`.
- Scaffold with `npx ng generate component <name>` (and siblings). No NgModules; everything is standalone.

## Testing

- Runner is **Vitest** (not Karma/Jasmine), wired via `@angular/build:unit-test`. Tests run in jsdom, no browser install needed.
- Specs are colocated `src/**/*.spec.ts`. `describe`/`it`/`expect` are globals (`vitest/globals` in `tsconfig.spec.json`) — no imports required.
- No e2e framework is installed despite the README mentioning `ng e2e` — don't run it.

## Conventions & gotchas

- Prettier is configured (`.prettierrc`: 100 cols, single quotes, Angular HTML parser) but there is no format/lint npm script and no ESLint. The scaffolded files do **not** pass `npx prettier --check .` (CRLF line endings + formatting). Do not run `prettier --write .` repo-wide; format only files you edit.
- `tsconfig.json` enables `noPropertyAccessFromIndexSignature`: use bracket access for index signatures, e.g. `process.env['PORT']` (see `src/server.ts`).
- Production build budgets (`angular.json`): initial bundle 500 kB warn / 1 MB error; component styles 4 kB warn / 8 kB error. Exceeding errors fails the build.
- Hydration is enabled (`provideClientHydration()`), so code touching `window`/DOM must be guarded for SSR (`isPlatformBrowser` or run after render).
- Components declare dependencies via `imports: [...]` in the `@Component` decorator; `standalone: true` is implicit in Angular 22.
- Component state uses signals (see `title = signal(...)` in `src/app/app.ts`).

## Verify before finishing

1. `npx ng test --watch=false`
2. `npm run build`
