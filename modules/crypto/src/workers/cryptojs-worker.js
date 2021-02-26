import {createWorker} from '@loaders.gl/worker-utils';
import CryptoHashTransform from '../lib/crypto/crypto-hash-transform';
// eslint-disable-next-line import/no-extraneous-dependencies
import * as CryptoJS from 'crypto-js';

// Assuming we can bundle as module
export {CryptoHashTransform};

createWorker(async (data, options) => {
  options = options || {};
  options.modules = {CryptoJS};
  // @ts-ignore
  const {operation} = options;

  switch (operation) {
    case 'crc32':
      return await CryptoHashTransform.run(data, options);
    case 'crc32c':
      return await CryptoHashTransform.run(data, options);
    default:
      throw new Error(`invalid option: ${operation}`);
  }
});
