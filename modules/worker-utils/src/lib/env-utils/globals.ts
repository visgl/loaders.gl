// Purpose: include this in your module to avoids adding dependencies on
// micro modules like 'global' and 'is-browser';

/** true if running in the browser, false if running in Node.js */
export const isBrowser: boolean =
  // @ts-ignore process.browser
  typeof process !== 'object' || String(process) !== '[object process]' || process.browser;

/** true if running on a worker thread */
export const isWorker: boolean = typeof importScripts === 'function';

/** true if running on a mobile device */
export const isMobile: boolean =
  typeof window !== 'undefined' && typeof window.orientation !== 'undefined';

// Extract node major version
const matches =
  typeof process !== 'undefined' && process.version && /v([0-9]*)/.exec(process.version);

/** Version of Node.js if running under Node, otherwise 0 */
export const nodeVersion: number = (matches && parseFloat(matches[1])) || 0;
