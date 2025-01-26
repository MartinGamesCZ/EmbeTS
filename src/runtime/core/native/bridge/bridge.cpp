#include "./bridge.h"

#include <Arduino.h>
#include <HardwareSerial.h>

const char _bridge_seq_start[] = {'\x00', '\x01'};
const char _bridge_seq_end = '\x77';

void bridge_init() { Serial.begin(115200); }

void bridge_wsequence_pckt(char code) {
  Serial.write(_bridge_seq_start, 2);
  Serial.write(code);
  Serial.write(_bridge_seq_end);
}

void bridge_wsequence_ready() { bridge_wsequence_pckt('\x01'); }

bool bridge_cmd_available() { return Serial.available(); }

String bridge_cmd_read() {
  String cmd = Serial.readStringUntil(_bridge_seq_end);

  if (!cmd.startsWith(_bridge_seq_start))
    return "";

  return cmd.substring(2);
}

String bridge_program_read() {
  bridge_wsequence_ready();

  String code = Serial.readStringUntil('\x00\x01\x05');

  return code;
}