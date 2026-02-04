import { readdir, readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { join } from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import ejs from "ejs";
import consola from "consola";
import type { ProjectConfig } from "../prompts/interactive.js";
import { getTemplatePath, getPartialsDir, directoryExists, fileExists } from "../utils/templates.js";

const execAsync = promisify(exec);

interface TemplateContext {
  projectName: string;
  framework?: string;
  server?: string;
  ui?: string;
  runtime?: string;
  complexity?: string;
  usesTailwind: boolean;
  usesUiLibrary: boolean;
}

function buildTemplateContext(config: ProjectConfig): TemplateContext {
  return {
    projectName: config.name,
    framework: config.framework,
    server: config.server,
    ui: config.ui,
    runtime: config.runtime,
    complexity: config.complexity,
    usesTailwind: config.ui === "daisyui" || config.ui === "basecoat",
    usesUiLibrary: config.ui !== undefined && config.ui !== "none",
  };
}

async function processEjsFile(
  filePath: string,
  context: TemplateContext
): Promise<string> {
  const content = await readFile(filePath, "utf-8");
  return ejs.render(content, context);
}

async function copyDirectory(
  src: string,
  dest: string,
  context: TemplateContext
): Promise<void> {
  await mkdir(dest, { recursive: true });

  const entries = await readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    let destName = entry.name;

    if (destName.endsWith(".ejs")) {
      destName = destName.slice(0, -4);
    }

    const destPath = join(dest, destName);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath, context);
    } else {
      if (entry.name.endsWith(".ejs")) {
        const processed = await processEjsFile(srcPath, context);
        if (processed.trim()) {
          await writeFile(destPath, processed);
        }
      } else {
        await copyFile(srcPath, destPath);
      }
    }
  }
}

async function copyPartials(
  partialsDir: string,
  destDir: string,
  config: ProjectConfig,
  context: TemplateContext
): Promise<void> {
  // Copy Tailwind config if using a UI library
  if (context.usesTailwind) {
    const tailwindPartial = join(partialsDir, "tailwind");
    if (await directoryExists(tailwindPartial)) {
      const files = await readdir(tailwindPartial);
      for (const file of files) {
        const srcPath = join(tailwindPartial, file);
        let destName = file;
        if (destName.endsWith(".ejs")) {
          destName = destName.slice(0, -4);
        }
        const destPath = join(destDir, destName);

        if (file.endsWith(".ejs")) {
          const processed = await processEjsFile(srcPath, context);
          await writeFile(destPath, processed);
        } else {
          await copyFile(srcPath, destPath);
        }
      }
    }
  }

  // Always copy oxlint config
  const oxlintPartial = join(partialsDir, "oxlint");
  if (await directoryExists(oxlintPartial)) {
    const files = await readdir(oxlintPartial);
    for (const file of files) {
      await copyFile(join(oxlintPartial, file), join(destDir, file));
    }
  }

  // Copy tsconfig base for CLI template only (Vite/TUI have their own)
  if (config.type === "cli") {
    const tsconfigPartial = join(partialsDir, "tsconfig");
    if (await directoryExists(tsconfigPartial)) {
      const tsconfigBase = join(tsconfigPartial, "tsconfig.base.json");
      if (await fileExists(tsconfigBase)) {
        await copyFile(tsconfigBase, join(destDir, "tsconfig.base.json"));
      }
    }
  }
}

// Map our framework names to Vite template names
function getViteTemplate(framework: string): string {
  switch (framework) {
    case "vue":
      return "vue-ts";
    case "solid":
      return "solid-ts";
    case "lit":
      return "lit-ts";
    default:
      return "vue-ts";
  }
}

async function scaffoldWithVite(config: ProjectConfig, destDir: string): Promise<void> {
  const template = getViteTemplate(config.framework || "vue");
  const cwd = join(destDir, "..");

  consola.start(`Creating ${config.framework} project with Vite...`);

  // Use bun create vite
  await execAsync(`bun create vite ${config.name} --template ${template}`, { cwd });

  consola.success("Vite project created");
}

async function scaffoldWithRsbuild(config: ProjectConfig, destDir: string): Promise<void> {
  const cwd = join(destDir, "..");

  consola.start(`Creating ${config.framework} project with Rsbuild...`);

  // Rsbuild create command with framework
  // Note: rsbuild uses different template names
  let template: string;
  switch (config.framework) {
    case "vue":
      template = "vue-ts";
      break;
    case "solid":
      template = "solid-ts";
      break;
    case "lit":
      template = "lit-ts";
      break;
    default:
      template = "vue-ts";
  }

  await execAsync(`bun create rsbuild@latest ${config.name} --template ${template}`, { cwd });

  consola.success("Rsbuild project created");
}

async function scaffoldTui(config: ProjectConfig, destDir: string): Promise<void> {
  const cwd = join(destDir, "..");

  consola.start("Creating TUI project with OpenTUI...");

  // Use bun create tui
  await execAsync(`bun create tui ${config.name}`, { cwd });

  consola.success("OpenTUI project created");
}

function getServerDependencies(server: string): Record<string, string> {
  switch (server) {
    case "hono":
      return { "hono": "^4.6.14" };
    case "elysia":
      return { "elysia": "^1.1.0", "@elysiajs/cors": "^1.1.0" };
    case "h3":
      return { "h3": "^1.13.0" };
    case "express":
      return { "express": "^4.21.0", "cors": "^2.8.5" };
    default:
      return { "hono": "^4.6.14" };
  }
}

