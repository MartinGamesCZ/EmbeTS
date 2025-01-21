#!/usr/bin/env bun

import * as CmdUpload from "./commands/upload";
import * as CmdWatch from "./commands/watch";

const COMMANDS = [CmdUpload, CmdWatch];

const cmds = process.argv.slice(2);

// split into args and options
const args = cmds.filter((c) => !c.startsWith("--"));
const options = Object.fromEntries(
  cmds.filter((c) => c.startsWith("--")).map((c) => c.slice(2).split("="))
);

const cmd = COMMANDS.find((c) => c.NAME === cmds[0]);

if (!cmd) {
  console.error("Command not found");
  process.exit(1);
}

cmd.exec(args.slice(1), options);
