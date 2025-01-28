declare const $__native_net_sta: {
  connected: () => boolean;
  connect: (ssid: string, password: string) => void;
  disconnect: () => void;
  ip: () => string;
};
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
      $__native_net_sta.connect(this.ssid, this.password);
    }

    disconnect() {
      $__native_net_sta.disconnect();
    }

    get connected() {
      return $__native_net_sta.connected();
    }

    get ip() {
      return $__native_net_sta.ip();
    }
  }

  // TODO: Make this function async
  /*function request(url: string, config: any) {
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
  }*/
}

export default function ApiCoreNet() {
  const matched = IMPL.toString().match(/function[^{]+\{([\s\S]*)\}$/);

  if (!matched) {
    throw new Error("Failed to parse core net implementation.");
  }

  return matched[1];
}
