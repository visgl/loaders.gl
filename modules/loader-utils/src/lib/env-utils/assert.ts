/**
 * Throws an `Error` with the optional `message` if `condition` is falsy
 * Replacement for the external assert method to reduce bundle size
 * Note: We don't use the second "message" argument in calling code,
 * so no need to support it here
 */
export function assert(condition: any, message?: string): void {
  if (!condition) {
    throw new Error(message || 'loader assertion failed.');
  }
}
