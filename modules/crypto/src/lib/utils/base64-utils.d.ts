export function toHex(cipher: number): string;

  /**
 * @see https://stackoverflow.com/questions/23190056/hex-to-base64-converter-for-javascript
 */
export function hexToBase64(hexstring: string): string;

/**
 * btoa() polyfill as defined by the HTML and Infra specs, which mostly just references
 * RFC 4648.
 */
export function toBase64(string: string): string;
