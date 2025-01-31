#include "./net.h"

#include "../event/event_loop.h"
#include "../lib/duktape/duktape.h"
#include "../net/net.h"

#include <Arduino.h>
#include <HTTPClient.h>

uint8_t eventId[] = {};

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

bool lastState = false;

static duk_ret_t impl_runtime_native_net_sta_evton_connected(duk_context *ctx) {
  lastState = net_sta_connected();

  uint8_t id = event_loop_create_duktape_event(
      [](uint8_t) -> bool {
        bool state = net_sta_connected();

        if (state != lastState) {
          lastState = state;
          return true;
        }

        return false;
      },
      ctx);

  duk_push_int(ctx, id);

  return 1;
}

static duk_ret_t impl_runtime_native_net_sta_evton(duk_context *ctx) {
  const char *event = duk_require_string(ctx, 0);

  if (strcmp(event, "connected") == 0) {
    return impl_runtime_native_net_sta_evton_connected(ctx);
  }

  return 0;
}

// ------------------ HTTP ------------------
static duk_ret_t impl_runtime_native_net_http_get(duk_context *ctx) {
  const char *url = duk_require_string(ctx, 0);

  int code = net_http_get(url);

  duk_idx_t id = duk_push_object(ctx);

  duk_push_int(ctx, code);
  duk_put_prop_string(ctx, id, "code");

  if (code > 0) {
    String res = net_http_result();

    duk_push_string(ctx, res.c_str());
    duk_put_prop_string(ctx, id, "body");
  } else {
    const char *err = net_http_error(code);

    duk_push_string(ctx, err);
    duk_put_prop_string(ctx, id, "error");
  }

  net_http_end();

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

  duk_push_c_function(ctx, impl_runtime_native_net_sta_evton, DUK_VARARGS);
  duk_put_prop_string(ctx, -2, "evton");

  duk_put_global_string(ctx, "$__native_net_sta");

  // ------------------ HTTP ------------------
  duk_push_object(ctx);

  duk_push_c_function(ctx, impl_runtime_native_net_http_get, DUK_VARARGS);
  duk_put_prop_string(ctx, -2, "get");

  duk_put_global_string(ctx, "$__native_net_http");
}