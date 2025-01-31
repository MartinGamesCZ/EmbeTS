declare enum PinMode {
  OUTPUT = 0x03,
  INPUT = 0x01,
  INPUT_PULLUP = 0x05,
  INPUT_PULLDOWN = 0x09,
}
declare enum PinState {
  LOW = 0x0,
  HIGH = 0x1,
}

declare const board: {
  pins: (pin: number) => {
    setMode: (mode: 1 | 3 | 5 | 9 | PinMode) => void;
    setState: (value: 0 | 1 | boolean | PinState) => void;
    getState: () => 0 | 1;
    measurePulse: (state: 0 | 1 | PinState) => number;
    on: (e: "low" | "high", cb: () => any) => void;
  };
};

export { board, PinMode, PinState };
