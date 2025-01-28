#include "./net.h"

#include "../lib/duktape/duktape.h"
#include "../net/net.h"

#include <Arduino.h>

static duk_ret_t impl_runtime_native_net_sta_connect(duk_context *ctx) {
  const char *ssid = duk_require_string(ctx, 0);
  const char *password = duk_require_string(ctx, 1);

  net_sta_connect(ssid, password);

  return 0;
}

static duk_ret_t impl_runtime_native_net_sta_disconnect(duk_context *ctx) {
  net_sta_disconnect();

  return 0;
}

static duk_ret_t impl_runtime_native_net_sta_connected(duk_context *ctx) {
  duk_push_boolean(ctx, net_sta_connected());

  return 1;
}

static duk_ret_t impl_runtime_native_net_sta_ip(duk_context *ctx) {
  String ip = net_sta_ip().toString();

  duk_push_string(ctx, ip.c_str());

  return 1;
}

void register_runtime_native_net(duk_context *ctx) {
  duk_push_object(ctx);

  duk_push_c_function(ctx, impl_runtime_native_net_sta_connect, DUK_VARARGS);
  duk_put_prop_string(ctx, -2, "connect");

  duk_push_c_function(ctx, impl_runtime_native_net_sta_disconnect, DUK_VARARGS);
  duk_put_prop_string(ctx, -2, "disconnect");

  duk_push_c_function(ctx, impl_runtime_native_net_sta_connected, DUK_VARARGS);
  duk_put_prop_string(ctx, -2, "connected");

  duk_push_c_function(ctx, impl_runtime_native_net_sta_ip, DUK_VARARGS);
  duk_put_prop_string(ctx, -2, "ip");

  duk_put_global_string(ctx, "$__native_net_sta");
}