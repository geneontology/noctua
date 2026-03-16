# Noctua

Gene Ontology CAM (Causal Activity Model) editor — a web-based curation
platform for creating and managing GO-CAMs.

## Architecture

Three-tier stack (each runs as a separate process):
- **Minerva** (port 6800): Backend data server (Blazegraph triplestore, OWL/RDF)
- **Barista** (`barista.js`, port 3400): Auth middleware + Socket.io relay
- **Noctua** (`noctua.js`, port 8910): Main Express.js web application

Frontend uses AngularJS 1.5 + Browserify. Real-time updates via Socket.io.

## Key Directories

- `js/` — Client-side code (`NoctuaEditor.js`, `NoctuaLanding.js`, `NoctuaBasic/`)
- `js/lib/noctua-widgetry/` — Shared UI widget library
- `templates/` — Server-side Mustache templates
- `workbenches/` — Pluggable extension modules (configured externally)
- `config/` — Startup YAML profiles (dev/prod)
- `external_js/` — Legacy third-party JS (jQuery UI, jsPlumb, etc.)
- `deploy/` — Browserify output bundles (gitignored)

## Build & Run

```sh
npm install
gulp build          # compile browserify bundles
gulp watch          # dev mode with file watching
gulp test           # mocha tests + eslint
gulp run-minerva    # start Blazegraph
gulp run-barista    # start auth/relay middleware
gulp run-noctua     # start main web app
```

## Code Conventions

- **Style:** snake_case for variables/functions (no CamelCase)
- **Private functions:** prefix with underscore (`_myFunc`)
- **Modules:** CommonJS `require()` (browserified)
- **Linting:** ESLint with babel parser — strict `===`, no `eval`, no `alert`
- **Libraries:** underscore.js utilities throughout, bbop-* ecosystem for data/graph
- **Templates:** Mustache for server-side rendering
- **Comments:** JSDoc for public functions

## Testing

- Mocha + Chai (non-chained assertions)
- Test files: `tests/*.test.js`
- Run: `gulp test`

## Configuration

Runtime config via `startup.yaml` (YAML). Multiple profiles in `config/`.
Key settings: GOlr URLs, Barista location, Minerva jar path, workbench list.

## Git Workflow

- Branch from `master` for features
- Short, descriptive commit messages (imperative mood)
- PRs for review before merging
