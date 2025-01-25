declare function $__native_net_wifi_connect(
  ssid: string,
  password: string
): void;

function IMPL() {
  class WiFi {
    private readonly ssid: string;
    private readonly password: string;

    constructor(ssid: string, password: string) {
      this.ssid = ssid;
      this.password = password;
    }

    connect() {
      $__native_net_wifi_connect(this.ssid, this.password);
    }
  }
}

export default function ApiCoreNet() {
  const matched = IMPL.toString().match(/function[^{]+\{([\s\S]*)\}$/);

  if (!matched) {
    throw new Error("Failed to parse core net implementation.");
  }

  return matched[1];
}
