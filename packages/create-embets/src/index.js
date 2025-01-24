#!/usr/bin/env node

import inquirer from "inquirer";
import {
  BOARDS,
  CONFIG_TEMPLATE,
  DEPENDENCIES,
  EXAMPLE_TEMPLATE,
  PACKAGE_TEMPLATE,
} from "./config.js";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { readdirSync } from "fs";
import { exec } from "child_process";

const input = await inquirer
  .prompt([
    {
      name: "name",
      message: "What is the name of your project?",
      type: "input",
    },
    {
      name: "board",
      message: "What board are you using?",
      type: "list",
      choices: BOARDS.map((b) => ({
        name: b.name,
        value: b.id,
      })),
    },
  ])
  .catch(() => {
    console.log("Cancelled, exiting...");
    process.exit(1);
  });

const config = { ...CONFIG_TEMPLATE };

if (
  !/[a-z0-9\-\.\_]/gm.test(input.name) ||
  input.name.trim().length < 1 ||
  input.name.toLowerCase() !== input.name
) {
  console.error(
    "Invalid project name (only lowercase letters, numbers, hyphens, dots and underscores are allowed)"
  );
  process.exit(0);
}

config.name = input.name;
config.board = input.board;

console.log("\nCreating project...");

const baseDir = path.join(process.cwd(), config.name);
const __dirname = path.dirname(new URL(import.meta.url).pathname);

mkdirSync(config.name);
mkdirSync(path.join(baseDir, "src"));

writeFileSync(
  path.join(baseDir, "embets.config.json"),
  JSON.stringify(config, null, 2)
);
writeFileSync(path.join(baseDir, "src", "index.ts"), EXAMPLE_TEMPLATE);
writeFileSync(
  path.join(baseDir, "package.json"),
  JSON.stringify(
    {
      ...PACKAGE_TEMPLATE,
      name: config.name,
    },
    null,
    2
  )
);

readdirSync(path.join(__dirname, "include")).forEach((file) => {
  copyFileSync(path.join(__dirname, "include", file), path.join(baseDir, file));
});

exec(
  `cd ${config.name} && npm install && npm install ${DEPENDENCIES.join(" ")}`,
  (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(stdout);
    console.log("Project created successfully!");
  }
);
