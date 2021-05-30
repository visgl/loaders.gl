import {createWorker} from '@loaders.gl/worker-utils';
import ZlibDeflateTransform from '../lib/zlib/zlib-deflate-transform';
import ZlibInflateTransform from '../lib/zlib/zlib-inflate-transform';

import LZ4DeflateTransform from '../lib/zlib/zlib-deflate-transform';
import LZ4InflateTransform from '../lib/zlib/zlib-inflate-transform';

/** Create worker (only starts when script is loaded in a worker)
 * All module code is already part of the bundle, the overhead is minimal
 */
export function startWorker() {
  createWorker(async (data, options = {}) => {
    // @ts-ignore
    switch (options.operation) {
      case 'zlib-deflate':
        return await ZlibDeflateTransform.run(data);
      case 'zlib-inflate':
        return await ZlibInflateTransform.run(data);
      case 'lz4-deflate':
        return await LZ4DeflateTransform.run(data);
      case 'lz4-inflate':
        return await LZ4InflateTransform.run(data);
      default:
        throw new Error(`invalid option: ${options.operation}`);
    }
  });
}
