/** @typedef {import('@loaders.gl/loader-utils').WorkerObject} WorkerObject */

export {default as CryptoHashTransform} from './lib/crypto/crypto-hash-transform';
export {default as CRC32HashTransform} from './lib/crc32/crc32-hash-transform';
export {default as CRC32CHashTransform} from './lib/crc32c/crc32c-hash-transform';
export {default as MD5HashTransform} from './lib/md5-wasm/md5-hash-transform';

export {hexToBase64 as _hexToBase64, toHex as _toHex} from './lib/utils/digest-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const CRC32Worker = {
  id: 'crc32',
  name: 'crc32',
  module: 'crypto',
  version: VERSION,
  options: {
    crc32: {}
  }
};
