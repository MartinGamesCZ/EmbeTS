import { _, _function, _quot, _transform } from "../..";
import { NativeFunction } from "../../native_function";

const IMPL_MODE = _function(
  "duk_ret_t",
  "impl_runtime_native_pin_mode",
  {
    "*ctx": "duk_context",
  },
  [
    _("int pin = duk_require_int(ctx, 0)"),
    _("int mode = duk_require_int(ctx, 1)"),
    _("pinMode(pin, mode)"),
    _(
      'hardwareLog((char*)("Pin mode set " + String(mode) + " on pin " + String(pin)).c_str())'
    ),
    _("return 0"),
  ],
  true
);

const IMPL_D_WRITE = _function(
  "duk_ret_t",
  "impl_runtime_native_pin_dwrite",
  {
    "*ctx": "duk_context",
  },
  [
    _("int pin = duk_require_int(ctx, 0)"),
    _("int value = duk_require_int(ctx, 1)"),
    _("digitalWrite(pin, value)"),
    _(
      'hardwareLog((char*)("Pin state set " + String(value) + " on pin " + String(pin)).c_str())'
    ),
    _("return 0"),
  ],
  true
);

export function NativeCoreFnPinMode() {
  return _transform(
    NativeFunction({
      1: "impl_runtime_native_pin_mode",
      2: "DUK_VARARGS",
      3: _quot("$__native_pin_mode"),
    }),
    {}
  );
}

export function NativeCoreFnPinDWrite() {
  return _transform(
    NativeFunction({
      1: "impl_runtime_native_pin_dwrite",
      2: "DUK_VARARGS",
      3: _quot("$__native_pin_dwrite"),
    }),
    {}
  );
}

export function NativeCoreImplPinMode() {
  return _transform(IMPL_MODE, {});
}

export function NativeCoreImplPinDWrite() {
  return _transform(IMPL_D_WRITE, {});
}
