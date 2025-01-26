#ifndef EMBETS_FS
#define EMBETS_FS

#include <Arduino.h>

void fs_init();
String fs_read(const char *path);
bool fs_write(const char *path, String content);

#endif