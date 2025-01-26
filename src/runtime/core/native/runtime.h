#ifndef EMBETS_RUNTIME
#define EMBETS_RUNTIME

#include "./lib/duktape/duktape.h"
#include "./utils/log.h"
#include <Arduino.h>

void runtime_setup();
void runtime_eval(const char *code, bool suppressLog);

#endif