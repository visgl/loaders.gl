/**
 * Check for Node.js `Buffer` (without triggering bundler to include Buffer polyfill on browser)
 */ 
export function isBuffer(value: any): boolean;

/**
 * Converts to Node.js `Buffer` (without triggering bundler to include Buffer polyfill on browser)
 * @todo better data type
 */
export function toBuffer(data: any): Buffer;

/**
 * Converts Node.js `Buffer` to `ArrayBuffer` (without triggering bundler to include Buffer polyfill on browser)
 * @todo better data type
 */
export function bufferToArrayBuffer(data: any): ArrayBuffer;
