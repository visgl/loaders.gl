// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Loader, StrictLoaderOptions} from '@loaders.gl/loader-utils';
// / import type { GLTFLoaderOptions } from '@loaders.gl/gltf';
import type {DracoLoaderOptions} from '@loaders.gl/draco';
import type {ImageBitmapLoaderOptions} from '@loaders.gl/images';

import {VERSION} from './lib/utils/version';
import type {Tiles3DTileContent, Tiles3DTilesetJSONPostprocessed} from './types';

export type Tiles3DLoaderOptions = StrictLoaderOptions &
  // GLTFLoaderOptions & - TODO not yet exported
  DracoLoaderOptions &
  ImageBitmapLoaderOptions & {
    '3d-tiles'?: {
      /** Whether to parse any embedded glTF binaries (or extract memory for independent glTF parsing) */
      loadGLTF?: boolean;
      /** If renderer doesn't support quantized positions, loader can decode them on CPU */
      decodeQuantizedPositions?: boolean;
      /** Whether this is a tileset or a tile */
      isTileset?: boolean | 'auto';
      /** Controls which axis is "up" in glTF files */
      assetGltfUpAxis?: 'x' | 'y' | 'z' | null;
    };
  };

/**
 * Loader for 3D Tiles
 */
export const Tiles3DLoader = {
  dataType: null as any,
  batchType: null as never,
  id: '3d-tiles',
  name: '3D Tiles',
  module: '3d-tiles',
  version: VERSION,
  extensions: ['cmpt', 'pnts', 'b3dm', 'i3dm'],
  mimeTypes: ['application/octet-stream'],
  tests: ['cmpt', 'pnts', 'b3dm', 'i3dm'],
  /** Loads the parser-bearing 3D Tiles loader implementation. */
  preload: async () => (await import('./tiles-3d-loader-with-parser')).Tiles3DLoaderWithParser,
  options: {
    '3d-tiles': {
      loadGLTF: true,
      decodeQuantizedPositions: false,
      isTileset: 'auto',
      assetGltfUpAxis: null
    }
  }
} as const satisfies Loader<
  Tiles3DTileContent | Tiles3DTilesetJSONPostprocessed,
  never,
  Tiles3DLoaderOptions
>;
