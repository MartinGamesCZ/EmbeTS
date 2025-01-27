import { EmbedTSConsole } from "../../console";
import { EmbeTSBuilder } from "../../compiler";
import path from "path";
import { existsSync, readFile, readFileSync } from "fs";
import { BOARDS } from "src/config";
import { Logger } from "src/utils/log";

export const NAME = "upload";
export const OPTIONS = [
  {
    name: "port",
    required: true,
    description: "The port of the board",
  },
  {
    name: "board",
    required: true,
    description: "The board to compile for (FQBN)",
  },
  {
    name: "outDir",
    required: false,
    description: "The output directory",
  },
];

const cliLogger = new Logger(Logger.s.default("CLI", "bgWhite", "$message"));

export async function exec(
  args: string[],
  options: {
    [key: string]: string;
  }
) {
  const configPath = path.join(process.cwd(), "embets.config.json");

  let config: any = null;

  if (existsSync(configPath))
    config = JSON.parse(readFileSync(configPath, "utf-8"));

  if (!options.port) return console.error("Please provide a port (--port)");
  if (args.length === 0 && !config?.entrypoint)
    return console.error("Please provide an entrypoint");
  if (args.length > 1)
    return console.error("Please provide only one entrypoint");
  if (!options.board && !config?.board)
    return console.error("Please provide a board (--board)");

  if (config && config.board)
    options.board =
      BOARDS.find((b) => b.id === config.board)?.fqbn ?? options.board;

  const _console = new EmbedTSConsole({
    port: options.port,
    restartOnOpen: false,
  });

  _console.open();

  cliLogger.log("Please restart your board in download mode");

  await awaitReady(_console);

  cliLogger.log("Board is ready, uploading...");

  const builder = new EmbeTSBuilder({
    entrypoint: args[0] ?? config?.entrypoint,
    output: options.outDir ?? config?.output ?? "build",
    board: options.board ?? config?.board,
  });

  await builder.build();
  await builder.upload(options.port);

  cliLogger.log("Upload complete! Launching console...");

  const embetsConsole = new EmbedTSConsole({
    port: options.port,
    restartOnOpen: true,
  });

  embetsConsole.attach(process.stdin, process.stdout);
}

function awaitReady(_console: EmbedTSConsole) {
  return new Promise<void>((resolve) => {
    let buf = "";

    _console.on("data", (c: string) => {
      buf += c;

      if (buf.includes("(POWERON_RESET)") && buf.includes("DOWNLOAD_BOOT")) {
        resolve();
        _console.close();
      }
    });
  });
}
