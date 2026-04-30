// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';
import {isWKB, isWKT, WKT_MAGIC_STRINGS} from '@loaders.gl/gis';

/** Well-Known Text geometry format. */
export const WKTFormat = {
  name: 'WKT (Well-Known Text)',
  id: 'wkt',
  module: 'wkt',
  encoding: 'text',
  format: 'wkt',
  extensions: ['wkt'],
  mimeTypes: ['text/plain'],
  category: 'geometry',
  text: true,
  tests: WKT_MAGIC_STRINGS,
  testText: isWKT
} as const satisfies Format & {testText: typeof isWKT};

/** Well-Known Binary geometry format. */
export const WKBFormat = {
  name: 'WKB',
  id: 'wkb',
  module: 'wkt',
  category: 'geometry',
  encoding: 'binary',
  format: 'wkb',
  extensions: ['wkb'],
  mimeTypes: [],
  binary: true,
  tests: [isWKB]
} as const satisfies Format;

/** Hex-encoded Well-Known Binary geometry format. */
export const HexWKBFormat = {
  name: 'Hexadecimal WKB',
  id: 'wkb',
  module: 'wkt',
  category: 'geometry',
  encoding: 'text',
  format: 'hex-wkb',
  extensions: ['wkb'],
  mimeTypes: [],
  text: true
} as const satisfies Format;

/** Tiny Well-Known Binary geometry format. */
export const TWKBFormat = {
  name: 'TWKB (Tiny Well-Known Binary)',
  id: 'twkb',
  module: 'wkt',
  encoding: 'binary',
  format: 'twkb',
  extensions: ['twkb'],
  mimeTypes: ['application/octet-stream'],
  category: 'geometry',
  binary: true
} as const satisfies Format;

/** Well-Known Text coordinate reference system format. */
export const WKTCRSFormat = {
  name: 'WKT CRS',
  id: 'wkt-crs',
  module: 'wkt',
  encoding: 'text',
  format: 'wkt-crs',
  extensions: ['wkt'],
  mimeTypes: ['text/plain'],
  category: 'metadata',
  text: true
} as const satisfies Format;
