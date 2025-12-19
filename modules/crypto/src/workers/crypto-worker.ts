// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createWorker} from '@loaders.gl/worker-utils';
import {CRC32Hash} from '../lib/crc32-hash';
import {CRC32CHash} from '../lib/crc32c-hash';
import {MD5Hash} from '../lib/md5-hash';

// Assuming we can bundle as module
export {CRC32Hash, CRC32CHash};

createWorker(async (data, options = {}) => {
  // @ts-ignore
  const {operation, encoding = 'base64'} = options;

  switch (operation) {
    case 'crc32':
      return await new CRC32Hash(options).hash(data, encoding);
    case 'crc32c':
      return await new CRC32CHash(options).hash(data, encoding);
    case 'md5':
      return await new MD5Hash(options).hash(data, encoding);
    default:
      throw new Error(`invalid option: ${operation}`);
  }
});
