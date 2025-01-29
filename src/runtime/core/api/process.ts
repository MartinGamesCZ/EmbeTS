declare const $__native_process: {
  env: () => string;
};

function IMPL() {
  const $$_process_env = JSON.parse($__native_process.env());

  const process = {
    env: $$_process_env,
  };
}

export default function ApiCoreProcess() {
  const matched = IMPL.toString().match(/function[^{]+\{([\s\S]*)\}$/);

  if (!matched) {
    throw new Error("Failed to parse core process implementation.");
  }

  return matched[1];
}
