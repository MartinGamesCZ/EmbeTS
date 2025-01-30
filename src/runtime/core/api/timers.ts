declare function $__js_events_register(
  id: number,
  once: boolean,
  cb: () => any
): void;
declare function $__js_events_remove(id: number): void;
declare const $__native_timers: {
  setInterval: (t: number) => number;
  clear: (id: number) => void;
};

function IMPL() {
  function setInterval(cb: () => void, t: number): number {
    const id = $__native_timers.setInterval(t);

    $__js_events_register(id, false, cb);

    return id;
  }

  function setTimeout(cb: () => void, t: number): number {
    const id = setInterval(() => {
      cb();
      clearInterval(id);
    }, t);

    return id;
  }

  function clearInterval(id: number): void {
    $__native_timers.clear(id);
    $__js_events_remove(id);
  }

  function clearTimeout(id: number): void {
    clearInterval(id);
  }
}

export default function ApiCoreTimers() {
  const matched = IMPL.toString().match(/function[^{]+\{([\s\S]*)\}$/);

  if (!matched) {
    throw new Error("Failed to parse core timers implementation.");
  }

  return matched[1];
}
