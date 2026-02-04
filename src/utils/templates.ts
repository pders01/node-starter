import { readdir, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface TemplateInfo {
  name: string;
  description: string;
  path: string;
  frameworks?: string[];
  servers?: string[];
  runtime?: string;
}

export async function getTemplatesDir(): Promise<string> {
  // Navigate from src/utils to templates/
  return join(__dirname, "..", "..", "templates");
}

export async function getAvailableTemplates(): Promise<TemplateInfo[]> {
  const templatesDir = await getTemplatesDir();

  const templates: TemplateInfo[] = [
    {
      name: "cli",
      description: "Node CLI application with citty",
      path: join(templatesDir, "cli"),
      runtime: "bun",
    },
    {
      name: "frontend-bff",
      description: "Frontend application with Backend-for-Frontend",
      path: join(templatesDir, "frontend-bff"),
      frameworks: ["vue", "solid", "lit"],
      servers: ["hono", "elysia", "h3", "express"],
      runtime: "bun (simple) / pnpm (complex)",
    },
    {
      name: "tui",
      description: "Terminal UI application with opentui",
      path: join(templatesDir, "tui"),
      runtime: "bun",
    },
  ];

  return templates;
}

export async function getTemplatePath(type: string): Promise<string> {
  const templatesDir = await getTemplatesDir();
  return join(templatesDir, type);
}

export async function getPartialsDir(): Promise<string> {
  const templatesDir = await getTemplatesDir();
  return join(templatesDir, "_partials");
}

export async function directoryExists(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isFile();
  } catch {
    return false;
  }
}
