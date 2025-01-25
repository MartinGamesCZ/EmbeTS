import path from "path";
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
  NativeCoreFnPinDRead,
  NativeCoreFnPinDWrite,
  NativeCoreFnPinMode,
  NativeCoreImplPinDRead,
  NativeCoreImplPinDWrite,
  NativeCoreImplPinMode,
} from "./core/native/pin";
import JsUtilsFnErrorCreator from "./js_utils/error_creator";
import JsUtilsFnGlobal from "./js_utils/global";
import JsUtilsFnLoop from "./js_utils/loop";
import NativeUtilsFnLog from "./native_utils/log";
import {
  NativeCoreFnNetWifiConnect,
  NativeCoreImplNetWifiConnect,
} from "./core/native/net";
import ApiCoreNet from "./core/api/net";

const INCLUDES = ["duktape.h", "Arduino.h", "WiFi.h"];

const NATIVE_UTILS_FUNCTIONS = [NativeUtilsFnLog()];
const NATIVE_CORE_FUNCTIONS = [
  NativeCoreFnLog(),
  NativeCoreFnPinMode(),
  NativeCoreFnPinDWrite(),
  NativeCoreFnPinDRead(),
  NativeCoreFnPerformanceNow(),
  NativeCoreFnNetWifiConnect(),
];
const NATIVE_CORE_IMPLEMENTATIONS = [
  NativeCoreImplLog(),
  NativeCoreImplPinMode(),
  NativeCoreImplPinDWrite(),
  NativeCoreImplPinDRead(),
  NativeCoreImplPerformanceNow(),
  NativeCoreImplNetWifiConnect(),
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
  _("$4"),
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
  "$2",
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
  _("$3"),
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

export default function Runtime(
  code: string,
  cImports: { [key: string]: string },
  cRegistrations: {
    [key: string]: { source: string; ret: string; args: string[] };
  }
) {
  const nativeBindings = Object.entries(cRegistrations).map(([k, v]) =>
    generateNativeBinding(v.source.split(".")[1], k, v.ret, v.args)
  );

  const nativeBindingsImpl = nativeBindings.map((nb) => nb[0]);
  const nativeBindingsDef = nativeBindings.map((nb) => nb[1]);

  return _transform(RUNTIME, {
    1: code,
    2: Object.entries(cImports)
      .map(([k, v]) => `#include "./${path.basename(v)}"`)
      .join("\n"),
    3: nativeBindingsImpl.join("\n"),
    4: nativeBindingsDef.join("\n"),
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

// --------
export function generateNativeBinding(
  cfnName: string,
  jsfnName: string,
  ret: string,
  args: string[]
) {
  const typeMappings: any = {
    int: "number",
  };

  return [
    _transform(
      _function(
        "duk_ret_t",
        "impl_runtime_native_" + jsfnName,
        { "*ctx": "duk_context" },
        [
          ...args.map((a, i) => _(`${a} p${i} = duk_require_${a}(ctx, ${i})`)),
          _(
            `${ret} res = ${cfnName}(${args.map((_, i) => `p${i}`).join(", ")})`
          ),
          _(`duk_push_${typeMappings[ret]}(ctx, (${ret})res)`),
          _("return 1"),
        ]
      ),
      {}
    ),
    _transform(
      [
        _(
          "duk_push_c_function(ctx, impl_runtime_native_" +
            jsfnName +
            ", DUK_VARARGS)"
        ),
        _("duk_put_global_string(ctx, " + _quot(`_cfn${jsfnName}`) + ")"),
      ],
      {}
    ),
  ];
}

// --------------------- API ---------------------
const APIS = [
  ApiCoreConsole(),
  ApiCoreBoard(),
  ApiCorePerformance(),
  ApiCoreTimers(),
  ApiCoreNet(),
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
