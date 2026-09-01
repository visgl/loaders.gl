// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {COORDINATE_SYSTEM} from './lib/parsers/constants';

/** Shared I3S defaults used by metadata and binary content loaders. */
export const I3S_LOADER_OPTIONS = {
  token: undefined,
  isTileset: 'auto',
  isTileHeader: 'auto',
  tile: undefined,
  tileset: undefined,
  _tileOptions: undefined,
  _tilesetOptions: undefined,
  useDracoGeometry: true,
  useCompressedTextures: true,
  decodeTextures: true,
  coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS
} as const;
