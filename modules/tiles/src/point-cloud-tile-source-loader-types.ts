// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, SourceLoader} from '@loaders.gl/loader-utils';
import type {PointCloudTileSource} from './point-cloud-tile-source-loader';
import type {
  PointCloudTileSourceInput,
  PointCloudTileSourceOptions
} from './point-cloud-tile-source-types';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Loads the optional authoring runtime through an explicit package subpath. */
async function preloadPointCloudTileSource(): Promise<
  typeof import('./point-cloud-tile-source-loader').PointCloudTileSourceLoaderWithParser
> {
  const {PointCloudTileSourceLoaderWithParser} = await import(
    '@loaders.gl/tiles/point-cloud-tile-source-loader'
  );
  return PointCloudTileSourceLoaderWithParser;
}

/** Metadata-only loader for creating an additive point source from decoded Mesh/Arrow input. */
export const PointCloudTileSourceLoader = {
  dataType: null as unknown as PointCloudTileSource,
  batchType: null as never,
  name: 'PointCloudTiler',
  id: 'point-cloud-tiler',
  module: 'tiles',
  version: VERSION,
  extensions: [],
  mimeTypes: [],
  type: 'point-cloud',
  fromUrl: false,
  fromBlob: false,
  testURL: () => false,
  options: {pointCloudTiler: {}},
  defaultOptions: {pointCloudTiler: {}},
  preload: preloadPointCloudTileSource,
  /** Direct construction requires the runtime rather than this metadata export. */
  createDataSource(
    _input: PointCloudTileSourceInput | string | Blob,
    _options: PointCloudTileSourceOptions = {},
    _coreApi?: CoreAPI
  ): PointCloudTileSource {
    throw new Error(
      'PointCloudTileSourceLoader requires preload() or @loaders.gl/tiles/point-cloud-tile-source-loader'
    );
  }
} as const satisfies SourceLoader<PointCloudTileSource>;
