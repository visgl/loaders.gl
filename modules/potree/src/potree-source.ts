// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Source, DataSourceOptions} from '@loaders.gl/loader-utils';
import {PotreeNodesSource} from './lib/potree-node-source';

const VERSION = '1.7';

export type PotreeSourceOptions = DataSourceOptions & {
  potree?: {};
};

/**
 * Creates point cloud data sources for Potree urls
 */
export const PotreeSource = {
  name: 'Potree',
  id: 'potree',
  module: 'potree',
  version: VERSION,
  extensions: ['bin', 'las', 'laz'],
  mimeTypes: ['application/octet-stream'],
  type: 'potree',
  fromUrl: true,
  fromBlob: true,

  defaultOptions: {
    potree: {}
  },

  testURL: (url: string) => url.endsWith('.js'),
  createDataSource: (url: string, options: PotreeSourceOptions) =>
    new PotreeNodesSource(url, options) // , PotreeNodesSource.defaultOptions)
} as const satisfies Source<PotreeNodesSource>;
