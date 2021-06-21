/**
 * Throws an `Error` with the optional `message` if `condition` is falsy
 * @note Replacement for the external assert method to reduce bundle size
 */
export function assert(condition: any, message?: string): void {
  if (!condition) {
    throw new Error(message || 'loader assertion failed.');
  }
}
