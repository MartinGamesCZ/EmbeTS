import { _, _function, _quot, _transform } from "../..";
import { NativeFunction } from "../../native_function";

const IMPL = _function(
  "duk_ret_t",
  "impl_runtime_native_log",
  {
    "*ctx": "duk_context",
  },
  [
    _('duk_push_string(ctx, " ")'),
    _("duk_insert(ctx, 0)"),
    _("duk_join(ctx, duk_get_top(ctx) - 1)"),
    _('Serial.printf("%s", duk_to_string(ctx, -1))'),
    _("return 0"),
  ],
  true
);

export function NativeCoreFnLog() {
  return _transform(
    NativeFunction({
      1: "impl_runtime_native_log",
      2: "DUK_VARARGS",
      3: _quot("$__native_log"),
    }),
    {}
  );
}

export function NativeCoreImplLog() {
  return _transform(IMPL, {});
}
