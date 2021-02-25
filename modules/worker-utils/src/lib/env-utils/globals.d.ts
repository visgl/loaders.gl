export const self: object;
export const window: object;
export const global: object;
export const document: object;

/** true if running in the browser, false if running in Node.js */
export const isBrowser: boolean;

/** true if running on a worker thread */
export const isWorker: boolean;

/** true if running on a mobile device */
export const isMobile: boolean;

/** Version of Node.js if running under Node, otherwise 0 */
export const nodeVersion: number;
