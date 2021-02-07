import {createWorker} from '@loaders.gl/worker-utils';
import CRC32Transform from '../lib/crc32/crc32-hash-transform';
import CRC32CTransform from '../lib/crc32c/crc32c-hash-transform';

// Assuming we can bundle as module
export {CRC32Transform, CRC32CTransform};

createWorker(async ({data, options = {}}) => {
  // @ts-ignore
  const {operation} = options;

  switch (operation) {
    case 'crc32':
      return await CRC32Transform.run(data);
    case 'crc32c':
      return await CRC32CTransform.run(data);
    default:
      throw new Error(`invalid option: ${operation}`);
  }
});
