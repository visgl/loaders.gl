import {isBrowser, resolvePath} from '@loaders.gl/loader-utils';
import * as node from '../../node/read-file-sync.node';
import {readFileSyncBrowser} from './read-file.browser';

/**
 * In a few cases (data URIs, node.js) "files" can be read synchronously
 */
export function readFileSync(url: string, options: object = {}) {
  url = resolvePath(url);
  if (!isBrowser && node.readFileSync) {
    return node.readFileSync(url, options);
  }
  return readFileSyncBrowser(url, options);
}
