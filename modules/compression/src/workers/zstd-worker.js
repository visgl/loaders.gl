// Bundle in the big Zstd-Codec in the worker
// eslint-disable-next-line import/no-extraneous-dependencies
import {ZstdCodec} from 'zstd-codec';

import {createWorker} from '@loaders.gl/worker-utils';
import ZstdDeflateTransform from '../lib/zstd/zstd-deflate-transform';
import ZstdInflateTransform from '../lib/zstd/zstd-inflate-transform';

export {ZstdDeflateTransform, ZstdInflateTransform};

createWorker(async (data, options) => {
  options = options || {};
  options.modules = {'zstd-codec': ZstdCodec};

  // @ts-ignore
  switch (options.operation) {
    case 'deflate':
      return await ZstdDeflateTransform.run(data, options);
    case 'inflate':
      return await ZstdInflateTransform.run(data, options);
    default:
      throw new Error('invalid option');
  }
});
