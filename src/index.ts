#!/usr/bin/env bun
import { defineCommand, runMain } from "citty";
import { createCommand } from "./commands/create.js";
import { listCommand } from "./commands/list.js";

const main = defineCommand({
  meta: {
    name: "node-starter",
    version: "0.1.0",
    description: "A scaffolding CLI for generating projects from preferred stack configurations",
  },
  subCommands: {
    create: createCommand,
    list: listCommand,
  },
});

runMain(main);
