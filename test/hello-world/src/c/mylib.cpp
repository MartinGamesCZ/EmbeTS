#include "mylib.h"
#include <WiFi.h>

const char* ssid = "EmbeTS AP";
const char* password = "myPassword";

WiFiServer server(80);

int startWifiAP() {
  WiFi.softAP(ssid, password);

  IPAddress IP = WiFi.softAPIP();

  Serial.print("AP IP address: ");
  Serial.println(IP);

  server.begin();

  return 0;
}

int serverLoop() {
  WiFiClient client = server.available();

  if (client) {
    Serial.println("New Client.");

    String currentLine = "";

    while (client.connected()) {
      if (client.available()) {
        char c = client.read();
        Serial.write(c);

        if (c == '\n') {
          if (currentLine.length() == 0) {
            client.println("HTTP/1.1 200 OK");
            client.println("Content-type:text/html");
            client.println("Connection: close");
            client.println();

            client.println("<!DOCTYPE html><html>");
            client.println("<head><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">");
            client.println("<link rel=\"icon\" href=\"data:,\">");
            client.println("<style>body { text-align: center; font-family: \"Trebuchet MS\", Arial; margin-left: auto; margin-right: auto; margin-top: 30px; }");
            client.println(".slider { width: 300px; }</style>");
            client.println("<script>function sendValue() { var xhr = new XMLHttpRequest(); xhr.open(\"GET\", \"/?value=\" + document.getElementById(\"slider\").value, true); xhr.send(); }</script>");
            client.println("</head><body><h1>ESP32 Slider</h1>");
            client.println("<input type=\"range\" min=\"0\" max=\"255\" value=\"0\" class=\"slider\" id=\"slider\" onchange=\"sendValue()\">");
            client.println("</body></html>");

            break;
          } else {
            currentLine = "";
          }
        } else if (c != '\r') {
          currentLine += c;
        }
      }
    }

    client.stop();
    Serial.println("Client disconnected.");
  }

  delay(10);

  return 0;
}