function getServerDevDependencies(server: string): Record<string, string> {
  switch (server) {
    case "express":
      return { "@types/express": "^5.0.0", "@types/cors": "^2.8.17" };
    default:
      return {};
  }
}

async function addBffServer(config: ProjectConfig, destDir: string, context: TemplateContext): Promise<void> {
  const serverFramework = config.server || "hono";
  consola.start(`Adding BFF server (${serverFramework})...`);

  const partialsDir = await getPartialsDir();
  const bffPartial = join(partialsDir, "bff", serverFramework);

  if (await directoryExists(bffPartial)) {
    await copyDirectory(bffPartial, destDir, context);
  } else {
    consola.warn(`Server template for ${serverFramework} not found, using hono`);
    const fallbackPartial = join(partialsDir, "bff", "hono");
    if (await directoryExists(fallbackPartial)) {
      await copyDirectory(fallbackPartial, destDir, context);
    }
  }

  // Update package.json to add server scripts and dependencies
  const pkgPath = join(destDir, "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));

  // Add BFF dependencies based on server framework
  pkg.dependencies = pkg.dependencies || {};
  const serverDeps = getServerDependencies(serverFramework);
  Object.assign(pkg.dependencies, serverDeps);

  pkg.devDependencies = pkg.devDependencies || {};
  pkg.devDependencies["concurrently"] = "^9.1.0";
  const serverDevDeps = getServerDevDependencies(serverFramework);
  Object.assign(pkg.devDependencies, serverDevDeps);

  // Add server scripts
  pkg.scripts = pkg.scripts || {};
  pkg.scripts["server"] = "bun run server/index.ts";
  pkg.scripts["start"] = `concurrently "${config.runtime} run dev" "${config.runtime} run server"`;

  await writeFile(pkgPath, JSON.stringify(pkg, null, 2));

  consola.success(`BFF server (${serverFramework}) added`);
}

async function addTailwindToProject(config: ProjectConfig, destDir: string, context: TemplateContext): Promise<void> {
  consola.start("Adding Tailwind CSS...");

  const pkgPath = join(destDir, "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));

  // Add Tailwind dependencies
  pkg.devDependencies = pkg.devDependencies || {};
  pkg.devDependencies["tailwindcss"] = "^3.4.16";
  pkg.devDependencies["postcss"] = "^8.4.49";
  pkg.devDependencies["autoprefixer"] = "^10.4.20";

  if (config.ui === "daisyui") {
    pkg.devDependencies["daisyui"] = "^4.12.14";
  }

  await writeFile(pkgPath, JSON.stringify(pkg, null, 2));

  // Copy tailwind configs from partials
  const partialsDir = await getPartialsDir();
  const tailwindPartial = join(partialsDir, "tailwind");

  if (await directoryExists(tailwindPartial)) {
    const files = await readdir(tailwindPartial);
    for (const file of files) {
      const srcPath = join(tailwindPartial, file);
      let destName = file;
      if (destName.endsWith(".ejs")) {
        destName = destName.slice(0, -4);
      }
      const destPath = join(destDir, destName);

      if (file.endsWith(".ejs")) {
        const processed = await processEjsFile(srcPath, context);
        await writeFile(destPath, processed);
      } else {
        await copyFile(srcPath, destPath);
      }
    }
  }

  // Add Tailwind directives to CSS file
  const cssFiles = ["src/style.css", "src/index.css", "src/App.css"];
  for (const cssFile of cssFiles) {
    const cssPath = join(destDir, cssFile);
    if (await fileExists(cssPath)) {
      const existingCss = await readFile(cssPath, "utf-8");
      const tailwindDirectives = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n`;
      await writeFile(cssPath, tailwindDirectives + existingCss);
      break;
    }
  }

  consola.success("Tailwind CSS added");
}

async function scaffoldCliTemplate(config: ProjectConfig, destDir: string, context: TemplateContext): Promise<void> {
  const templatePath = await getTemplatePath("cli");

  if (!(await directoryExists(templatePath))) {
    throw new Error("CLI template not found");
  }

  await mkdir(destDir, { recursive: true });
  await copyDirectory(templatePath, destDir, context);
}

export async function scaffoldLocalTemplate(
  config: ProjectConfig,
  destDir: string
): Promise<void> {
  consola.start("Scaffolding project...");

  const partialsDir = await getPartialsDir();
  const context = buildTemplateContext(config);

  switch (config.type) {
    case "cli":
      // CLI uses our own simple template
      await scaffoldCliTemplate(config, destDir, context);
      break;

    case "frontend-bff":
      // Shell out to Vite or Rsbuild based on complexity
      if (config.complexity === "complex") {
        await scaffoldWithRsbuild(config, destDir);
      } else {
        await scaffoldWithVite(config, destDir);
      }
      // Add BFF server overlay
      await addBffServer(config, destDir, context);
      // Add Tailwind if using a UI library
      if (context.usesTailwind) {
        await addTailwindToProject(config, destDir, context);
      }
      break;

    case "tui":
      // Shell out to bun create tui
      await scaffoldTui(config, destDir);
      break;
  }

  // Copy shared partials (oxlint, etc.)
  await copyPartials(partialsDir, destDir, config, context);

  consola.success("Project scaffolded successfully");
}
