import { _, _function, _quot, _transform } from "../..";
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
    _("WiFi.begin(ssid.c_str(), password.c_str())"),
    _("while (WiFi.status() != WL_CONNECTED) { delay(50); }"),
    _("return 0"),
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

export function NativeCoreImplNetWifiConnect() {
  return _transform(IMPL_WIFI_CONNECT, {});
}
