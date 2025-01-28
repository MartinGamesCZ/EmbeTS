#ifndef EMBETS_BRIDGE
#define EMBETS_BRIDGE

#include <Arduino.h>
#include <HardwareSerial.h>

void bridge_init();

void bridge_wsequence_ready();
void bridge_wsequence_flashed();
void bridge_wsequence_flasherr();

bool bridge_pckt_is(String pckt);
String bridge_pckt_read(String data);
String bridge_pckt_extract_command(String data);
int bridge_pckt_extract_length(String data);
String bridge_pckt_extract_data(String data);

#endif