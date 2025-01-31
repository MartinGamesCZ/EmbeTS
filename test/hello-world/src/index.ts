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

/*import { WiFi, request } from "embets:net";

const wifi = new WiFi(
  process.env.WIFI_SSID ?? "",
  process.env.WIFI_PASSWORD ?? ""
);

wifi.on("connected", () => {
  console.log("Wifi connected, called by event");

  console.log(wifi.connected);
  console.log(wifi.ip);
});

wifi.connect();

console.log("Wifi connecting, the function is non-blocking");
*/

/*import { board, PinMode, PinState } from "embets:hardware";
import { delay, delayMicroseconds } from "embets:timers";

const trig = board.pins(5);
const echo = board.pins(18);

const relay = board.pins(22);

trig.setMode(PinMode.OUTPUT);
echo.setMode(PinMode.INPUT);

relay.setMode(PinMode.OUTPUT);

delay(50);

while (true) {
  trig.setState(PinState.LOW);
  delayMicroseconds(2);
  trig.setState(PinState.HIGH);
  delayMicroseconds(10);
  trig.setState(PinState.LOW);

  const pulse = echo.measurePulse(PinState.HIGH);

  const distance = pulse * (0.034 / 2);

  if (distance < 20 || distance > 1200) {
    relay.setState(PinState.LOW);
  } else {
    relay.setState(PinState.HIGH);
  }

  delay(100);
}
*/
