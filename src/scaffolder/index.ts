import consola from "consola";
import type { ProjectConfig } from "../prompts/interactive.js";
import { scaffoldLocalTemplate } from "./local.js";
import { installDependencies, type PackageManager } from "../utils/package-manager.js";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";

const execAsync = promisify(exec);

export async function scaffoldProject(config: ProjectConfig): Promise<void> {
  const projectPath = join(process.cwd(), config.name);

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
  await scaffoldLocalTemplate(config, projectPath);

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
