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

const EMBEDTS_START_SEQ = "$$$EMBETS$STARTSEQ$$$";
const EMBEDTS_END_SEQ = "$$$EMBETS$ENDSEQ$$$";

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

    let buffer = "";

    this.proc.stdout.on("data", (data) => {
      buffer += data.toString();

      if (this.isPacket(buffer)) {
        const packet = this.readPacket(buffer);

        switch (packet) {
          case "EVTREADY":
            this.fireEvent("ready", null);
            break;
          case "EVTFLASHED":
            this.fireEvent("flashed", null);
            break;
          case "EVTFLASHERR":
            this.fireEvent("flasherr", null);
            break;
        }

        buffer = "";
      }

      this.fireEvent("data", data);
    });

    if (this.config.restartOnOpen) this.sendRestartPacket();
  }

  close() {
    if (this.proc) this.proc.kill();
  }

  on(event: "ready" | "data" | "flashed" | "flasherr", callback: any) {
    this.listeners.push({ event, callback, once: false });
  }

  once(event: "ready" | "data" | "flashed" | "flasherr", callback: any) {
    this.listeners.push({ event, callback, once: true });
  }

  fireEvent(event: "ready" | "data" | "flashed" | "flasherr", data: any) {
    this.listeners.forEach((listener) => {
      if (listener.event === event) {
        listener.callback(data);
        if (listener.once)
          this.listeners = this.listeners.filter((a) => a != listener);
      }
    });
  }

  attach(stdin: NodeJS.ReadStream, stdout: NodeJS.WriteStream) {
    if (!this.proc) this.open();
    if (!this.proc) return;

    let listeningForPacket = false;
    let packetData = "";

    this.proc.stdout.on("data", (data) => {
      if (listeningForPacket) {
        packetData += data.toString();

        if (this.isPacket(packetData)) {
          const text = this.stripPacket(packetData);

          this.printOut(text, stdout);

          listeningForPacket = false;
          packetData = "";
        }

        if (packetData.includes("\n")) {
          this.printOut(packetData, stdout);
          packetData = "";
          listeningForPacket = false;
        }
      } else if (data.includes("$")) {
        listeningForPacket = true;
        packetData = data.toString();
      } else {
        this.printOut(data, stdout);
      }
    });
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

    this.sendPacket("FLASH", code);

    process.stdout.write(chalk.magenta("●") + " ");
  }

  saveCode(code: string) {
    this.eval(code);

    this.once("flasherr", () => {
      this.logger.log("Error flashing code, retrying...");

      this.saveCode(code);
    });

    return new Promise<void>((r) => {
      this.once("flashed", () => {
        r();
        this.close();
      });
    });
  }

  private sendRestartPacket() {
    if (!this.proc) return;

    this.logger.log("Requesting restart...");

    this.sendPacket("RESTART");
  }

  //-------------------------------------

  private encapsulate(data: string, body: string = "") {
    return `${EMBEDTS_START_SEQ}$${data}$${body.length}$${body}${EMBEDTS_END_SEQ}`;
  }

  private sendPacket(data: string, body: string = "") {
    if (!this.proc) return;

    const packet = this.encapsulate(data, body);

    // Send packet with line ending
    this.proc.stdin.write(packet + "\n", (err) => {
      if (err) this.logger.log("Error sending packet: " + err.message);
    });

    // Wait for transmission
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
  }

  private isPacket(data: string) {
    return data.includes(EMBEDTS_START_SEQ) && data.includes(EMBEDTS_END_SEQ);
  }

  private readPacket(data: string) {
    data = data.substring(
      data.indexOf(EMBEDTS_START_SEQ) + EMBEDTS_START_SEQ.length + 1,
      data.indexOf(EMBEDTS_END_SEQ)
    );

    if (data.endsWith("$")) data = data.slice(0, -1);

    return data;
  }

  private stripPacket(data: string) {
    return data.split(EMBEDTS_END_SEQ)[1];
  }
}
