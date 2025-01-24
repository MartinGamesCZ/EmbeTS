import { DEBUG } from "../config";

export default function dlog(message: string) {
  if (!DEBUG) return;

  console.log("[dbug]", message);
}
