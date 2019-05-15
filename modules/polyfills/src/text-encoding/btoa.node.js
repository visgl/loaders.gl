// btoa, atob polyfills for Node.js
// Note: These functions are not unicode safe
/* global Buffer */

export function atob(string) {
  return Buffer.from(string).toString('base64');
}

export function btoa(base64) {
  return Buffer.from(base64, 'base64').toString('ascii');
}
