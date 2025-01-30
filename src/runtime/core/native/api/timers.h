#ifndef EMBETS_API_TIMERS
#define EMBETS_API_TIMERS

#include "../lib/duktape/duktape.h"

void register_runtime_native_timers(duk_context *ctx);

#endif