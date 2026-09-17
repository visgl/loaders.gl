// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Loader, StrictLoaderOptions} from '@loaders.gl/loader-utils';
// / import type { GLTFLoaderOptions } from '@loaders.gl/gltf';
import type {DracoLoaderOptions} from '@loaders.gl/draco';
import type {ImageBitmapLoaderOptions} from '@loaders.gl/images';

import {VERSION} from './lib/utils/version';
import type {Tiles3DTileContent, Tiles3DTilesetJSONPostprocessed} from './types';
import {Tiles3DFormat} from './tiles-3d-format';
import {deserialize3DTilesWorkerResult, serialize3DTilesWorkerResult} from './lib/worker-transport';

export type Tiles3DLoaderOptions = StrictLoaderOptions &
  /** Options forwarded to the delegated glTF parser. */
  {
    gltf?: {
      /** Optional decoder for embedded SPZ2 payloads; the callback receives explicit LUF coordinates. */
      splatDecoder?: (data: ArrayBuffer, options: {sourceCoordinateSystem: 'LUF'; targetCoordinateSystem?: string}) => unknown | Promise<unknown>;
    };
  } &
  // GLTFLoaderOptions & - TODO not yet exported
  DracoLoaderOptions &
  ImageBitmapLoaderOptions & {
    '3d-tiles'?: {
      /** Whether to parse any embedded glTF binaries (or extract memory for independent glTF parsing) */
      loadGLTF?: boolean;
      /** If renderer doesn't support quantized positions, loader can decode them on CPU */
      decodeQuantizedPositions?: boolean;
      /**
       * Selects tileset-header or render-content parsing. `auto` detects the payload from its
       * bytes and JSON structure; explicit booleans assert the expected category.
       */
      isTileset?: boolean | 'auto';
      /** Maximum parsed implicit-subtree resources retained by each 3D Tiles source. */
      maximumCachedSubtrees?: number;
      /** Controls which axis is "up" in glTF files */
      assetGltfUpAxis?: 'x' | 'y' | 'z' | null;
      /** Color storage format. Defaults to uint8norm for backwards compatibility. */
      colorFormat?: 'uint8norm' | 'float16' | 'float32';
      /** @internal Vector-content metadata supplied by a normalized tileset header. */
      vectorContent?: {clip: boolean};
      /** @internal Spatial transform supplied by a Tiles3DSource. */
      _tilesetOptions?: {spatialReference?: unknown; spatialOptions?: unknown};
    };
  };

/**
 * Loader for 3D Tiles
 */
export const Tiles3DLoader = {
  dataType: null as any,
  batchType: null as never,
  ...Tiles3DFormat,
  version: VERSION,
  /** Loads the parser-bearing 3D Tiles loader implementation. */
  preload: async () => (await import('./tiles-3d-loader-with-parser')).Tiles3DLoaderWithParser,
  serializeWorkerResult: serialize3DTilesWorkerResult,
  deserializeWorkerResult: result => deserialize3DTilesWorkerResult(result, Tiles3DLoader),
  options: {
    '3d-tiles': {
      loadGLTF: true,
      decodeQuantizedPositions: false,
      isTileset: 'auto',
      maximumCachedSubtrees: 32,
      assetGltfUpAxis: null,
      colorFormat: 'uint8norm'
    }
  }
} as const satisfies Loader<
  Tiles3DTileContent | Tiles3DTilesetJSONPostprocessed,
  never,
  Tiles3DLoaderOptions
>;
