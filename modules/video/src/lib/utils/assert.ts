export function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}
