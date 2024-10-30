// Replacement for the external assert method to reduce bundle size
// Note: We don't use the second "message" argument in calling code,
// so no need to support it here
export function assert(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || 'loader assertion failed.');
  }
}
