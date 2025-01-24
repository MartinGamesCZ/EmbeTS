import { _transform } from "..";

declare const ___global: {
  timers?: {
    type: "timeout" | "interval";
    timeout: number;
    lastCalled: number;
    callback: () => void;
  }[];
};
declare function $__native_performance_now(): number;

function IMPL() {
  function ___loop() {
    function now() {
      return $__native_performance_now();
    }

    if (!___global.timers) return;
    if (___global.timers.length === 0) return;

    const nowTime = now();

    for (let i = 0; i < ___global.timers.length; i++) {
      const timer = ___global.timers[i];

      if (nowTime - (timer.lastCalled ?? 0) >= timer.timeout) {
        timer.callback();

        if (timer.type === "timeout") {
          ___global.timers.splice(i, 1);
          i--;
        } else {
          timer.lastCalled = $__native_performance_now();
        }
      }
    }
  }
}

export default function JsUtilsFnLoop() {
  const matched = IMPL.toString().match(/function[^{]+\{([\s\S]*)\}$/);

  if (!matched) {
    throw new Error("Failed to parse core loop implementation.");
  }

  return matched[1];
}
