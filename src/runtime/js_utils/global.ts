import { _transform } from "..";

function IMPL() {
  const ___global = {};
}

export default function JsUtilsFnGlobal() {
  const matched = IMPL.toString().match(/function[^{]+\{([\s\S]*)\}$/);

  if (!matched) {
    throw new Error("Failed to parse core global implementation.");
  }

  return matched[1];
}
