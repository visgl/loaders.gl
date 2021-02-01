import {createWorker} from '@loaders.gl/loader-utils';
import ZlibDeflateTransform from '../lib/zlib/zlib-deflate-transform';
import ZlibInflateTransform from '../lib/zlib/zlib-inflate-transform';

export {ZlibDeflateTransform, ZlibInflateTransform};

createWorker(async ({data, options = {}}) => {
  // @ts-ignore
  switch (options.transform) {
    case 'deflate':
      return await ZlibDeflateTransform.run(data);
    case 'inflate':
      return await ZlibInflateTransform.run(data);
    default:
      throw new Error('invalid option');
  }
});
