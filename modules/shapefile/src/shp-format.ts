// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';
const SHP_MAGIC_NUMBER = [0x00, 0x00, 0x27, 0x0a];

/** SHP geometry file format. */
export const SHPFormat = {
  name: 'SHP',
  id: 'shp',
  module: 'shapefile',
  category: 'geometry',
  encoding: 'binary',
  format: 'shp',
  extensions: ['shp'],
  mimeTypes: ['application/octet-stream'],
  binary: true,
  tests: [new Uint8Array(SHP_MAGIC_NUMBER).buffer]
} as const satisfies Format;

/** ESRI Shapefile dataset format. */
export const ShapefileFormat = {
  name: 'Shapefile',
  id: 'shapefile',
  module: 'shapefile',
  category: 'geometry',
  encoding: 'binary',
  format: 'shapefile',
  extensions: ['shp'],
  mimeTypes: ['application/octet-stream'],
  binary: true,
  tests: [new Uint8Array(SHP_MAGIC_NUMBER).buffer]
} as const satisfies Format;
