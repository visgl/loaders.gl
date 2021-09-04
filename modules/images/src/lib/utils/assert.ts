export function assert(condition: any, message?: string): void {
  if (!condition) {
    throw new Error(message);
  }
}
