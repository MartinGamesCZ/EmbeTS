import { DEBUG } from "../config";

export default function log(message: string) {
  if (!DEBUG) return;

  console.log(message);
}
