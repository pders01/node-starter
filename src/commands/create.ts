import { defineCommand } from "citty";
import consola from "consola";
import { runInteractivePrompts, type ProjectConfig } from "../prompts/interactive.js";
import { scaffoldProject } from "../scaffolder/index.js";
import { scaffoldRemoteTemplate } from "../scaffolder/remote.js";

export const createCommand = defineCommand({
  meta: {
    name: "create",
    description: "Create a new project from a template",
  },
  args: {
    name: {
      type: "positional",
      description: "Project name",
      required: false,
    },
    type: {
      type: "string",
      description: "Template type (cli, frontend-bff, tui)",
      alias: "t",
    },
    framework: {
      type: "string",
      description: "Frontend framework (vue, solid, lit)",
      alias: "f",
    },
    server: {
      type: "string",
      description: "BFF server framework (hono, elysia, h3, express)",
      alias: "s",
    },
    ui: {
      type: "string",
      description: "UI library (daisyui, basecoat, none)",
      alias: "u",
    },
    runtime: {
      type: "string",
      description: "Runtime (bun, pnpm)",
      alias: "r",
    },
    complexity: {
      type: "string",
      description: "Project complexity (simple, complex)",
      alias: "c",
    },
    from: {
      type: "string",
      description: "Remote template source (e.g., github:user/repo)",
    },
    git: {
      type: "boolean",
      description: "Initialize git repository",
      default: true,
    },
    install: {
      type: "boolean",
      description: "Install dependencies",
      alias: "i",
      default: true,
    },
  },
  async run({ args }) {
    consola.start("Starting project creation...\n");

    // Handle remote templates
    if (args.from) {
      const projectName = args.name || "my-project";
      await scaffoldRemoteTemplate(args.from, projectName, {
        git: args.git,
        install: args.install,
      });
      return;
    }

    // Build config from args or run interactive prompts
    let config: ProjectConfig;

    if (args.type) {
      // Flag mode - use provided args
      config = {
        name: args.name || "my-project",
        type: args.type as "cli" | "frontend-bff" | "tui",
        framework: args.framework as "vue" | "solid" | "lit" | undefined,
        server: args.server as "hono" | "elysia" | "h3" | "express" | undefined,
        ui: args.ui as "daisyui" | "basecoat" | "none" | undefined,
        runtime: args.runtime as "bun" | "pnpm" | undefined,
        complexity: args.complexity as "simple" | "complex" | undefined,
        git: args.git,
        install: args.install,
      };

      // Set defaults based on type
      if (config.type === "frontend-bff") {
        config.framework = config.framework || "vue";
        config.server = config.server || "hono";
        config.ui = config.ui || "none";
        config.complexity = config.complexity || "simple";
        config.runtime = config.runtime || (config.complexity === "complex" ? "pnpm" : "bun");
      } else {
        config.runtime = config.runtime || "bun";
      }
    } else {
      // Interactive mode
      config = await runInteractivePrompts(args.name);
    }

    await scaffoldProject(config);
  },
});
