#include "./process.h"

#include "../fs/fs.h"
#include "../lib/duktape/duktape.h"

#include <Arduino.h>

static duk_ret_t impl_runtime_native_process_env(duk_context *ctx) {
  String envJson = fs_read("/boot/env.json");

  if (envJson == "")
    envJson = "{}";

  duk_push_string(ctx, envJson.c_str());

  return 1;
}

void register_runtime_native_process(duk_context *ctx) {
  duk_push_object(ctx);

  duk_push_c_function(ctx, impl_runtime_native_process_env, DUK_VARARGS);
  duk_put_prop_string(ctx, -2, "env");

  duk_put_global_string(ctx, "$__native_process");
}