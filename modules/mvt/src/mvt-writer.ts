// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {WriterWithEncoder} from '@loaders.gl/loader-utils';
import {MVTFormat} from './mvt-format';
import {encodeMVT} from './lib/encode-mvt';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Writer for the Mapbox Vector Tile format
 */
export const MVTWriter = {
  ...MVTFormat,
  version: VERSION,
  options: {
    image: {
      mimeType: 'image/png',
      jpegQuality: null
    }
  },
  async encode(data, options) {
    return encodeMVT(data, options);
  }
} as const satisfies WriterWithEncoder;
