declare function $__native_performance_now(): number;
declare const ___global: {
  timers?: {
    id: number;
    type: "timeout" | "interval";
    timeout: number;
    lastCalled: number;
    callback: () => void;
  }[];
};

function IMPL() {
  function setTimeout(cb: () => void, t: number): number {
    if (!___global.timers) ___global.timers = [];

    const id = Math.floor(Math.random() * 1000000) % 1000000;

    ___global.timers.push({
      id: id,
      type: "timeout",
      timeout: t,
      lastCalled: $__native_performance_now(),
      callback: cb,
    });

    return id;
  }

  function setInterval(cb: () => void, t: number): number {
    if (!___global.timers) ___global.timers = [];

    const id = Math.floor(Math.random() * 1000000) % 1000000;

    ___global.timers.push({
      id: id,
      type: "interval",
      timeout: t,
      lastCalled: $__native_performance_now(),
      callback: cb,
    });

    return id;
  }

  function clearTimeout(id: number) {
    if (!___global.timers) return;

    for (let i = 0; i < ___global.timers.length; i++) {
      if (___global.timers[i].id === id) {
        ___global.timers.splice(i, 1);
        return;
      }
    }
  }

  function clearInterval(id: number) {
    clearTimeout(id);
  }
}

export default function ApiCoreTimers() {
  const matched = IMPL.toString().match(/function[^{]+\{([\s\S]*)\}$/);

  if (!matched) {
    throw new Error("Failed to parse core timers implementation.");
  }

  return matched[1];
}
