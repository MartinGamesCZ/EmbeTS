import { _, _else, _function, _if, _quot, _transform } from "../..";
import { NativeFunction } from "../../native_function";

const IMPL_WIFI_CONNECT = _function(
  "duk_ret_t",
  "impl_runtime_native_net_wifi_connect",
  {
    "*ctx": "duk_context",
  },
  [
    _("String ssid = duk_require_string(ctx, 0)"),
    _("String password = duk_require_string(ctx, 1)"),
    _if("WiFi.status() == WL_CONNECTED", [
      /*_("ESP_ERROR_CHECK( esp_wifi_disconnect())"),
      _("vTaskDelay(100 / portTICK_RATE_MS)"),
      _("ESP_ERROR_CHECK( esp_wifi_stop())"),
      _("vTaskDelay(100 / portTICK_RATE_MS)"),
      _("ESP_ERROR_CHECK( esp_wifi_deinit())"),
      _("vTaskDelay(100 / portTICK_RATE_MS)"),*/
      _("WiFi.disconnect()"),
      //_("WiFi.mode(WIFI_OFF)"),
      //_("WiFi.waitForConnectResult();"),
      _("while (WiFi.status() == WL_CONNECTED) { delay(100); }"),
    ]),
    _("WiFi.enableSTA(true)"),
    _("WiFi.begin(ssid.c_str(), password.c_str())"),
    //_("WiFi.mode(WIFI_AP_STA)"),
    _("while (WiFi.status() != WL_CONNECTED) { delay(100); }"),
    // Delay while no IP
    _("Serial.println(WiFi.localIP())"),
    _("return 0"),
  ],
  true
);

const IMPL_HTTP_REQ_GET = _function(
  "duk_ret_t",
  "impl_runtime_native_net_http_req_get",
  {
    "*ctx": "duk_context",
  },
  [
    _("const char* url = duk_require_string(ctx, 0)"),
    _("http.begin(url)"),
    _("int code = http.GET()"),
    _("duk_push_object(ctx)"),
    _("duk_push_int(ctx, code)"),
    _('duk_put_prop_string(ctx, -2, "code")'),
    _if("code > 0", [
      _("String res = http.getString()"),
      _("duk_push_string(ctx, res.c_str())"),
      _('duk_put_prop_string(ctx, -2, "body")'),
    ]),
    _else([
      _("duk_push_string(ctx, http.errorToString(code).c_str())"),
      _('duk_put_prop_string(ctx, -2, "error")'),
    ]),
    _("http.end()"),
    _("return 1"),
  ],
  true
);

export function NativeCoreFnNetWifiConnect() {
  return _transform(
    NativeFunction({
      1: "impl_runtime_native_net_wifi_connect",
      2: "DUK_VARARGS",
      3: _quot("$__native_net_wifi_connect"),
    }),
    {}
  );
}

export function NativeCoreFnNetHttpReqGet() {
  return _transform(
    NativeFunction({
      1: "impl_runtime_native_net_http_req_get",
      2: "DUK_VARARGS",
      3: _quot("$__native_net_http_req_get"),
    }),
    {}
  );
}

export function NativeCoreImplNetWifiConnect() {
  return _transform(IMPL_WIFI_CONNECT, {});
}

export function NativeCoreImplNetHttpReqGet() {
  return _transform(IMPL_HTTP_REQ_GET, {});
}
