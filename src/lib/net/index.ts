declare class WiFi {
  private readonly ssid;
  private readonly password;
  constructor(ssid: string, password: string);
  connect(): void;
}
declare function request(
  url: string,
  config: any
): {
  json: () => any;
  text: () => any;
  statusCode: any;
  error: string;
};

export { WiFi, request };
