// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

/** Image-encoded terrain format. */
export const TerrainFormat = {
  name: 'Terrain',
  id: 'terrain',
  module: 'terrain',
  encoding: 'image',
  format: 'terrain',
  extensions: ['png', 'pngraw', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'],
  mimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp']
} as const satisfies Format;

/** Quantized mesh terrain format. */
export const QuantizedMeshFormat = {
  name: 'Quantized Mesh',
  id: 'quantized-mesh',
  module: 'terrain',
  encoding: 'binary',
  format: 'quantized-mesh',
  extensions: ['terrain'],
  mimeTypes: ['application/vnd.quantized-mesh'],
  binary: true
} as const satisfies Format;
