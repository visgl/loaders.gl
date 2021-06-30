/**
 * Throws error message
 * @param condition checks if an attribute equal to condition
 * @param message error message
 */
export function assert(condition: any, message?: any): void {
  if (!condition) {
    throw new Error(`math.gl assertion failed. ${message}`);
  }
}
