# Noctua

Gene Ontology CAM (Causal Activity Model) editor — a web-based curation
platform for creating and managing GO-CAMs.

## Architecture

Three-tier stack (each runs as a separate process):
- **Minerva** (separate repo): Backend data server (Blazegraph triplestore, OWL/RDF)
- **Barista** (`barista.js`): Auth middleware + Socket.io relay
- **Noctua** (`noctua.js`): Main Express.js web application

Frontend uses AngularJS 1.5 + Webpack. Real-time updates via Socket.io.

## Key Directories

- `js/` — Client-side code (`NoctuaEditor.js`, `NoctuaLanding.js`, `NoctuaBasic/`)
- `js/lib/noctua-widgetry/` — Shared UI widget library
- `templates/` — Server-side Mustache templates
- `workbenches/` — Pluggable extension modules (configured externally)
- `config/` — Startup YAML profiles (dev/prod)
- `external_js/` — Legacy third-party JS (jQuery UI, jsPlumb, etc.)
- `deploy/` — Webpack output bundles (gitignored)

## Build & Run

```sh
npm install
npm run build          # compile webpack bundles
npm run test           # mocha tests
npm run run-minerva    # start Blazegraph
npm run run-barista    # start auth/relay middleware
npm run run-noctua     # start main web app
```

## Code Conventions

- **Style:** snake_case for variables/functions (no CamelCase)
- **Private functions:** prefix with underscore (`_myFunc`)
- **Modules:** CommonJS `require()` (webpack handles bundling)
- **Linting:** ESLint with babel parser — strict `===`, no `eval`, no `alert`
- **Libraries:** underscore.js utilities throughout, bbop-* ecosystem for data/graph
- **Templates:** Mustache for server-side rendering
- **Comments:** JSDoc for public functions

## Testing

- Mocha + Chai (non-chained assertions)
- Test files: `tests/*.test.js`
- Run: `npm run test`

## Configuration

Runtime config via `startup.yaml` (YAML). Multiple profiles in `config/`.
Key settings: GOlr URLs, Barista location, Minerva jar path, workbench list.

## Git Workflow

- Branch from `master` for features
- Short, descriptive commit messages (imperative mood)
- PRs for review before merging
