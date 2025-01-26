import { readdirSync, statSync, writeFileSync } from "fs";
import path from "path";

const target = path.join(process.cwd(), ".clangd");

const searchdest = [
  "/home/marti/.arduino15/packages/esp32/hardware/esp32/2.0.16",
];

const libs: string[] = [];

// Find all folders that contain a .h file
function findLibs(dir: string) {
  const files = readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (file.endsWith(".h")) {
      libs.push(dir);
      return;
    }
    if (statSync(filepath).isDirectory()) {
      findLibs(filepath);
    }
  }
}

searchdest.forEach((d) => findLibs(d));

const out = `
CompileFlags:
  Add:
    - "--target=avr"
    - "-mmcu=atmega328p"
${libs.map((l) => `    - "-I${l}"`).join("\n")}
    - "-I/home/marti/.arduino15/packages/esp32/hardware/esp32/2.0.16/tools/sdk/esp32/include"
    - "-I/home/marti/.arduino15/packages/esp32/hardware/esp32/2.0.16/variants/esp32"
    - "-I/usr/share/arduino/hardware/arduino/avr/cores/arduino"
    - "-I/usr/share/arduino/hardware/arduino/avr/variants/standard"
    - "-I/home/marti/Arduino/libraries"
    - "-I/home/marti/.arduino15/packages/esp32/hardware/esp32/2.0.16/tools/sdk/esp32/include/freertos/include"
`;

writeFileSync(target, out);
