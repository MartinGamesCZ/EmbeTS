import ApiCoreConsole from "./core/api/console";
import { NativeCoreFnLog, NativeCoreImplLog } from "./core/native/log";

const INCLUDES = ["duktape.h", "Arduino.h"];

const NATIVE_CORE_FUNCTIONS = [NativeCoreFnLog()];
const NATIVE_CORE_IMPLEMENTATIONS = [NativeCoreImplLog()];

const ENTRYPOINT = _function("void", "entrypoint", {}, [
  _("Serial.begin(115200)"),
  _('Serial.println("[boot] EmbeTS Runtime booting...")'),
  _("runtime_setup()"),
  _('Serial.println("[boot] Done.")'),
  _("runtime_eval(PROGRAM)"),
]);

const RUNTIME_SETUP = _function("void", "runtime_setup", {}, [
  _("ctx = duk_create_heap_default()"),
  _(NATIVE_CORE_FUNCTIONS),
]);

const RUNTIME_EVAL = _function(
  "void",
  "runtime_eval",
  {
    "*code": "const char",
  },
  [
    //_('Serial.printf("\\n>>> Evaluating: %s\\n", code)'),
    _("duk_push_string(ctx, code)"),
    _("duk_int_t rc = duk_peval(ctx)"),
    _if("rc != 0", [_("duk_safe_to_stacktrace(ctx, -1)")]),
    _else([_("duk_safe_to_string(ctx, -1)")]),
    _("String res = duk_get_string(ctx, -1)"),
    //_('Serial.printf("\\n>>> Result: %s\\n", res ? res : "null")'),
    _("duk_pop(ctx)"),
  ]
);

const RUNTIME = [
  _includes(),
  _program(),
  _(),
  _("duk_context *ctx"),
  _(),
  _(NATIVE_CORE_IMPLEMENTATIONS),
  _(RUNTIME_SETUP),
  _(RUNTIME_EVAL),
  _(ENTRYPOINT),
  _function("void", "setup", {}, [_("entrypoint()")]),
  _function("void", "loop", {}, []),
];

export default function Runtime(code: string) {
  return _transform(RUNTIME, {
    1: code,
  });
}

export function _program() {
  return `const PROGMEM char PROGRAM[] = R"$1";`;
}

function _includes() {
  return INCLUDES.map((i) => `#include <${i}>`).join("\n");
}

export function _(code?: string | string[]) {
  if (!code) return "";
  if (Array.isArray(code)) return code.join("\n");

  return `${code};`;
}

export function _function(
  type: "void" | "duk_ret_t",
  name: string,
  args: {
    [key: string]: string;
  },
  body: string[],
  isStatic: boolean = false
) {
  return `${isStatic ? "static " : ""}${type} ${name}(${Object.entries(args)
    .map(([k, v]) => `${v} ${k}`)
    .join(", ")}) \n{\n${body.join("\n")}\n}`;
}

export function _if(condition: string, body: string[]) {
  return `if (${condition}) {\n${body.join("\n")}\n}`;
}

export function _else(body: string[]) {
  return `else {\n${body.join("\n")}\n}`;
}

export function _transform(
  code: string | string[],
  args: { [key: string]: string }
) {
  return Object.entries(args).reduce(
    (acc, [k, v]) => {
      return acc.replace(new RegExp(`\\$${k}`, "g"), v);
    },
    Array.isArray(code) ? code.join("\n") : code
  );
}

export function _quot(str: string) {
  return `"${str}"`;
}

// --------------------- API ---------------------
const APIS = [ApiCoreConsole()];

export function Api() {
  return _transform(APIS, {});
}
