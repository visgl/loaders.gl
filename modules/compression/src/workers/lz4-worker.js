import {createWorker} from '@loaders.gl/worker-utils';
import LZ4DeflateTransform from '../lib/zlib/zlib-deflate-transform';
import LZ4InflateTransform from '../lib/zlib/zlib-inflate-transform';

export {LZ4DeflateTransform, LZ4InflateTransform};

createWorker(async (data, options = {}) => {
  // @ts-ignore
  switch (options.operation) {
    case 'deflate':
      return await LZ4DeflateTransform.run(data);
    case 'inflate':
      return await LZ4InflateTransform.run(data);
    default:
      throw new Error('invalid option');
  }
});
