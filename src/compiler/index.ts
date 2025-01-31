import path from "path";
import type { CompilerConfig } from "../types/compiler";
import dlog from "../utils/debug";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "fs";
import Runtime, { Api } from "../runtime";
import { execSync, spawn, spawnSync } from "child_process";
import { BIN_DIR } from "../config";
import { escapeQuotes, escapeRawCode } from "../utils/escape";
import swc from "@swc/core";
import { Logger } from "../utils/log";
import chalk from "chalk";
import { EmbedTSConsole } from "../console";

export class EmbeTSBuilder {
  private readonly config: CompilerConfig;

  private readonly runtimeDirPath: string;
  private readonly runtimeFilePath: string;
  private readonly compiledFilePath: string;
  private readonly imageDirPath: string;

  private readonly logger: Logger;

  private readonly checksums: { [key: string]: string } = {};

  private transforms: {
    cImports: {
      [key: string]: string;
    };
    cRegistrations: {
      [key: string]: {
        source: string;
        ret: string;
        args: string[];
      };
    };
  } = {
    cImports: {},
    cRegistrations: {},
  };

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

  async build() {
    dlog("Building EmbeTS...");
    dlog(`Entrypoint: ${this.config.entrypoint}`);
    dlog(`Output: ${this.config.output}`);
    this.logger.log("Building code...");

    this.loadChecksums();
    this.checkEnvironment();
    this.makeOutputDirectory();
    this.compileCode();

    this.copyCImports();

    if (this.config.onlyJs === false || !this.config.onlyJs) {
      this.copyRuntimeFiles();
      this.buildRuntime();
      await this.compileImage();
    }

    this.saveChecksums();
  }

  // TODO: Implement check for checksums and only flash if necessary
  async upload(port: string) {
    dlog("Uploading EmbeTS...");
    this.logger.log("Uploading code...");

    this.checkEnvironment();

    const proc = spawn(
      `${BIN_DIR}/arduino-cli upload --fqbn ${this.config.board} --port ${port} --build-path=${this.imageDirPath}`,
      {
        shell: true,
      }
    );

    process.stdout.write(chalk.green("●") + " ");

    await new Promise<void>((res) => {
      proc.stdout.on("data", (data) => {
        const str = data.toString();

        if (!str.includes("\n")) return process.stdout.write(str);

        process.stdout.write(str.split("\n").join(`\n${chalk.green("●")} `));
      });

      proc.stderr.on("data", (data) => {
        process.stdout.write(data);
      });

      proc.on("exit", () => {
        res();
      });
    });

    const con = new EmbedTSConsole({
      port: port,
      restartOnOpen: true,
      embetsConfig: this.config.embetsConfig,
    });

    con.attach(process.stdin, process.stdout);

    await new Promise<void>((res) => {
      con.once("ready", async () => {
        await new Promise((r) => setTimeout(r, 1000));
        await con.saveCode(readFileSync(this.compiledFilePath, "utf-8"));

        res();
      });
    });

    con.close();
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

    let compiledCode = compiled.code.replaceAll(
      /([\}\n\;])export[\W]{0,1}\{[\W]{0,1}\}[;]{0,1}/gm,
      "$1"
    );

    compiledCode = this.transformCImports(compiledCode);
    compiledCode = this.transformCRegistrations(compiledCode);

    writeFileSync(this.compiledFilePath, compiledCode, "utf-8");
    if (compiled.map)
      writeFileSync(this.compiledFilePath + ".map", compiled.map, "utf-8");

    this.checksums["compiled"] = this.checksum(
      readFileSync(this.compiledFilePath, "utf-8")
    );

