// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {WriterWithEncoder} from '@loaders.gl/core/loader-utils';
import {encodeMVT, type MVTWriterOptions} from './lib/encode-mvt';
import {MVT_WRITER_METADATA} from './mvt-writer-types';

/**
 * Writer for the Mapbox Vector Tile format
 *
 * Experimental: The API may change in minor/patch releases.
 */
export const MVTWriter = {
  ...MVT_WRITER_METADATA,
  async encode(data, options?: MVTWriterOptions) {
    return encodeMVT(data, options);
  },
  encodeSync(data, options?: MVTWriterOptions) {
    return encodeMVT(data, options);
  }
} as const satisfies WriterWithEncoder<any, never, MVTWriterOptions>;
