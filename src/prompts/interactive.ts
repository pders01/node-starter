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

function handlePromptResult<T>(result: T | symbol | undefined, fieldName: string): T {
  if (typeof result === "symbol" || result === undefined) {
    consola.info("\nCancelled");
    process.exit(0);
  }
  return result;
}

export async function runInteractivePrompts(initialName?: string): Promise<ProjectConfig> {
  // Project name
  const nameResult = initialName || await consola.prompt("Project name:", {
    type: "text",
    default: "my-project",
    placeholder: "my-project",
  });
  const name = handlePromptResult(nameResult, "name") as string;

  // Template type
  const typeResult = await consola.prompt("Template type:", {
    type: "select",
    options: [
      { value: "cli", label: "cli - Node CLI application" },
      { value: "frontend-bff", label: "frontend-bff - Frontend with Backend-for-Frontend" },
      { value: "tui", label: "tui - Terminal UI application" },
    ],
  });
  const type = handlePromptResult(typeResult, "type") as "cli" | "frontend-bff" | "tui";

  let framework: "vue" | "solid" | "lit" | undefined;
  let server: "hono" | "elysia" | "h3" | "express" | undefined;
  let ui: "daisyui" | "basecoat" | "none" | undefined;
  let complexity: "simple" | "complex" | undefined;
  let runtime: "bun" | "pnpm" | undefined;

  if (type === "frontend-bff") {
    // Framework selection
    const frameworkResult = await consola.prompt("Frontend framework:", {
      type: "select",
      options: [
        { value: "vue", label: "Vue - Progressive JavaScript framework" },
        { value: "solid", label: "SolidJS - Simple and performant reactivity" },
        { value: "lit", label: "Lit - Simple, fast web components" },
      ],
    });
    framework = handlePromptResult(frameworkResult, "framework") as "vue" | "solid" | "lit";

    // Server framework selection
    const serverResult = await consola.prompt("BFF server framework:", {
      type: "select",
      options: [
        { value: "hono", label: "Hono - Lightweight, ultrafast web framework" },
        { value: "elysia", label: "Elysia - Ergonomic framework for Bun" },
        { value: "h3", label: "h3 - Minimal H(TTP) framework (UnJS)" },
        { value: "express", label: "Express - Classic Node.js framework" },
      ],
    });
    server = handlePromptResult(serverResult, "server") as "hono" | "elysia" | "h3" | "express";

    // UI library selection
    const uiResult = await consola.prompt("UI library:", {
      type: "select",
      options: [
        { value: "none", label: "None - No UI library" },
        { value: "daisyui", label: "daisyUI - Tailwind CSS component library" },
        { value: "basecoat", label: "basecoat - Minimal Tailwind components" },
      ],
    });
    ui = handlePromptResult(uiResult, "ui") as "daisyui" | "basecoat" | "none";

    // Complexity selection
    const complexityResult = await consola.prompt("Project complexity:", {
      type: "select",
      options: [
        { value: "simple", label: "Simple - Bun runtime, Vite bundler" },
        { value: "complex", label: "Complex - pnpm, Rsbuild bundler" },
      ],
    });
    complexity = handlePromptResult(complexityResult, "complexity") as "simple" | "complex";

    // Set default runtime based on complexity
    runtime = complexity === "complex" ? "pnpm" : "bun";
  } else {
    runtime = "bun";
  }

  // Runtime override
  const overrideResult = await consola.prompt("Override default runtime?", {
    type: "confirm",
    initial: false,
  });
  const overrideRuntime = handlePromptResult(overrideResult, "override");

  if (overrideRuntime) {
    const runtimeResult = await consola.prompt("Select runtime:", {
      type: "select",
      options: [
        { value: "bun", label: "bun" },
        { value: "pnpm", label: "pnpm" },
      ],
    });
    runtime = handlePromptResult(runtimeResult, "runtime") as "bun" | "pnpm";
  }

  // Git init
  const gitResult = await consola.prompt("Initialize git repository?", {
    type: "confirm",
    initial: true,
  });
  const git = handlePromptResult(gitResult, "git") as boolean;

  // Install dependencies
  const installResult = await consola.prompt("Install dependencies?", {
    type: "confirm",
    initial: true,
  });
  const install = handlePromptResult(installResult, "install") as boolean;

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
