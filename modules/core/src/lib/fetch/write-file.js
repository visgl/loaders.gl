import {isBrowser} from '../../utils/globals';
import assert from '../../utils/assert';
import * as node from './node/write-file-node';

export function writeFile(filePath, arrayBufferOrString, options) {
  if (!isBrowser) {
    return node.writeFile(filePath, arrayBufferOrString, options);
  }
  return assert(false);
}

export function writeFileSync(filePath, arrayBufferOrString, options) {
  if (!isBrowser) {
    return node.writeFileSync(filePath, arrayBufferOrString, options);
  }
  return assert(false);
}
