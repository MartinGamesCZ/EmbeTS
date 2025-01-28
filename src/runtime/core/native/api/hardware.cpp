#include "./hardware.h"

#include "../lib/duktape/duktape.h"
#include <Arduino.h>

static duk_ret_t impl_runtime_native_hardware_pinmode(duk_context *ctx) {
  int pin = duk_require_int(ctx, 0);
  int mode = duk_require_int(ctx, 1);

  pinMode(pin, mode);

  return 0;
}

static duk_ret_t impl_runtime_native_hardware_dwrite(duk_context *ctx) {
  int pin = duk_require_int(ctx, 0);
  int state = duk_require_int(ctx, 1);

  digitalWrite(pin, state);

  return 0;
}

static duk_ret_t impl_runtime_native_hardware_dread(duk_context *ctx) {
  int pin = duk_require_int(ctx, 0);

  int value = digitalRead(pin);
  duk_push_int(ctx, value);

  return 1;
}

void register_runtime_native_hardware(duk_context *ctx) {
  duk_push_object(ctx);

  duk_push_c_function(ctx, impl_runtime_native_hardware_pinmode, DUK_VARARGS);
  duk_put_prop_string(ctx, -2, "setMode");

  duk_push_c_function(ctx, impl_runtime_native_hardware_dwrite, DUK_VARARGS);
  duk_put_prop_string(ctx, -2, "setState");

  duk_push_c_function(ctx, impl_runtime_native_hardware_dread, DUK_VARARGS);
  duk_put_prop_string(ctx, -2, "getState");

  duk_put_global_string(ctx, "$__native_hardware_board");
}