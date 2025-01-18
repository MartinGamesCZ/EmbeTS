export function escapeQuotes(str: string) {
  return str.replace(/"/g, '\\"');
}

export function escapeRawCode(code: string) {
  return `END(${code})END`;
}
