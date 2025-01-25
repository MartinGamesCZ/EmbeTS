import { WiFi } from "embets:net";

const wifi = new WiFi("martin/local", "localmartin07");

console.log("Connecting to WiFi...");
wifi.connect();
console.log("Connected to WiFi!");
