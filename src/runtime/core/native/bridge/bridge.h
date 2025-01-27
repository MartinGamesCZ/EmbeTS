#ifndef EMBETS_BRIDGE
#define EMBETS_BRIDGE

#include <Arduino.h>
#include <HardwareSerial.h>

void bridge_init();

void bridge_wsequence_ready();
void bridge_wsequence_flashed();

bool bridge_cmd_available();
String bridge_cmd_read();

String bridge_program_read();

#endif