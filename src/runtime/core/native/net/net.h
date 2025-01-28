#ifndef EMBETS_NET
#define EMBETS_NET

#include <IPAddress.h>

void net_init();
void net_sta_disconnect();
void net_sta_connect(const char *ssid, const char *password);
bool net_sta_connected();
IPAddress net_sta_ip();

#endif