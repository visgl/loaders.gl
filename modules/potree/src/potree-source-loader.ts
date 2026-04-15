// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {SourceLoader, CoreAPI, DataSourceOptions} from '@loaders.gl/loader-utils';
import {PotreeNodesSource} from './lib/potree-node-source';

const VERSION = '1.7';

export type PotreeSourceLoaderOptions = DataSourceOptions & {
  potree?: {};
};

/**
 * Creates point cloud data sources for Potree urls
 */
export const PotreeSourceLoader = {
  dataType: null as unknown as PotreeNodesSource,
  batchType: null as never,
  name: 'Potree',
  id: 'potree',
  module: 'potree',
  version: VERSION,
  extensions: ['bin', 'las', 'laz'],
  mimeTypes: ['application/octet-stream'],
  type: 'potree',
  fromUrl: true,
  fromBlob: true,

  options: {
    potree: {}
  },

  defaultOptions: {
    potree: {}
  },

  testURL: (url: string) => url.endsWith('.js'),
  createDataSource: (url: string, options: PotreeSourceLoaderOptions, coreApi?: CoreAPI) =>
    new PotreeNodesSource(url, options, coreApi) // , PotreeNodesSource.defaultOptions)
} as const satisfies SourceLoader<PotreeNodesSource>;
