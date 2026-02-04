import consola from "consola";

export interface ProjectConfig {
  name: string;
  type: "cli" | "frontend-bff" | "tui";
  framework?: "vue" | "solid" | "lit";
  server?: "hono" | "elysia" | "h3" | "express";
  ui?: "daisyui" | "basecoat" | "none";
  complexity?: "simple" | "complex";
  runtime?: "bun" | "pnpm";
  git: boolean;
  install: boolean;
}

export async function runInteractivePrompts(initialName?: string): Promise<ProjectConfig> {
  // Project name
  const name = initialName || await consola.prompt("Project name:", {
    type: "text",
    default: "my-project",
    placeholder: "my-project",
  }) as string;

  // Template type
  const type = await consola.prompt("Template type:", {
    type: "select",
    options: [
      { value: "cli", label: "cli - Node CLI application" },
      { value: "frontend-bff", label: "frontend-bff - Frontend with Backend-for-Frontend" },
      { value: "tui", label: "tui - Terminal UI application" },
    ],
  }) as "cli" | "frontend-bff" | "tui";

  let framework: "vue" | "solid" | "lit" | undefined;
  let server: "hono" | "elysia" | "h3" | "express" | undefined;
  let ui: "daisyui" | "basecoat" | "none" | undefined;
  let complexity: "simple" | "complex" | undefined;
  let runtime: "bun" | "pnpm" | undefined;

  if (type === "frontend-bff") {
    // Framework selection
    framework = await consola.prompt("Frontend framework:", {
      type: "select",
      options: [
        { value: "vue", label: "Vue - Progressive JavaScript framework" },
        { value: "solid", label: "SolidJS - Simple and performant reactivity" },
        { value: "lit", label: "Lit - Simple, fast web components" },
      ],
    }) as "vue" | "solid" | "lit";

    // Server framework selection
    server = await consola.prompt("BFF server framework:", {
      type: "select",
      options: [
        { value: "hono", label: "Hono - Lightweight, ultrafast web framework" },
        { value: "elysia", label: "Elysia - Ergonomic framework for Bun" },
        { value: "h3", label: "h3 - Minimal H(TTP) framework (UnJS)" },
        { value: "express", label: "Express - Classic Node.js framework" },
      ],
    }) as "hono" | "elysia" | "h3" | "express";

    // UI library selection
    ui = await consola.prompt("UI library:", {
      type: "select",
      options: [
        { value: "none", label: "None - No UI library" },
        { value: "daisyui", label: "daisyUI - Tailwind CSS component library" },
        { value: "basecoat", label: "basecoat - Minimal Tailwind components" },
      ],
    }) as "daisyui" | "basecoat" | "none";

    // Complexity selection
    complexity = await consola.prompt("Project complexity:", {
      type: "select",
      options: [
        { value: "simple", label: "Simple - Bun runtime, Vite bundler" },
        { value: "complex", label: "Complex - pnpm, Rsbuild bundler" },
      ],
    }) as "simple" | "complex";

    // Set default runtime based on complexity
    runtime = complexity === "complex" ? "pnpm" : "bun";
  } else {
    runtime = "bun";
  }

  // Runtime override
  const overrideRuntime = await consola.prompt("Override default runtime?", {
    type: "confirm",
    initial: false,
  });

  if (overrideRuntime) {
    runtime = await consola.prompt("Select runtime:", {
      type: "select",
      options: [
        { value: "bun", label: "bun" },
        { value: "pnpm", label: "pnpm" },
      ],
    }) as "bun" | "pnpm";
  }

  // Git init
  const git = await consola.prompt("Initialize git repository?", {
    type: "confirm",
    initial: true,
  });

  // Install dependencies
  const install = await consola.prompt("Install dependencies?", {
    type: "confirm",
    initial: true,
  });

  return {
    name,
    type,
    framework,
    server,
    ui,
    complexity,
    runtime,
    git,
    install,
  };
}
