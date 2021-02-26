import {createWorker} from '@loaders.gl/worker-utils';
import ZlibDeflateTransform from '../lib/zlib/zlib-deflate-transform';
import ZlibInflateTransform from '../lib/zlib/zlib-inflate-transform';

export {ZlibDeflateTransform, ZlibInflateTransform};

createWorker(async (data, options = {}) => {
  // @ts-ignore
  switch (options.operation) {
    case 'deflate':
      return await ZlibDeflateTransform.run(data);
    case 'inflate':
      return await ZlibInflateTransform.run(data);
    default:
      throw new Error('invalid option');
  }
});
