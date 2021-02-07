import {createWorker} from '@loaders.gl/worker-utils';
import ZstdDeflateTransform from '../lib/zstd/zstd-deflate-transform';
import ZstdInflateTransform from '../lib/zstd/zstd-inflate-transform';

export {ZstdDeflateTransform, ZstdInflateTransform};

createWorker(async ({data, options = {}}) => {
  // @ts-ignore
  switch (options.operation) {
    case 'deflate':
      return await ZstdDeflateTransform.run(data);
    case 'inflate':
      return await ZstdInflateTransform.run(data);
    default:
      throw new Error('invalid option');
  }
});
