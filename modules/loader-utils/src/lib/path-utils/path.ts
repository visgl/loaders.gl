import * as nodePath from 'path';

/**
 * Replacement for Node.js path.filename
 * @param url
 */
export const filename = (url: string) => nodePath.basename(url ?? '');

/**
 * Replacement for Node.js path.dirname
 * @param url
 */
export const dirname = (url: string) => nodePath.dirname(url ?? '');

export const join = nodePath.join;
export const resolve = nodePath.resolve;
