// SPDX-License-Identifier: MIT

import {VERSION} from './lib/utils/version';

/** Metadata for the KTX2 Basis writer worker. */
export const KTX2BasisWriterWorker = {
  name: 'Basis Universal Supercompressed GPU Texture',
  id: 'ktx2-basis-writer',
  module: 'images',
  version: VERSION,
  extensions: ['ktx2'],
  worker: true,
  /** Published CommonJS bundle for Node.js workers. */
  workerNode: 'ktx2-basis-writer-worker-node.cjs',
  options: {
    ['ktx2-basis-writer']: {
      format: 'etc1s',
      contentType: 'linear',
      mipmaps: false,
      zstd: false,
      ldrToHdrNitMultiplier: 100
    }
  }
};
