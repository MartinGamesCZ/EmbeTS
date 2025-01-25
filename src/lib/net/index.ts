declare class WiFi {
  private readonly ssid;
  private readonly password;
  constructor(ssid: string, password: string);
  connect(): void;
}

export { WiFi };
