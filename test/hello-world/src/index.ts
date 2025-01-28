/*import { WiFi, request } from "embets:net";

const wifi = new WiFi("martin/local", "localmartin07");

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
import { board, PinMode, PinState } from "embets:hardware";

console.log("Program started!");

board.pins(0).setMode(PinMode.INPUT_PULLUP);

var prevState = PinState.HIGH;

while (true) {
  const state = board.pins(0).getState();

  if (state != prevState && state == PinState.LOW) {
    console.log("Rolling the dice " + (Math.floor(Math.random() * 7) + 1));
  }

  prevState = state;
}
