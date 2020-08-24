/** @typedef {import('./buffer-utils')} types */
import * as node from '../node/buffer-utils.node';

/** @type {types['isBuffer']} */
export function isBuffer(x) {
  return x && typeof x === 'object' && x.isBuffer;
}

/** @type {types['toBuffer']} */
export function toBuffer(data) {
  return node.toBuffer ? node.toBuffer(data) : data;
}

/** @type {types['bufferToArrayBuffer']} */
export function bufferToArrayBuffer(data) {
  if (node.toArrayBuffer) {
    // TODO - per docs we should just be able to call buffer.buffer, but there are issues
    return node.toArrayBuffer(data);
  }
  return data;
}
