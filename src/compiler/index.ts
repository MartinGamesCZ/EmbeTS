import path from "path";
import type { CompilerConfig } from "../types/compiler";
import dlog from "../utils/debug";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import Runtime, { Api } from "../runtime";
import { execSync } from "child_process";
import { BIN_DIR } from "../config";
import { escapeQuotes, escapeRawCode } from "../utils/escape";
import swc from "@swc/core";
import { Logger } from "src/utils/log";

export class EmbeTSBuilder {
  private readonly config: CompilerConfig;

  private readonly runtimeDirPath: string;
  private readonly runtimeFilePath: string;
  private readonly compiledFilePath: string;
  private readonly imageDirPath: string;

  private readonly logger: Logger;

  private readonly checksums: { [key: string]: string } = {};

  constructor(config: CompilerConfig) {
    this.config = config;

    this.config.entrypoint = path.resolve(
      process.cwd(),
      this.config.entrypoint
    );
    this.config.output = path.resolve(process.cwd(), this.config.output);

    this.runtimeDirPath = path.resolve(this.config.output, "runtime");
    this.runtimeFilePath = path.resolve(this.runtimeDirPath, "runtime.ino");
    this.compiledFilePath = path.resolve(this.config.output, "compiled.js");
    this.imageDirPath = path.resolve(this.config.output, "img");

    this.logger = new Logger(
      Logger.s.default("COMPILER", "bgGreen", "$message")
    );
  }

  build() {
    dlog("Building EmbeTS...");
    dlog(`Entrypoint: ${this.config.entrypoint}`);
    dlog(`Output: ${this.config.output}`);
    this.logger.log("Building code...");

    this.loadChecksums();
    this.checkEnvironment();
    this.makeOutputDirectory();
    this.compileCode();

    if (this.config.onlyJs === false || !this.config.onlyJs) {
      this.buildRuntime();
      this.compileImage();
    }

    this.saveChecksums();
  }

  // TODO: Implement check for checksums and only flash if necessary
  upload(port: string) {
    dlog("Uploading EmbeTS...");
    this.logger.log("Uploading code...");

    this.checkEnvironment();

    execSync(
      `${BIN_DIR}/arduino-cli upload --fqbn ${this.config.board} --port ${port} --build-path=${this.imageDirPath}`,
      {
        stdio: "inherit",
      }
    );
  }

  private checkEnvironment() {
    const boardList = execSync(
      `${BIN_DIR}/arduino-cli board listall --json`
    ).toString();
    const { boards } = JSON.parse(boardList);

    if (!boards.some((b: any) => b.fqbn == this.config.board)) {
      throw new Error("Board not found. Please install it.");
    }
  }

  private makeOutputDirectory() {
    if (existsSync(this.config.output)) return;

    dlog("Making output directory...");

    mkdirSync(this.config.output, { recursive: true });
    mkdirSync(this.runtimeDirPath, { recursive: true });
  }

  private compileCode() {
    dlog("Compiling code...");

    let code = readFileSync(this.config.entrypoint, "utf-8");

    code = Api() + code;

    const compiled = swc.transformSync(code, {
      filename: "compiled.js",
      sourceMaps: true,
      isModule: true,
      minify: true,
      jsc: {
        parser: {
          syntax: "typescript",
        },
        transform: {},
      },
    });

    writeFileSync(
      this.compiledFilePath,
      compiled.code.replaceAll(
        /([\}\n\;])export[\W]{0,1}\{[\W]{0,1}\}[;]{0,1}/gm,
        "$1"
      ),
      "utf-8"
    );
    if (compiled.map)
      writeFileSync(this.compiledFilePath + ".map", compiled.map, "utf-8");

    this.checksums["compiled"] = this.checksum(
      readFileSync(this.compiledFilePath, "utf-8")
    );
  }

  private buildRuntime() {
    dlog("Building runtime...");

    const source = Runtime(
      escapeRawCode(readFileSync(this.compiledFilePath, "utf-8"))
    );

    writeFileSync(
      path.resolve(this.config.output, "runtime/runtime.ino"),
      source,
      "utf-8"
    );

    this.checksums["runtime"] = this.checksum(source);
  }

  private compileImage() {
    dlog("Compiling image...");

    if (
      this.checkChecksum(
        "runtime",
        readFileSync(
          path.resolve(this.config.output, "runtime/runtime.ino"),
          "utf-8"
        )
      )
    ) {
      this.logger.log("Compiled code is up to date.");
      return;
    }

    execSync(
      `${BIN_DIR}/arduino-cli compile --fqbn ${this.config.board}:FlashMode=qio,UploadSpeed=115200,PartitionScheme=huge_app --export-binaries --build-path=${this.imageDirPath} ${this.runtimeDirPath}`,
      {
        stdio: "inherit",
      }
    );
  }

  private checksum(s: string) {
    let chk = 0x12345678;

    for (var i = 0; i < s.length; i++) {
      chk += s.charCodeAt(i) * (i + 1);
    }

    return (chk & 0xffffffff).toString(16);
  }

  private saveChecksums() {
    dlog("Saving checksums...");

    writeFileSync(
      path.resolve(this.config.output, "checksums.json"),
      JSON.stringify(this.checksums, null, 2),
      "utf-8"
    );
  }

  private loadChecksums() {
    if (!existsSync(path.resolve(this.config.output, "checksums.json")))
      return {};

    return JSON.parse(
      readFileSync(path.resolve(this.config.output, "checksums.json"), "utf-8")
    );
  }

  private checkChecksum(key: string, s: string) {
    const chk = this.loadChecksums()[key];

    return chk === this.checksum(s);
  }
}
