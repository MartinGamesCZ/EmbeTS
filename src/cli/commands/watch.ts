import { log } from "console";
import { EmbedTSConsole } from "../../console";
import { EmbeTSBuilder } from "../../compiler";
import { watchFile, readFileSync } from "fs";
import path from "path";

export const NAME = "watch";
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

export async function exec(
  args: string[],
  options: {
    [key: string]: string;
  }
) {
  if (!options.port) return console.error("Please provide a port (--port)");
  if (args.length === 0) return console.error("Please provide an entrypoint");
  if (args.length > 1)
    return console.error("Please provide only one entrypoint");
  if (!options.board) return console.error("Please provide a board (--board)");

  const _console = new EmbedTSConsole({
    port: options.port,
    restartOnOpen: true,
  });

  log("Please restart your board in download mode");

  _console.open();

  await awaitReady(_console);

  log("Board is ready, uploading...");

  const builder = new EmbeTSBuilder({
    entrypoint: args[0],
    output: options.outDir ?? "build",
    board: options.board,
  });

  builder.build();
  builder.upload(options.port);

  const embetsConsole = new EmbedTSConsole({
    port: options.port,
    restartOnOpen: true,
  });

  const watchBuilder = new EmbeTSBuilder({
    entrypoint: args[0],
    output: options.outDir ?? "build",
    board: options.board,
    onlyJs: true,
  });

  embetsConsole.attach(process.stdin, process.stdout);

  embetsConsole.on("ready", () => {
    watchFile(args[0], () => {
      console.log("[DEV] File changed, rebuilding...");
      watchBuilder.build();

      embetsConsole.eval(
        readFileSync(path.join(process.cwd(), "build/compiled.js"), "utf-8")
      );
    });
  });
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
