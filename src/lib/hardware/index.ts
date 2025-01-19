import type { PinMode, PinState } from "../../types/lib/hardware";

declare const board: {
  pins: {
    setMode: (mode: 0 | 1 | PinMode) => void;
    setState: (value: 0 | 1 | boolean | PinState) => void;
  }[];
};

export { board };
