// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export {Hash} from './lib/hash';

export {CRC32Hash} from './lib/crc32-hash';
export {CRC32CHash} from './lib/crc32c-hash';
export {MD5Hash} from './lib/md5-hash';
export {SHA256Hash} from './lib/sha256-hash';

export {CryptoHash} from './lib/crypto-hash';
export {NodeHash} from './lib/node-hash';

/**
 * Small, fast worker for CRC32, CRC32c and MD5 Hashes
 */
export const CryptoWorker = {
  id: 'crypto',
  name: 'CRC32, CRC32c and MD5 Hashes',
  module: 'crypto',
  version: VERSION,
  options: {
    crypto: {}
  }
};

/**
 * Large worker for full complement of Cryptographic Hashes
 * bundles the full crypto.js library
 */
export const CryptoJSWorker = {
  id: 'cryptojs',
  name: 'Cryptographic Hashes',
  module: 'crypto',
  version: VERSION,
  options: {
    cryptojs: {}
  }
};

// EXPERIMENTAL

export {encodeNumber, encodeHex, encodeBase64} from './lib/utils/digest-utils';
export {asciiToBase64, base64ToAscii} from './lib/utils/base64-utils';
