#include "./fs.h"

#include "../utils/log.h"
#include <Arduino.h>
#include <FS.h>
#include <LittleFS.h>

void fs_create_structure() {
  const String dirs[] = {"/boot", "/data", "/tmp"};

  for (int i = 0; i < sizeof(dirs) / sizeof(dirs[0]); i++) {
    if (LittleFS.exists(dirs[i]))
      continue;

    if (LittleFS.mkdir(dirs[i]))
      continue;

    errorLog("Failed to create directory: " + dirs[i], true);
  }
}

void fs_init() {
  if (!LittleFS.begin(true))
    errorLog("Failed to mount file system", true);

  fs_create_structure();
}

String fs_read(const char *path) {
  if (!LittleFS.exists(path))
    return "";

  File file = LittleFS.open(path, "r");
  String content = "";

  while (file.available()) {
    content += (char)file.read();
  }

  file.close();

  return content;
}

bool fs_write(const char *path, String content) {
  fs_create_structure();

  File file = LittleFS.open(path, "w");

  delay(1000);

  if (!file)
    return false;

  if (!file.print(content))
    return false;

  file.close();

  return true;
}

void fs_wipe() {
  if (!LittleFS.begin(true))
    errorLog("Failed to mount file system", true);

  LittleFS.format();
}