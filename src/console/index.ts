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

  attach(stdin: NodeJS.ReadStream, stdout: NodeJS.WriteStream) {
    if (!this.proc) this.open();
    if (!this.proc) return;

    if (this.config.restartOnOpen) this.sendRestartPacket();

    this.proc.stdout.pipe(stdout);
    this.proc.stderr.pipe(stdout);
  }

  private sendRestartPacket() {
    if (!this.proc) return;

    this.proc.stdin.write("\x03\x77");
  }
}
