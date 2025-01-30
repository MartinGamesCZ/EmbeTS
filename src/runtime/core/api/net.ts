declare const $__native_net_sta: {
  connected: () => boolean;
  connect: (ssid: string, password: string) => void;
  disconnect: () => void;
  ip: () => string;
  evton: (e: "connected") => number;
};
declare const $__native_net_http: {
  get: (url: string) => {
    code: number;
    body: string;
    error: string;
  };
};
declare function $__js_events_register(
  id: number,
  once: boolean,
  cb: () => any
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

    on(e: "connected", cb: () => any) {
      if (e !== "connected") {
        throw new Error("Only 'connected' event is supported for now.");
      }

      const id = $__native_net_sta.evton(e);

      $__js_events_register(id, false, cb);
    }
  }

  // TODO: Make this function async
  function request(url: string, config: any) {
    var fn =
      $__native_net_http[
        config.method.toLowerCase() as keyof typeof $__native_net_http
      ];

    if ((config.method && config.method != "GET") || !fn) {
      throw new Error("Only GET method is supported for now.");
    }

    const data: any = fn(url);

    return {
      json: () => JSON.parse(data.body),
      text: () => data.body,
      statusCode: data.code,
      error: data.error,
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
