declare const Duktape: any;

import { _transform } from "..";

function IMPL() {
  // @ts-expect-error
  Duktape.errCreate = function (e) {
    var stack = e.stack
      .replace(
        /([a-zA-Z0-9\.\-\_\/]*\/duktape.c:[0-9]*)/gm,
        "/boot/img/embets/runtime/program.js"
      )
      .replace(
        /\(eval:([0-9]*)\)/gm,
        "(/boot/img/embets/runtime/program.js:$1)"
      );
    e.stack = stack;
    return e;
  };
}

export default function JsUtilsFnErrorCreator() {
  const matched = IMPL.toString().match(/function[^{]+\{([\s\S]*)\}$/);

  if (!matched) {
    throw new Error("Failed to parse core board implementation.");
  }

  return matched[1];
}
