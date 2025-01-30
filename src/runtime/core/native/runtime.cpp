#include "./runtime.h"
#include "./api/hardware.h"
#include "./api/log.h"
#include "./api/net.h"
#include "./api/process.h"
#include "./api/timers.h"
#include "./bridge/bridge.h"
#include "./fs/fs.h"
#include "./lib/duktape/duktape.h"
#include "./net/net.h"
#include "./utils/log.h"
#include <Arduino.h>
#include <HardwareSerial.h>

duk_context *ctx;

duk_ret_t native_print(duk_context *ctx) {
  String msg = duk_to_string(ctx, 0);
  Serial.println(msg);
  return 0;
}

void runtime_setup() {
  ctx = duk_create_heap_default();

  bridge_init();

  bootLog("EmbeTS Runtime booting...");

  fs_init();
  net_init();

  // TODO: Create bridge task
  // TODO: Register native functions
  // TODO: Register native bindings

  register_runtime_native_log(ctx);
  register_runtime_native_hardware(ctx);
  register_runtime_native_net(ctx);
  register_runtime_native_process(ctx);
  register_runtime_native_timers(ctx);
}

void runtime_eval(const char *code, bool suppressLog) {
  if (!suppressLog)
    runtimeLog("Evaluating code...\n");

  duk_push_string(ctx, code);
  duk_int_t returnCode = duk_peval(ctx);

  if (returnCode != 0) {
    duk_safe_to_stacktrace(ctx, -1);

    errorLog("", false);
    Serial.println(duk_safe_to_string(ctx, -1));
  }

  duk_pop(ctx);
}