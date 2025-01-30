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

import { WiFi, request } from "embets:net";

/*****************const wifi = new WiFi(
  process.env.WIFI_SSID ?? "",
  process.env.WIFI_PASSWORD ?? ""
);

wifi.on("connected", () => {
  console.log("Wifi connected, called by event");

  console.log(wifi.connected);
  console.log(wifi.ip);
});

wifi.connect();

console.log("Wifi connecting, the function is non-blocking");*/

setTimeout(() => {
  console.log("Timeout called");
}, 1000);

console.log("Hello, world!");
