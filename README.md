# node-starter

A scaffolding CLI for generating projects from preferred stack configurations.

## Installation

```bash
# Run directly from GitHub (no install needed)
bunx github:pders01/node-starter create my-app

# Or clone and link globally
git clone https://github.com/pders01/node-starter.git
cd node-starter
bun install
bun link

# Then use from anywhere
node-starter create my-app
```

## Usage

### Interactive mode

```bash
node-starter create
```

### Flag mode

```bash
# CLI project
node-starter create my-app --type cli

# Frontend + BFF with Vue and Hono
node-starter create my-app --type frontend-bff --framework vue

# Frontend + BFF with SolidJS, Elysia, and daisyUI
node-starter create my-app --type frontend-bff --framework solid --server elysia --ui daisyui

# Complex frontend + BFF (uses Rsbuild instead of Vite)
node-starter create my-app --type frontend-bff --framework vue --complexity complex

# TUI project (uses bun create tui)
node-starter create my-app --type tui

# Remote template
node-starter create my-app --from github:user/repo
```

### List available templates

```bash
node-starter list
```

## Template Types

| Type | Description | Scaffolder |
|------|-------------|------------|
| `cli` | Node CLI application | Built-in (citty + consola) |
| `frontend-bff` | Frontend + Backend-for-Frontend | Vite or Rsbuild + BFF overlay |
| `tui` | Terminal UI application | `bun create tui` (OpenTUI) |

## Frontend-BFF Options

### Frameworks
- **vue** - Progressive JavaScript framework
- **solid** - Simple and performant reactivity
- **lit** - Simple, fast web components

### Server Frameworks
- **hono** - Lightweight, ultrafast web framework (default)
- **elysia** - Ergonomic framework for Bun
- **h3** - Minimal H(TTP) framework (UnJS)
- **express** - Classic Node.js framework

### UI Libraries
- **none** - No UI library (default)
- **daisyui** - Tailwind CSS component library
- **basecoat** - Minimal Tailwind components

### Complexity
- **simple** - Bun runtime, Vite bundler (default)
- **complex** - pnpm, Rsbuild bundler

## CLI Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--type` | `-t` | Template type (cli, frontend-bff, tui) |
| `--framework` | `-f` | Frontend framework (vue, solid, lit) |
| `--server` | `-s` | BFF server framework (hono, elysia, h3, express) |
| `--ui` | `-u` | UI library (daisyui, basecoat, none) |
| `--runtime` | `-r` | Runtime (bun, pnpm) |
| `--complexity` | `-c` | Project complexity (simple, complex) |
| `--from` | | Remote template source |
| `--git` | | Initialize git repository (default: true) |
| `--install` | `-i` | Install dependencies (default: true) |

## Development

```bash
# Run CLI in development
bun run dev

# Build CLI
bun run build

# Run directly
bun run start create my-app --type cli
```

## Project Structure

```
node-starter/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── commands/
│   │   ├── create.ts         # Main scaffold command
│   │   └── list.ts           # List available templates
│   ├── prompts/
│   │   └── interactive.ts    # Interactive prompt flows
│   ├── scaffolder/
│   │   ├── index.ts          # Core scaffolding logic
│   │   ├── local.ts          # Local template handling
│   │   └── remote.ts         # Remote template fetching
│   └── utils/
│       ├── templates.ts      # Template discovery
│       └── package-manager.ts # Runtime detection
├── templates/
│   ├── cli/                  # CLI template (built-in)
│   └── _partials/            # Shared configurations
│       ├── bff/              # BFF server templates
│       │   ├── hono/
│       │   ├── elysia/
│       │   ├── h3/
│       │   └── express/
│       ├── tailwind/         # Tailwind + UI configs
│       ├── oxlint/           # Linting config
│       └── tsconfig/         # TypeScript base config
├── package.json
└── tsconfig.json
```

## How It Works

- **CLI template**: Uses our own simple template with citty and consola
- **Frontend-BFF**: Shells out to `bun create vite` or `bun create rsbuild`, then overlays the BFF server and shared configs
- **TUI template**: Shells out to `bun create tui` (OpenTUI)

This approach minimizes maintenance by leveraging official scaffolders while adding project-specific configurations on top.

## Troubleshooting

### `bunx github:` fails with "could not determine executable"

This is a [known bun caching issue](https://github.com/oven-sh/bun/issues/9178). Try clearing the cache:

```bash
bun pm cache rm
bunx github:pders01/node-starter create my-app
```

If it persists, use the clone+link approach instead.

## License

MIT
