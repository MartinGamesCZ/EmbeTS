declare const $__native_hardware_board: {
  setMode: (pin: number | string, mode: number) => void;
  setState: (pin: number | string, value: number) => void;
  getState: (pin: number | string) => number;
};

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

function IMPL() {
  const board = {
    pins: function (pin: number) {
      return {
        setMode: (mode: number) => {
          $__native_hardware_board.setMode(pin, mode);
        },
        setState: (value: number) => {
          $__native_hardware_board.setState(pin, value);
        },
        getState: () => {
          return $__native_hardware_board.getState(pin);
        },
      };
    },
  };

  const PinMode = {
    OUTPUT: 0x03,
    INPUT: 0x01,
    INPUT_PULLUP: 0x05,
    INPUT_PULLDOWN: 0x09,
  };

  const PinState = {
    LOW: 0x0,
    HIGH: 0x1,
  };
}

export default function ApiCoreBoard() {
  const matched = IMPL.toString().match(/function[^{]+\{([\s\S]*)\}$/);

  if (!matched) {
    throw new Error("Failed to parse core board implementation.");
  }

  return matched[1];
}
