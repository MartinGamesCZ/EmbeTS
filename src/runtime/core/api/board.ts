import type { PinMode, PinState } from "../../../types/lib/hardware";

declare function $__native_pin_mode(pin: number | string, mode: number): void;
declare function $__native_pin_dwrite(
  pin: number | string,
  value: number
): void;

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
}

export default function ApiCoreBoard() {
  const matched = IMPL.toString().match(/function[^{]+\{([\s\S]*)\}$/);

  if (!matched) {
    throw new Error("Failed to parse core board implementation.");
  }

  return matched[1];
}
