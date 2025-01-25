import mylib from "bind:./c/mylib.h";
import { useCFunction } from "embets:imports";

const startWifiAP = useCFunction<() => number>(mylib.startWifiAP, "int");
const serverLoop = useCFunction<() => number>(mylib.serverLoop, "int");

startWifiAP();

setInterval(() => {
  serverLoop();
}, 20);
