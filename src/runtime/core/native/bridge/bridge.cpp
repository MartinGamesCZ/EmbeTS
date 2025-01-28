#include "./bridge.h"

#include <Arduino.h>
#include <HardwareSerial.h>

const String _bridge_seq_start = "$$$EMBETS$STARTSEQ$$$";
const String _bridge_seq_end = "$$$EMBETS$ENDSEQ$$$";

bool bridge_pckt_is(String pckt) {
  return pckt.indexOf(_bridge_seq_start) >= 0 &&
         pckt.indexOf(_bridge_seq_end) >= 0;
}

String bridge_pckt_read(String data) {
  data = data.substring(data.indexOf(_bridge_seq_start) +
                            _bridge_seq_start.length() + 1,
                        data.indexOf(_bridge_seq_end));

  if (data.endsWith("$")) {
    data = data.substring(0, data.length() - 1);
  }

  return data;
}

String bridge_pckt_extract_command(String data) {
  return data.substring(0, data.indexOf("$"));
}

int bridge_pckt_extract_length(String data) {
  String cmd = bridge_pckt_extract_command(data);

  data.replace(cmd + "$", "");

  return data.substring(0, data.indexOf("$")).toInt();
}

String bridge_pckt_extract_data(String data) {
  String cmd = bridge_pckt_extract_command(data);
  int length = bridge_pckt_extract_length(data);

  return data.substring(cmd.length() + String(length).length() + 2);
}

void bridge_init() { Serial.begin(115200); }

void bridge_wsequence_pckt(const char *code) {
  Serial.print("$$$EMBETS$STARTSEQ$$$");
  Serial.print(code);
  Serial.print("$$$EMBETS$ENDSEQ$$$");
}

void bridge_wsequence_ready() { bridge_wsequence_pckt("$EVTREADY$"); }
void bridge_wsequence_flashed() { bridge_wsequence_pckt("$EVTFLASHED$"); }
void bridge_wsequence_flasherr() { bridge_wsequence_pckt("$EVTFLASHERR$"); }