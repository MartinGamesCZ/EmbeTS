declare function $__native_pin_mode(pin: number | string, mode: number): void;
declare function $__native_pin_dwrite(
  pin: number | string,
  value: number
): void;
declare enum PinMode {
  INPUT = 0,
  OUTPUT = 1,
}
declare enum PinState {
  LOW = 0,
  HIGH = 1,
}

function IMPL() {
  const board = {
    pins: new Proxy(
      {},
      {
        get(_, prop: string) {
          return {
            setMode: function (mode: 0 | 1 | PinMode) {
              $__native_pin_mode(parseInt(prop), mode);
            },
            setState: function (value: 0 | 1 | boolean | PinState) {
              $__native_pin_dwrite(
                parseInt(prop),
                typeof value == "number" ? value : value ? 1 : 0
              );
            },
          };
        },
      }
    ),
  };

  const PinMode = {
    INPUT: 0,
    OUTPUT: 1,
  };

  const PinState = {
    LOW: 0,
    HIGH: 1,
  };
}

export default function ApiCoreBoard() {
  const matched = IMPL.toString().match(/function[^{]+\{([\s\S]*)\}$/);

  if (!matched) {
    throw new Error("Failed to parse core board implementation.");
  }

  return matched[1];
}
