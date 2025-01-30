#include "./main.h"

#include "./bridge/bridge.h"
#include "./event/event_loop.h"
#include "./fs/fs.h"
#include "./os/os.h"
#include "./runtime.h"
#include "./utils/log.h"
#include "HardwareSerial.h"
#include <Arduino.h>

TaskHandle_t LoopTask;

const char *EMBEDTS_START_SEQ = "$$$EMBETS$STARTSEQ$$$";
const char *EMBEDTS_END_SEQ = "$$$EMBETS$ENDSEQ$$$";

void app_program() {
  String program = fs_read("/boot/index.js");

  if (program == "") {
    errorLog("Program not found, please upload it.", true);
    return;
  }

  /*Serial.println(program);

  delay(500);*/

  runtime_eval(program.c_str(), false);
}

void app_loop(void *parameter) {
  bridge_wsequence_ready();
  delay(100);

  String buffer;
  buffer.reserve(1024);

  while (true) {
    if (Serial.available()) {
      String data = Serial.readStringUntil('\n');
      buffer += data;

      if (bridge_pckt_is(buffer)) {
        String packet = bridge_pckt_read(buffer);
        String cmd = bridge_pckt_extract_command(packet);

        if (cmd == "RESTART")
          os_restart();

        if (cmd == "FLASH") {
          int dataLength = bridge_pckt_extract_length(packet);
          String body = bridge_pckt_extract_data(packet);

          if (dataLength != body.length()) {
            errorLog("Data length mismatch.", true);
            buffer = "";

            bridge_wsequence_flasherr();

            continue;
          }

          bool fileWritten = fs_write("/boot/index.js", body);
          if (!fileWritten)
            errorLog("Failed to write program to file.", true);
          else {
            runtimeLog("Program updated.");
            bridge_wsequence_flashed();
            delay(100);
            os_restart();
          }
        }

        if (cmd == "ENV_VAR") {
          int dataLength = bridge_pckt_extract_length(packet);
          String body = bridge_pckt_extract_data(packet);

          if (dataLength != body.length()) {
            errorLog("Data length mismatch.", true);
            buffer = "";

            bridge_wsequence_flasherr();

            continue;
          }

          bool fileWritten = fs_write("/boot/env.json", body);
          if (!fileWritten)
            errorLog("Failed to write env vars to file.", true);
          else {
            runtimeLog("Env vars updated.");
            bridge_wsequence_flashed();
            delay(100);
            os_restart();
          }
        }

        buffer = "";
      }
    }

    delay(1);
  }
}

void app_event_loop(void *parameter) {
  while (true) {
    eventloop_tick();
    delay(1);
  }
}

void app_main(bool shouldWipe) {
  runtime_setup();
  runtimeLog("EmbeTS Runtime ready.");
  delay(100);

  if (shouldWipe)
    fs_wipe();

  xTaskCreatePinnedToCore(app_loop, "LoopTask", 10000, NULL, 1, &LoopTask, 0);
  xTaskCreatePinnedToCore(app_event_loop, "EventLoopTask", 10000, NULL, 1, NULL,
                          1);

  app_program();
}
