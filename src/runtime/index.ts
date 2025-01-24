import ApiCoreBoard from "./core/api/board";
import ApiCoreConsole from "./core/api/console";
import ApiCorePerformance from "./core/api/performance";
import ApiCoreTimers from "./core/api/timers";
import { NativeCoreFnLog, NativeCoreImplLog } from "./core/native/log";
import {
  NativeCoreFnPerformanceNow,
  NativeCoreImplPerformanceNow,
} from "./core/native/performance";
import {
  NativeCoreFnPinDWrite,
  NativeCoreFnPinMode,
  NativeCoreImplPinDWrite,
  NativeCoreImplPinMode,
} from "./core/native/pin";
import JsUtilsFnErrorCreator from "./js_utils/error_creator";
import JsUtilsFnGlobal from "./js_utils/global";
import JsUtilsFnLoop from "./js_utils/loop";
import NativeUtilsFnLog from "./native_utils/log";

const INCLUDES = ["duktape.h", "Arduino.h"];

const NATIVE_UTILS_FUNCTIONS = [NativeUtilsFnLog()];
const NATIVE_CORE_FUNCTIONS = [
  NativeCoreFnLog(),
  NativeCoreFnPinMode(),
  NativeCoreFnPinDWrite(),
  NativeCoreFnPerformanceNow(),
];
const NATIVE_CORE_IMPLEMENTATIONS = [
  NativeCoreImplLog(),
  NativeCoreImplPinMode(),
  NativeCoreImplPinDWrite(),
  NativeCoreImplPerformanceNow(),
];

const ENTRYPOINT = _function("void", "entrypoint", {}, [
  _("Serial.begin(115200)"),
  _('bootLog("EmbeTS Runtime booting...")'),
  _("runtime_setup()"),
  _('runtimeLog("EmbeTS Runtime ready.")'),
  _("runtime_eval(PROGRAM, false)"),
]);

const RUNTIME_SETUP = _function("void", "runtime_setup", {}, [
  _("ctx = duk_create_heap_default()"),
  _(
    'xTaskCreatePinnedToCore(BridgeTaskImpl, "BridgeTask", 10000, NULL, 1, &BridgeTask, 0)'
  ),
  _(NATIVE_CORE_FUNCTIONS),
]);

const RUNTIME_EVAL = _function(
  "void",
  "runtime_eval",
  {
    "*code": "const char",
    suppressLog: "bool",
  },
  [
    //_('Serial.printf("\\n>>> Evaluating: %s\\n", code)'),
    _if("!suppressLog", [_('runtimeLog("Evaluating code...\\n")')]),
    _("duk_push_string(ctx, code)"),
    _("duk_int_t rc = duk_peval(ctx)"),
    _if("rc != 0", [
      _("duk_safe_to_stacktrace(ctx, -1)"),
      _('errorLog("", false)'),
      _('Serial.printf("%s\\n", duk_safe_to_string(ctx, -1))'),
    ]),
    //_("String res = duk_get_string(ctx, -1)"),
    //_('Serial.printf("\\n>>> Result: %s\\n", res ? res : "null")'),
    _("duk_pop(ctx)"),
  ]
);

const RUNTIME = [
  _includes(),
  _program(),
  _(),
  _("duk_context *ctx"),
  _("TaskHandle_t BridgeTask"),
  _function(
    "void",
    "BridgeTaskImpl",
    {
      parameter: "void *",
    },
    [
      _("Serial.write('\\x00')"),
      _("Serial.write('\\x01')"),
      _("Serial.write('\\x01')"),
      _("Serial.write('\\x77')"),
      _("delay(200)"),
      _("while (true) {"),
      _if("Serial.available()", [
        _("String cmd = Serial.readStringUntil('\\x77')"),
        _if('cmd.startsWith("\\x00\\x01")', [
          _("cmd = cmd.substring(2)"),
          _if('cmd == "\\x03"', [_("ESP.restart()")]),
          _if('cmd == "\\x04"', [
            _('Serial.write("\\x01\\x00\\x00\\x77")'),
            _("String code = Serial.readStringUntil('\\x00\\x01\\x05')"),
            _("runtime_eval(code.c_str(), false)"),
          ]),
        ]),
      ]),
      _("runtime_eval(\"if (typeof ___loop != 'undefined') ___loop()\", true)"),
      _("delay(10)"),
      _("}"),
    ]
  ),
  _(NATIVE_UTILS_FUNCTIONS),
  _(NATIVE_CORE_IMPLEMENTATIONS),
  _(RUNTIME_SETUP),
  _(RUNTIME_EVAL),
  _(ENTRYPOINT),
  _function("void", "setup", {}, [_("entrypoint()")]),
  _function("void", "loop", {}, [
    //_('Serial.println("EmbeTS Runtime running...")'),
    _("delay(1000)"),
  ]),
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
const APIS = [
  ApiCoreConsole(),
  ApiCoreBoard(),
  ApiCorePerformance(),
  ApiCoreTimers(),
];
const JS_UTILS = [
  // Global needs to be first
  // ---------------------------
  JsUtilsFnGlobal(),
  // ---------------------------
  JsUtilsFnLoop(),
  JsUtilsFnErrorCreator(),
];

export function Api() {
  return _([_transform(APIS, {}), _transform(JS_UTILS, {})]);
}
