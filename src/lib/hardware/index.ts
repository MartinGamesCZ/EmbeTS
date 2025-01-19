declare enum PinMode {
  INPUT = 0,
  OUTPUT = 1,
}
declare enum PinState {
  LOW = 0,
  HIGH = 1,
}

declare const board: {
  pins: {
    setMode: (mode: 0 | 1 | PinMode) => void;
    setState: (value: 0 | 1 | boolean | PinState) => void;
  }[];
};

export { board, PinMode, PinState };
