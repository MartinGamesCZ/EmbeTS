#include "./net.h"

#include <Arduino.h>
#include <HardwareSerial.h>
#include <IPAddress.h>
#include <WiFi.h>

bool net_sta_connected() { return WiFi.status() == WL_CONNECTED; }

void net_init() {
  WiFi.enableSTA(true);
  WiFi.enableAP(false);

  if (net_sta_connected())
    WiFi.disconnect();
}

void net_sta_disconnect() { WiFi.disconnect(); }

void net_sta_connect(const char *ssid, const char *password) {
  if (net_sta_connected())
    net_sta_disconnect();

  WiFi.begin(ssid, password);

  while (!net_sta_connected())
    delay(100);
}

IPAddress net_sta_ip() { return WiFi.localIP(); }