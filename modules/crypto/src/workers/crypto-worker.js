import {createWorker} from '@loaders.gl/worker-utils';
import CRC32HashTransform from '../lib/crc32/crc32-hash-transform';
import CRC32CHashTransform from '../lib/crc32c/crc32c-hash-transform';
import MD5HashTransform from '../lib/md5-wasm/md5-hash-transform';

// Assuming we can bundle as module
export {CRC32HashTransform, CRC32CHashTransform};

createWorker(async (data, options = {}) => {
  // @ts-ignore
  const {operation} = options;

  switch (operation) {
    case 'crc32':
      return await CRC32HashTransform.run(data);
    case 'crc32c':
      return await CRC32CHashTransform.run(data);
    case 'md5':
      return await MD5HashTransform.run(data);
    default:
      throw new Error(`invalid option: ${operation}`);
  }
});
