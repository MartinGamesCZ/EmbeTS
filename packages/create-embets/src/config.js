export const BOARDS = [
  {
    id: "builtin-ardu-esp32-wroom-da",
    name: "ESP32-WROOM-DA Module",
    fqbn: "esp32:esp32:esp32da",
  },
];

export const CONFIG_TEMPLATE = {
  version: 1,
  name: "",
  board: "",
  entrypoint: "./src/index.ts",
  output: "./build",
};

export const DEPENDENCIES = ["embets@latest"];

export const EXAMPLE_TEMPLATE = `console.log("Hello, Embets! Running on your board.");

// If using 'dev' script, save changes and watch the magic happen!`;

export const PACKAGE_TEMPLATE = {
  name: "",
  module: "src/index.ts",
  type: "module",
  scripts: {
    flash: "embets flash",
    console: "embets console",
    dev: "embets watch",
  },
  devDependencies: {
    "@types/node": "latest",
  },
  peerDependencies: {
    typescript: "^5.0.0",
  },
  dependencies: {},
};
