import { _, _function, _quot, _transform } from "../..";
import { NativeFunction } from "../../native_function";

const IMPL = _function(
  "duk_ret_t",
  "impl_runtime_native_performance_now",
  {
    "*ctx": "duk_context",
  },
  [_("duk_push_number(ctx, (double)millis())"), _("return 1")],
  true
);

export function NativeCoreFnPerformanceNow() {
  return _transform(
    NativeFunction({
      1: "impl_runtime_native_performance_now",
      2: "DUK_VARARGS",
      3: _quot("$__native_performance_now"),
    }),
    {}
  );
}

export function NativeCoreImplPerformanceNow() {
  return _transform(IMPL, {});
}
