// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {WriterWithEncoder} from '@loaders.gl/loader-utils';
import {MVTFormat} from './mvt-format';
import {encodeMVT, type MVTWriterOptions} from './lib/encode-mvt';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Writer for the Mapbox Vector Tile format
 */
export const MVTWriter = {
  ...MVTFormat,
  version: VERSION,
  binary: true,
  options: {
    mvt: {
      layerName: 'geojsonLayer',
      version: 1,
      extent: 4096
    }
  },
  async encode(data, options?: MVTWriterOptions) {
    return encodeMVT(data, options);
  },
  encodeSync(data, options?: MVTWriterOptions) {
    return encodeMVT(data, options);
  }
} as const satisfies WriterWithEncoder<any, never, MVTWriterOptions>;
