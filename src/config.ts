import path from "path";
import { fileURLToPath } from "url";

export const DEBUG = process.env.DEBUG === "true";
export const BIN_DIR = path.resolve(import.meta.dirname, "../bin");

export const BOARDS = [
  {
    id: "builtin-ardu-esp32-wroom-da",
    name: "ESP32-WROOM-DA Module",
    fqbn: "esp32:esp32:esp32da",
  },
];
