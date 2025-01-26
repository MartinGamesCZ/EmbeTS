#ifndef EMBETS_LOG
#define EMBETS_LOG

#include <Arduino.h>

void bootLog(const char *msg);
void runtimeLog(const char *msg);
void errorLog(String msg, bool logMsg);
void hardwareLog(const char *msg);

#endif