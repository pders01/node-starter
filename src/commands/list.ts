import { defineCommand } from "citty";
import consola from "consola";
import { getAvailableTemplates } from "../utils/templates.js";

export const listCommand = defineCommand({
  meta: {
    name: "list",
    description: "List available templates",
  },
  async run() {
    const templates = await getAvailableTemplates();

    console.log("\n\x1b[1mAvailable Templates\x1b[0m\n");

    for (const template of templates) {
      console.log(`  \x1b[36m${template.name}\x1b[0m`);
      console.log(`  ${template.description}`);
      if (template.frameworks) {
        console.log(`  \x1b[90mFrameworks:\x1b[0m ${template.frameworks.join(", ")}`);
      }
      if (template.servers) {
        console.log(`  \x1b[90mServers:\x1b[0m    ${template.servers.join(", ")}`);
      }
      if (template.runtime) {
        console.log(`  \x1b[90mRuntime:\x1b[0m    ${template.runtime}`);
      }
      console.log("");
    }

    console.log("\x1b[1mUsage Examples\x1b[0m\n");
    console.log("  \x1b[90m$\x1b[0m npx node-starter create my-app --type cli");
    console.log("  \x1b[90m$\x1b[0m npx node-starter create my-app --type frontend-bff --framework vue");
    console.log("  \x1b[90m$\x1b[0m npx node-starter create my-app --type frontend-bff --framework solid --server elysia");
    console.log("  \x1b[90m$\x1b[0m npx node-starter create my-app --type tui");
    console.log("  \x1b[90m$\x1b[0m npx node-starter create my-app --from github:user/repo");
    console.log("");
  },
});
