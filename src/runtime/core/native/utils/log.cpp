#include "./log.h"
#include <Arduino.h>
#include <HardwareSerial.h>

void bootLog(const char *msg) {
  Serial.print("\e[30;47;1m BOOT \e[0m      ");
  Serial.println(msg);
}

void runtimeLog(const char *msg) {
  Serial.printf("\e[30;44;1m RUNTIME \e[0m   %s\n", msg);
}

void errorLog(String msg, bool logMsg) {
  Serial.print("\e[30;41;1m ERROR \e[0m ");
  if (logMsg)
    Serial.println(msg);
}

void hardwareLog(const char *msg) {
  Serial.print("\e[30;43;1m HARDWARE \e[0m  ");
  Serial.println(msg);
}