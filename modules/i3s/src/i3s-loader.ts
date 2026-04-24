// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Loader, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import type {I3STilesetHeader} from './types';
import {COORDINATE_SYSTEM} from './lib/parsers/constants';
import {I3SParseOptions} from './types';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type I3SLoaderOptions = StrictLoaderOptions & {
  i3s?: I3SParseOptions & {
    /** For I3SAttributeLoader */
    attributeName?: string;
    /** For I3SAttributeLoader */
    attributeType?: string;
  };
};

/**
 * Loader for I3S - Indexed 3D Scene Layer
 */
export const I3SLoader = {
  dataType: null as unknown as I3STilesetHeader,
  batchType: null as never,

  name: 'I3S (Indexed Scene Layers)',
  id: 'i3s',
  module: 'i3s',
  version: VERSION,
  mimeTypes: ['application/octet-stream'],
  /** Loads the parser-bearing I3S loader implementation. */
  preload: async () => (await import('./i3s-loader-with-parser')).I3SLoaderWithParser,
  extensions: ['bin'],
  options: {
    i3s: {
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
    }
  }
} as const satisfies Loader<I3STilesetHeader, never, I3SLoaderOptions>;
