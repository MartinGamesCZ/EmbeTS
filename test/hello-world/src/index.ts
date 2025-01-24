console.log("Start");

console.log("Before setTimeout: " + performance.now() + "ms");
const i1 = setInterval(log, 2000);
const i2 = setInterval(log2, 1000);

setTimeout(function () {
  console.log("Clear timeout started");

  clearInterval(i1);
  clearTimeout(i2);
}, 6500);

console.log("After setTimeout, code continues to run.");

function log() {
  console.log("First setInterval callback: " + performance.now() + "ms");
}

function log2() {
  console.log("Second setInterval callback: " + performance.now() + "ms");
}