    this.checksums["transforms"] = this.checksum(
      JSON.stringify(this.transforms)
    );
  }

  private copyRuntimeFiles() {
    dlog("Copying runtime files...");

    const dir = path.resolve(import.meta.dirname, "../runtime/core/native");
    const dest = path.resolve(this.runtimeDirPath);

    function copyDir(p: string, prefix: string) {
      const files = readdirSync(p);

      files.forEach((file) => {
        const source = path.resolve(p, file);
        const destPath = path.resolve(
          dest,
          prefix + (prefix.length > 0 ? "_" : "") + path.basename(file)
        );

        if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
        if (statSync(source).isDirectory())
          return copyDir(
            source,
            prefix + (prefix.length > 0 ? "_" : "") + file
          );

        let code = readFileSync(source, "utf-8");

        // Flatten all #include statements
        let newCode = "";

        code.split("\n").forEach((line) => {
          if (line.trim().startsWith("#include") && line.includes('"')) {
            const file = line.replace("#include", "").trim();

            const newPath = file
              .replaceAll('"duktape.h', "lib_duktape_duktape.h")
              .replaceAll('"duk_config.h', "lib_duktape_duk_config.h")
              .replaceAll('"', "")
              .replace("../", "")
              .replace("./", prefix + (prefix.length > 0 ? "_" : ""))
              .replaceAll("/", "_");

            newCode += `#include "${newPath}"\n`;
          } else newCode += line + "\n";
        });

        writeFileSync(destPath, newCode, "utf-8");
      });
    }

    copyDir(dir, "");

    /*function copyDir(src: string) {
      const files = readdirSync(src);

      files.forEach((file) => {
        const source = path.resolve(src, file);
        const destPath = path.resolve(dest, file);

        if (!existsSync(dest)) mkdirSync(dest, { recursive: true });

        if (statSync(source).isDirectory()) return copyDir(source);

        let code = readFileSync(source, "utf-8");

        // Flatten all #include statements
        let newCode = "";

        code.split("\n").forEach((line) => {
          if (line.trim().startsWith("#include") && line.includes("./")) {
            const file = line.replace("#include", "").trim();

            const newPath = path.basename(file.replaceAll('"', ""));

            newCode += `#include "${newPath}"\n`;
          } else newCode += line + "\n";
        });

        writeFileSync(destPath, newCode, "utf-8");
      });
    }

    copyDir(dir);*/
  }

  private buildRuntime() {
    dlog("Building runtime...");

    const source = Runtime(
      escapeRawCode(readFileSync(this.compiledFilePath, "utf-8")),
      this.transforms.cImports,
      this.transforms.cRegistrations
    );

    writeFileSync(
      path.resolve(this.config.output, "runtime/runtime.ino"),
      source,
      "utf-8"
    );

    this.checksums["runtime"] = this.checksum(source);
  }

  private async compileImage() {
    dlog("Compiling image...");

    if (
      this.checkChecksum(
        "runtime",
        readFileSync(
          path.resolve(this.config.output, "runtime/runtime.ino"),
          "utf-8"
        )
      ) &&
      !process.env.DISABLE_CHECKSUM
    ) {
      this.logger.log("Compiled code is up to date.");
      return;
    }

    process.stdout.write(chalk.green("●") + " ");

    const proc = spawn(
      `${BIN_DIR}/arduino-cli compile --fqbn ${this.config.board}:FlashMode=qio,UploadSpeed=115200,PartitionScheme=huge_app --export-binaries --build-path=${this.imageDirPath} ${this.runtimeDirPath}`,
      {
        shell: true,
      }
    );

    await new Promise<void>((res) => {
      proc.stdout.on("data", (data) => {
        const str = data.toString();

        if (!str.includes("\n")) return process.stdout.write(str);

        process.stdout.write(str.split("\n").join(`\n${chalk.green("●")} `));
      });

      proc.stderr.on("data", (data) => {
        process.stdout.write(data);
      });

      proc.on("exit", (code) => {
        if (code !== 0) {
          console.error("Failed to compile image.");
          process.exit(1);
        }

        res();
      });
    });
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

  loadChecksums() {
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

  private transformCImports(code: string) {
    const importRegex = /import[^"']*["'][^"']+["']/g;
    const importMatches = code.match(importRegex) ?? [];

    const imports = importMatches.map((match) => match.trim());
    const splitCode = code.split(importRegex);

    let newCode = "";

    for (let i = 0; i < splitCode.length; i++) {
      newCode += splitCode[i];

      if (i < imports.length && imports[i].includes("bind:")) {
        const parseRegex = /import([^"']*)from["']([^"']+)["']/gm;

        const match = parseRegex.exec(imports[i]) ?? [];

        this.transforms.cImports[match[1].trim()] = match[2]
          .trim()
          .split("bind:")[1];
      }
    }

    return newCode;
  }

  private transformCRegistrations(code: string) {
    const useCFunctionRegex = /useCFunction\(([^,]*)[,\s]*(["'].*?["'])\)/gm;
    const splitRegex = /useCFunction\([^,]*[,\s]*["'].*?["']\)/g;

    const matches = code.match(useCFunctionRegex) ?? [];
    const splitCode = code.split(splitRegex);

    let newCode = "";

    for (let i = 0; i < splitCode.length; i++) {
      newCode += splitCode[i];

      if (i < matches.length) {
        const match =
          /useCFunction\(([^,]*)[,\s]*(["'].*?["'])\)/gm.exec(matches[i]) ?? [];

        const args = match[2]
          .split(",")
          .map((a) => a.trim().replace(/["']([^"']*)["']/g, "$1"));
        const id = match[1].replace(".", "_");

        this.transforms.cRegistrations[id] = {
          source: match[1],
          ret: args[0],
          args: args.slice(1),
        };

        newCode += `_cfn${id};`;
      }
    }

    return newCode;
  }

  private copyCImports() {
    const files = Object.entries(this.transforms.cImports)
      .map(([k, v]) => [v, v.replace(/(.*)\.h/gm, "$1.cpp")])
      .flat();

    files.forEach((file) => {
      const source = path.resolve(
        process.cwd(),
        path.dirname(this.config.entrypoint),
        file
      );
      const dest = path.resolve(this.runtimeDirPath, path.basename(file));

      if (!existsSync(source)) {
        console.error(`File not found: ${source}`);
        process.exit(1);
      }

      if (!existsSync(path.dirname(dest)))
        mkdirSync(path.dirname(dest), { recursive: true });

      copyFileSync(source, dest);
    });
  }
}
