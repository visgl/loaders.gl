/**
 * In a few cases (data URIs, node.js) "files" can be read synchronously
 */

export function readFileSync(url: string, options?: object);
