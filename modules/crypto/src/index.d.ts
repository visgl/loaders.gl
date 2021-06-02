import {WorkerObject} from '@loaders.gl/worker-utils';

// Cryptographic hash
export {default as CRC32HashTransform} from './lib/crc32/crc32-hash-transform';
export {default as CRC32CHashTransform} from './lib/crc32c/crc32c-hash-transform';
export {default as MD5HashTransform} from './lib/md5-wasm/md5-hash-transform';
export {default as CryptoHashTransform} from './lib/crypto/crypto-hash-transform';

export {hexToBase64 as _hexToBase64, toHex as _toHex} from './lib/utils/digest-utils';

/**
 * Small, fast worker for CRC32, CRC32c and MD5 Hashes
 */
export const CryptoWorker: WorkerObject;

/**
 * Large worker for full complement of Cryptographic Hashes
 * bundles the full crypto.js library
 */
export const CryptoJSWorker: WorkerObject;
