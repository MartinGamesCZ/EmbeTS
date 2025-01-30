declare const $__native_events_fire: (id: number) => void;
declare const ___global: {
  events: {
    id: number;
    once: boolean;
    shouldRemove: boolean;
    callback: () => void;
  }[];
};

function IMPL() {
  function $__native_events_fire(id: number) {
    ___global.events = ___global.events.filter((event) => {
      if (event.shouldRemove) return false;

      if (event.id === id) {
        event.callback();
        return !event.once;
      }

      return true;
    });
  }

  function $__js_events_register(
    id: number,
    once: boolean,
    callback: () => void
  ) {
    if (!___global.events) ___global.events = [];

    ___global.events.push({
      id: id,
      once: once,
      callback: callback,
      shouldRemove: false,
    });
  }

  function $__js_events_remove(id: number) {
    if (!___global.events) ___global.events = [];

    for (let i = 0; i < ___global.events.length; i++) {
      if (___global.events[i].id === id) {
        ___global.events[i].shouldRemove = true;
      }
    }
  }
}

export default function ApiCoreEvents() {
  const matched = IMPL.toString().match(/function[^{]+\{([\s\S]*)\}$/);

  if (!matched) {
    throw new Error("Failed to parse core events implementation.");
  }

  return matched[1];
}
