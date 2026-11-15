// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/core/loader-utils';
import {parsePLYNativeBatches, parsePLYTable} from '../lib/parse-ply-output';
import {PLYLoaderWithParser} from '../ply-loader';
import type {PLYLoaderOptions} from '../ply-loader-types';

createLoaderWorker({
  ...PLYLoaderWithParser,
  /** Transfers native columns for both requested output shapes. */
  parse: async (input, options) => parsePLYTable(input, options),
  /** Streams native record batches before caller-side mesh conversion. */
  parseInBatches(input, options?: PLYLoaderOptions) {
    if (options?.ply?.shape === 'mesh' && !options.ply.pointCloud) {
      return parsePLYNativeBatches(input, options);
    }
    return parsePLYNativeBatches(input, {...options, ply: {...options?.ply, shape: 'arrow'}});
  }
});
