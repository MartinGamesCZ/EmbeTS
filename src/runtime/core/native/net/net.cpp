#include "./net.h"

#include <Arduino.h>
#include <HTTPClient.h>
#include <HardwareSerial.h>
#include <IPAddress.h>
#include <WiFi.h>

HTTPClient httpClient;

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

  /*while (!net_sta_connected())
    delay(100);*/

  // TODO: Add async variant and put it into duktape function
}

IPAddress net_sta_ip() { return WiFi.localIP(); }

// -------------------- HTTP --------------------
int net_http_get(const char *url) {
  httpClient.begin(url);
  return httpClient.GET();
}

String net_http_result() { return httpClient.getString(); }

const char *net_http_error(int code) {
  return httpClient.errorToString(code).c_str();
}

void net_http_end() { httpClient.end(); }