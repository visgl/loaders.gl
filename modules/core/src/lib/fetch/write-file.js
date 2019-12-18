import {isBrowser, assert, resolvePath} from '@loaders.gl/loader-utils';
import * as node from '../../node/write-file.node';

export function writeFile(filePath, arrayBufferOrString, options) {
  filePath = resolvePath(filePath);
  if (!isBrowser && node.writeFile) {
    return node.writeFile(filePath, arrayBufferOrString, options);
  }
  return assert(false);
}

export function writeFileSync(filePath, arrayBufferOrString, options) {
  filePath = resolvePath(filePath);
  if (!isBrowser && node.writeFileSync) {
    return node.writeFileSync(filePath, arrayBufferOrString, options);
  }
  return assert(false);
}
