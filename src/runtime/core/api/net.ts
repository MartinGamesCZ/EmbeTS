declare function $__native_net_wifi_connect(
  ssid: string,
  password: string
): void;
declare function $__native_net_http_req_get(url: string): void;

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

  // TODO: Make this function async
  function request(url: string, config: any) {
    var fn = $__native_net_http_req_get;

    if (config.method && config.method != "GET") {
      throw new Error("Only GET method is supported for now.");
    }

    const data: any = fn(url);

    return {
      json: () => JSON.parse(data.body),
      text: () => data.body,
      statusCode: data.code,
      error: data.error
    };
  }
}

export default function ApiCoreNet() {
  const matched = IMPL.toString().match(/function[^{]+\{([\s\S]*)\}$/);

  if (!matched) {
    throw new Error("Failed to parse core net implementation.");
  }

  return matched[1];
}
