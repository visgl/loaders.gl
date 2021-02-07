import {createWorker} from '@loaders.gl/worker-utils';
import CryptoHashTransform from '../lib/crypto/crypto-hash-transform';

// Assuming we can bundle as module
export {CryptoHashTransform};

createWorker(async ({data, options = {}}) => {
  // @ts-ignore
  const {operation} = options;

  switch (operation) {
    case 'crc32':
      return await CryptoHashTransform.run(data);
    case 'crc32c':
      return await CryptoHashTransform.run(data);
    default:
      throw new Error(`invalid option: ${operation}`);
  }
});
