/*import { WiFi, request } from "embets:net";

const wifi = new WiFi("xxxxxxxxxx", "xxxxxxxxxxxxx");

wifi.connect();
console.log("Wifi connected");

for (let i = 0; i < 10; i++) {
  const response = request(
    `https://jsonplaceholder.typicode.com/todos/${i + 1}`,
    {
      method: "GET",
    }
  );
  //const data = response.json();

  console.log(response.error);
  console.log(response.statusCode);
  console.log(response.text());
}*/

import { WiFi } from "embets:net";

const wifi = new WiFi(
  process.env.WIFI_SSID ?? "",
  process.env.WIFI_PASSWORD ?? ""
);

wifi.connect();
console.log("Wifi connected");

console.log(wifi.connected);
console.log(wifi.ip);

wifi.disconnect();
