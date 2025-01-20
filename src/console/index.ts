import {
  spawn,
  spawnSync,
  type ChildProcess,
  type ChildProcessWithoutNullStreams,
  type SpawnSyncReturns,
} from "child_process";
import type { ConsoleConfig } from "../types/console";
import { BIN_DIR } from "../config";

export class EmbedTSConsole {
  private readonly config: ConsoleConfig;
  private proc: ChildProcessWithoutNullStreams | null = null;
  private listeners: any[] = [];

  constructor(config: ConsoleConfig) {
    this.config = config;
  }

  open() {
    this.proc = spawn(
      `${BIN_DIR}/arduino-cli monitor -p ${this.config.port} -b esp32:esp32:esp32da --config 115200 --quiet`,
      {
        shell: true,
      }
    );
  }

  close() {
    if (this.proc) this.proc.kill();
  }

  on(event: "ready", callback: any) {
    this.listeners.push({ event, callback });
  }

  attach(stdin: NodeJS.ReadStream, stdout: NodeJS.WriteStream) {
    if (!this.proc) this.open();
    if (!this.proc) return;

    if (this.config.restartOnOpen) this.sendRestartPacket();

    this.proc.stdout.on("data", (c) => {
      if (c.includes("\x00\x01\x01\x77")) {
        this.listeners.forEach((listener) => {
          if (listener.event === "ready") listener.callback();
        });

        return;
      }

      stdout.write(c);
    });
    this.proc.stderr.pipe(stdout);
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
  }

  private sendRestartPacket() {
    if (!this.proc) return;

    console.log("Sending restart packet...");

    this.proc.stdin.write("\x00\x01\x03\x77");
  }

  private sendEvalStartPacket() {
    if (!this.proc) return;

    this.proc.stdin.write("\x00\x01\x04\x77");
  }

  private sendEvalEndPacket() {
    if (!this.proc) return;

    this.proc.stdin.write("\x00\x01\x05\x77");
  }
}
