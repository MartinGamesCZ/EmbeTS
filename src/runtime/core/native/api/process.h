#ifndef EMBETS_API_PROCESS
#define EMBETS_API_PROCESS

#include "../lib/duktape/duktape.h"

void register_runtime_native_process(duk_context *ctx);

#endif