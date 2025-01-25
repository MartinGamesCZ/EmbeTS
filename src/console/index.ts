import {
  spawn,
  spawnSync,
  type ChildProcess,
  type ChildProcessWithoutNullStreams,
  type SpawnSyncReturns,
} from "child_process";
import type { ConsoleConfig } from "../types/console";
import { BIN_DIR } from "../config";
import { Logger } from "src/utils/log";
import chalk from "chalk";

export class EmbedTSConsole {
  private readonly config: ConsoleConfig;
  private proc: ChildProcessWithoutNullStreams | null = null;
  private listeners: any[] = [];

  private logger: Logger;

  constructor(config: ConsoleConfig) {
    this.config = config;

    this.logger = new Logger(
      Logger.s.default("CONSOLE", "bgMagenta", "$message")
    );
  }

  open() {
    this.proc = spawn(
      `${BIN_DIR}/arduino-cli monitor -p ${this.config.port} -b esp32:esp32:esp32da --config 115200 --quiet`,
      {
        shell: true,
      }
    );

    this.proc.stdout.on("data", (data) => {
      if (data.includes("\x00\x01\x01\x77")) {
        this.listeners.forEach((listener) => {
          if (listener.event === "ready") listener.callback();
        });

        return;
      }

      this.listeners.forEach((listener) => {
        if (listener.event === "data") listener.callback(data.toString());
      });
    });

    if (this.config.restartOnOpen) this.sendRestartPacket();
  }

  close() {
    if (this.proc) this.proc.kill();
  }

  on(event: "ready" | "data", callback: any) {
    this.listeners.push({ event, callback });
  }

  attach(stdin: NodeJS.ReadStream, stdout: NodeJS.WriteStream) {
    if (!this.proc) this.open();
    if (!this.proc) return;

    this.proc.stdout.on("data", (data) =>
      data.includes("\x00\x01") ? "" : this.printOut(data, stdout)
    );
    this.proc.stderr.pipe(stdout);
  }

  private printOut(data: any, stdout: NodeJS.WriteStream) {
    // Print data to stdout but append "o" to the beginning of each line
    const str = data.toString();

    if (!str.includes("\n")) return stdout.write(str);

    stdout.write(str.split("\n").join(`\n${chalk.magenta("●")} `));
  }

  eval(code: string) {
    if (!this.proc) this.open();
    if (!this.proc) return;

    // Send commands with proper separation
    const sendCommand = async () => {
      this.proc?.stdin.write(Buffer.from([0x00, 0x01, 0x04, 0x77]));

      // Send code in chunks to avoid buffer overflow
      const chunkSize = 64;
      for (let i = 0; i < code.length; i += chunkSize) {
        const chunk = code.slice(i, i + chunkSize);
        this.proc?.stdin.write(chunk);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
      this.proc?.stdin.write(Buffer.from([0x00, 0x01, 0x05, 0x77]));
    };

    sendCommand();

    process.stdout.write(chalk.magenta("●") + " ");
  }

  private sendRestartPacket() {
    if (!this.proc) return;

    this.logger.log("Requesting restart...");

    this.proc.stdin.write("\x00\x01\x03\x77");
  }
}
