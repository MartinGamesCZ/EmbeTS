import path from "path";
import ApiCoreBoard from "./core/api/board";
import ApiCoreConsole from "./core/api/console";
import ApiCorePerformance from "./core/api/performance";
import ApiCoreTimers from "./core/api/timers";
import { NativeCoreFnLog, NativeCoreImplLog } from "./core/o_native/log";
import {
  NativeCoreFnPerformanceNow,
  NativeCoreImplPerformanceNow,
} from "./core/o_native/performance";
import {
  NativeCoreFnPinDRead,
  NativeCoreFnPinDWrite,
  NativeCoreFnPinMode,
  NativeCoreImplPinDRead,
  NativeCoreImplPinDWrite,
  NativeCoreImplPinMode,
} from "./core/o_native/pin";
import JsUtilsFnErrorCreator from "./js_utils/error_creator";
import JsUtilsFnGlobal from "./js_utils/global";
import JsUtilsFnLoop from "./js_utils/loop";
//import NativeUtilsFnLog from "./native_utils/log";
import {
  NativeCoreFnNetHttpReqGet,
  NativeCoreFnNetWifiConnect,
  NativeCoreImplNetHttpReqGet,
  NativeCoreImplNetWifiConnect,
} from "./core/o_native/net";
import ApiCoreNet from "./core/api/net";

const INCLUDES = [
  "duktape.h",
  "Arduino.h",
  "WiFi.h",
  "HTTPClient.h",
  "FS.h",
  "LittleFS.h",
];

const NATIVE_UTILS_FUNCTIONS = [
  /*NativeUtilsFnLog()*/
];
const NATIVE_CORE_FUNCTIONS = [
  NativeCoreFnLog(),
  NativeCoreFnPinMode(),
  NativeCoreFnPinDWrite(),
  NativeCoreFnPinDRead(),
  NativeCoreFnPerformanceNow(),
  NativeCoreFnNetWifiConnect(),
  NativeCoreFnNetHttpReqGet(),
];
const NATIVE_CORE_IMPLEMENTATIONS = [
  NativeCoreImplLog(),
  NativeCoreImplPinMode(),
  NativeCoreImplPinDWrite(),
  NativeCoreImplPinDRead(),
  NativeCoreImplPerformanceNow(),
  NativeCoreImplNetWifiConnect(),
  NativeCoreImplNetHttpReqGet(),
];

const RUNTIME = [
  _includes(),
  "$2",
  _("HTTPClient http"),
  _("$3"),
  //_(NATIVE_UTILS_FUNCTIONS),
  _(NATIVE_CORE_IMPLEMENTATIONS),
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

  /*return _transform(RUNTIME, {
    1: code,
    2: Object.entries(cImports)
      .map(([k, v]) => `#include "./${path.basename(v)}"`)
      .join("\n"),
    3: nativeBindingsImpl.join("\n"),
    4: nativeBindingsDef.join("\n"),
  });*/

  return `#include "main.h"
#include <Arduino.h>

void setup() {
  app_main();
}

void loop() {
}
`;
}

/*export function _program() {
  return `const PROGMEM char PROGRAM[] = R"$1";`;
}*/

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
  //ApiCoreBoard(),
  //ApiCorePerformance(),
  //ApiCoreTimers(),
  //ApiCoreNet(),
];
const JS_UTILS: any = [
  // Global needs to be first
  // ---------------------------
  //JsUtilsFnGlobal(),
  // ---------------------------
  //JsUtilsFnLoop(),
  //JsUtilsFnErrorCreator(),
];

export function Api() {
  return _([_transform(APIS, {}), _transform(JS_UTILS, {})]);
}
