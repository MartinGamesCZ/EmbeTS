#include "./mod_log.h"

#include "../lib/duktape/duktape.h"
#include <Arduino.h>
#include <HardwareSerial.h>

duk_ret_t impl_runtime_native_log(duk_context *ctx) {
  duk_push_string(ctx, " ");
  duk_insert(ctx, 0);
  duk_join(ctx, duk_get_top(ctx) - 1);
  Serial.printf("%s", duk_to_string(ctx, -1));
  return 0;
}

void register_runtime_native_log(duk_context *ctx) {
  duk_push_c_function(ctx, impl_runtime_native_log, DUK_VARARGS);
  duk_put_global_string(ctx, "$__native_log");
}