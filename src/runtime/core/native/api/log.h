#ifndef EMBETS_API_LOG
#define EMBETS_API_LOG

#include "../lib/duktape/duktape.h"
#include <Arduino.h>

void register_runtime_native_log(duk_context *ctx);

#endif