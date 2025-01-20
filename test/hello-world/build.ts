import { readFileSync, watchFile } from "fs";
import { EmbedTSConsole, EmbeTSBuilder } from "../../src/index";
import path from "path";

const embets = new EmbeTSBuilder({
  entrypoint: "src/index.ts",
  output: "build",
  board: "esp32:esp32:esp32da",
  onlyJs: process.env.FLASH ? false : true,
});

embets.build();
if (process.env.FLASH) embets.upload("/dev/ttyUSB0");

const embedtsConsole = new EmbedTSConsole({
  port: "/dev/ttyUSB0",
  restartOnOpen: true,
});

embedtsConsole.attach(process.stdin, process.stdout);

embedtsConsole.on("ready", () => {
  if (process.env.FLASH) return;

  watchFile("src/index.ts", () => {
    console.log("[DEV] File changed, rebuilding...");
    embets.build();

    embedtsConsole.eval(
      readFileSync(path.join(import.meta.dirname, "build/compiled.js"), "utf-8")
    );
  });
});
