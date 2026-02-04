import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export type PackageManager = "bun" | "pnpm" | "npm";

export interface PackageManagerCommands {
  install: string;
  run: string;
  exec: string;
  add: string;
  addDev: string;
}

export function getPackageManagerCommands(pm: PackageManager): PackageManagerCommands {
  switch (pm) {
    case "bun":
      return {
        install: "bun install",
        run: "bun run",
        exec: "bunx",
        add: "bun add",
        addDev: "bun add -d",
      };
    case "pnpm":
      return {
        install: "pnpm install",
        run: "pnpm run",
        exec: "pnpm dlx",
        add: "pnpm add",
        addDev: "pnpm add -D",
      };
    case "npm":
      return {
        install: "npm install",
        run: "npm run",
        exec: "npx",
        add: "npm install",
        addDev: "npm install -D",
      };
  }
}

export async function detectPackageManager(): Promise<PackageManager> {
  // Check for bun first
  try {
    await execAsync("bun --version");
    return "bun";
  } catch {
    // bun not available
  }

  // Check for pnpm
  try {
    await execAsync("pnpm --version");
    return "pnpm";
  } catch {
    // pnpm not available
  }

  // Default to npm
  return "npm";
}

export async function runPackageManagerCommand(
  pm: PackageManager,
  command: string,
  cwd: string
): Promise<{ stdout: string; stderr: string }> {
  return execAsync(command, { cwd });
}

export async function installDependencies(pm: PackageManager, cwd: string): Promise<void> {
  const commands = getPackageManagerCommands(pm);
  await execAsync(commands.install, { cwd });
}
