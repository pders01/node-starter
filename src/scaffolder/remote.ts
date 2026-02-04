import { downloadTemplate } from "giget";
import consola from "consola";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { detectPackageManager, installDependencies } from "../utils/package-manager.js";

const execAsync = promisify(exec);

interface RemoteOptions {
  git: boolean;
  install: boolean;
}

export async function scaffoldRemoteTemplate(
  source: string,
  projectName: string,
  options: RemoteOptions
): Promise<void> {
  const destDir = join(process.cwd(), projectName);

  consola.info(`Fetching template from: ${source}`);
  consola.info(`Destination: ${destDir}`);
  consola.log("");

  consola.start("Downloading template...");

  try {
    const { source: resolvedSource, dir } = await downloadTemplate(source, {
      dir: destDir,
      force: false,
    });

    consola.success(`Template downloaded from ${resolvedSource}`);

    // Initialize git if requested
    if (options.git) {
      consola.start("Initializing git repository...");
      try {
        await execAsync("git init", { cwd: destDir });
        consola.success("Git repository initialized");
      } catch (error) {
        consola.warn("Failed to initialize git repository");
      }
    }

    // Install dependencies if requested
    if (options.install) {
      const pm = await detectPackageManager();
      consola.start(`Installing dependencies with ${pm}...`);
      try {
        await installDependencies(pm, destDir);
        consola.success("Dependencies installed");
      } catch (error) {
        consola.warn(`Failed to install dependencies. Run '${pm} install' manually.`);
      }
    }

    consola.log("");
    consola.box({
      title: "Project created!",
      message: `
cd ${projectName}
# Start developing!
      `.trim(),
    });
  } catch (error) {
    if (error instanceof Error) {
      consola.error(`Failed to download template: ${error.message}`);
    } else {
      consola.error("Failed to download template");
    }
    process.exit(1);
  }
}
