import consola from "consola";
import type { ProjectConfig } from "../prompts/interactive.js";
import { scaffoldLocalTemplate } from "./local.js";
import { installDependencies, type PackageManager } from "../utils/package-manager.js";
import { getTemplatesDir, directoryExists } from "../utils/templates.js";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";

const execAsync = promisify(exec);

function validateConfig(config: ProjectConfig): string | null {
  if (!config.name) {
    return "Project name is required";
  }

  if (!config.type) {
    return "Template type is required";
  }

  const validTypes = ["cli", "frontend-bff", "tui"];
  if (!validTypes.includes(config.type)) {
    return `Invalid template type: ${config.type}. Valid types: ${validTypes.join(", ")}`;
  }

  if (config.type === "frontend-bff") {
    const validFrameworks = ["vue", "solid", "lit"];
    if (config.framework && !validFrameworks.includes(config.framework)) {
      return `Invalid framework: ${config.framework}. Valid frameworks: ${validFrameworks.join(", ")}`;
    }
  }

  return null;
}

export async function scaffoldProject(config: ProjectConfig): Promise<void> {
  // Validate config
  const validationError = validateConfig(config);
  if (validationError) {
    consola.error(validationError);
    process.exit(1);
  }

  // Check templates directory exists
  const templatesDir = await getTemplatesDir();
  if (!(await directoryExists(templatesDir))) {
    consola.error(`Templates directory not found: ${templatesDir}`);
    consola.info("If running via bunx, try clearing the cache: bun pm cache rm");
    process.exit(1);
  }

  const projectPath = join(process.cwd(), config.name);

  // Check if project directory already exists
  if (await directoryExists(projectPath)) {
    consola.error(`Directory already exists: ${projectPath}`);
    process.exit(1);
  }

  consola.info(`Creating project: ${config.name}`);
  consola.info(`Template: ${config.type}`);
  if (config.framework) {
    consola.info(`Framework: ${config.framework}`);
  }
  if (config.server) {
    consola.info(`Server: ${config.server}`);
  }
  if (config.ui && config.ui !== "none") {
    consola.info(`UI Library: ${config.ui}`);
  }
  consola.info(`Runtime: ${config.runtime}`);
  consola.log("");

  // Scaffold from local template
  try {
    await scaffoldLocalTemplate(config, projectPath);
  } catch (error) {
    consola.error("Failed to scaffold project");
    if (error instanceof Error) {
      consola.error(error.message);
    }
    consola.info("If running via bunx, try clearing the cache: bun pm cache rm");
    process.exit(1);
  }

  // Initialize git if requested
  if (config.git) {
    consola.start("Initializing git repository...");
    try {
      await execAsync("git init", { cwd: projectPath });
      consola.success("Git repository initialized");
    } catch (error) {
      consola.warn("Failed to initialize git repository");
    }
  }

  // Install dependencies if requested
  if (config.install) {
    const pm = config.runtime as PackageManager;
    consola.start(`Installing dependencies with ${pm}...`);
    try {
      await installDependencies(pm, projectPath);
      consola.success("Dependencies installed");
    } catch (error) {
      consola.warn(`Failed to install dependencies. Run '${pm} install' manually.`);
    }
  }

  consola.log("");
  consola.box({
    title: "Project created!",
    message: `
cd ${config.name}
${config.runtime} run dev
    `.trim(),
  });
}
