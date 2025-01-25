type CReturnType = "int" | "float" | "double" | "void" | "string";
type CArgType = "int" | "float" | "double" | "string";

export function useCFunction<T>(
  fn: any,
  ret: CReturnType,
  ...args: CArgType[]
): T {
  return ((...args: any[]) => {
    return 0;
  }) as T;
}
