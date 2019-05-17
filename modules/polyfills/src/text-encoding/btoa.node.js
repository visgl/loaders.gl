// btoa, atob polyfills for Node.js
// Note: The atob and btoa functions (not just the polyfills!) are not unicode safe
// But still useful for unit testing

/* global Buffer */
export function atob(string) {
  return Buffer.from(string).toString('base64');
}

export function btoa(base64) {
  return Buffer.from(base64, 'base64').toString('ascii');
}
