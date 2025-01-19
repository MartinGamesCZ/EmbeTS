declare function $__native_performance_now(): number;

function IMPL() {
  const performance = {
    now: $__native_performance_now,
  };
}

export default function ApiCorePerformance() {
  const matched = IMPL.toString().match(/function[^{]+\{([\s\S]*)\}$/);

  if (!matched) {
    throw new Error("Failed to parse core performance implementation.");
  }

  return matched[1];
}
