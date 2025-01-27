#include "./main.h"

#include "./bridge/bridge.h"
#include "./fs/fs.h"
#include "./os/os.h"
#include "./runtime.h"
#include "./utils/log.h"
#include <Arduino.h>

TaskHandle_t LoopTask;

void app_program() {
  String program = fs_read("/boot/index.js");

  if (program == "") {
    errorLog("Program not found, please upload it.", true);
    return;
  }

  runtime_eval(program.c_str(), false);
}

void app_loop(void *parameter) {
  bridge_wsequence_ready();

  delay(100);

  while (true) {
    if (bridge_cmd_available()) {
      String cmd = bridge_cmd_read();

      if (cmd == "\x03")
        os_restart();

      if (cmd == "\x04") {
        String program = bridge_program_read();

        bool fileWritten = fs_write("/boot/index.js", program);
        if (!fileWritten) {
          errorLog("Failed to write program to file.", true);
          continue;
        }

        runtimeLog("Program updated.");
        bridge_wsequence_flashed();

        delay(100);

        os_restart();
      }
    }

    // TODO: Events, timers

    delay(50);
  }
}

void app_main() {
  runtime_setup();
  runtimeLog("EmbeTS Runtime ready.");
  delay(100);

  xTaskCreatePinnedToCore(&app_loop, "LoopTask", 10000, NULL, 1, &LoopTask, 0);

  app_program();
}
