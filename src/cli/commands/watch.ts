import { EmbedTSConsole } from "../../console";
import { EmbeTSBuilder } from "../../compiler";
import { watchFile, readFileSync, existsSync, unwatchFile } from "fs";
import path from "path";
import { BOARDS } from "src/config";
import { Logger } from "src/utils/log";

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

const devLogger = new Logger(Logger.s.default("DEV", "bgYellow", "$message"));
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

  while (true) {
    const _console = new EmbedTSConsole({
      port: options.port,
      restartOnOpen: false,
    });

    cliLogger.log("Please restart your board in download mode");

    _console.open();

    await awaitReady(_console);

    cliLogger.log("Board is ready, uploading...");

    const builder = new EmbeTSBuilder({
      entrypoint: args[0] ?? config?.entrypoint,
      output: options.outDir ?? config?.output ?? "build",
      board:
        options.board ?? BOARDS.find((b) => b.id === config?.board)?.fqbn ?? "",
    });

    await builder.build();
    await builder.upload(options.port);

    const embetsConsole = new EmbedTSConsole({
      port: options.port,
      restartOnOpen: true,
    });

    const watchBuilder = new EmbeTSBuilder({
      entrypoint: args[0] ?? config?.entrypoint,
      output: options.outDir ?? config?.output ?? "build",
      board:
        options.board ?? BOARDS.find((b) => b.id === config?.board)?.fqbn ?? "",
      onlyJs: true,
    });

    embetsConsole.attach(process.stdin, process.stdout);

    let listening = false;

    await new Promise<void>((res) => {
      embetsConsole.on("ready", () => {
        if (listening) return;

        listening = true;

        const checksums = builder.loadChecksums();

        let transformsChecksum = checksums.transforms;

        watchFile(
          args[0] ?? config?.entrypoint,
          {
            interval: 100,
          },
          async () => {
            console.log();
            devLogger.log("File changed, rebuilding...");
            await watchBuilder.build();

            const checksums = builder.loadChecksums();

            if (checksums.transforms != transformsChecksum) {
              unwatchFile(args[0] ?? config?.entrypoint);

              embetsConsole.close();

              res();
            }

            embetsConsole.eval(
              readFileSync(
                path.join(
                  process.cwd(),
                  (config?.output ?? "build") + "/compiled.js"
                ),
                "utf-8"
              )
            );

            transformsChecksum = checksums.transforms;
          }
        );
      });
    });
  }
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
