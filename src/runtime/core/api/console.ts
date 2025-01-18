declare function $__native_log(message: string): void;

function IMPL() {
  const console = {
    write: $__native_log,
    log: $__core_console_log,
  };

  // @ts-expect-error
  function $__core_console_log(message) {
    $__native_log(message + "\n");
  }
}

export default function ApiCoreConsole() {
  const matched = IMPL.toString().match(/function[^{]+\{([\s\S]*)\}$/);

  if (!matched) {
    throw new Error("Failed to parse core console implementation.");
  }

  return matched[1];
}
