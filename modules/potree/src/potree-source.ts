// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Source, DataSourceOptions, TileRangeRequestSchedulerProps} from '@loaders.gl/loader-utils';
import {PotreeNodesSource} from './lib/potree-node-source';

const VERSION = '1.7';

/** Options for legacy Potree and PotreeConverter 2.x point-cloud sources. */
export type PotreeSourceOptions = DataSourceOptions & {
  potree?: {};
  tileRangeRequest?: TileRangeRequestSchedulerProps & {
    /** Reserved concurrency hint for range-request transports. */
    maxConcurrentRequests?: number;
  };
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
    potree: {},
    tileRangeRequest: {
      batchDelayMs: 50,
      maxGapBytes: 65536,
      rangeExpansionBytes: 65536,
      maxMergedBytes: 8388608,
      maxConcurrentRequests: 6
    }
  },

  testURL: (url: string) => url.endsWith('.js') || url.endsWith('/metadata.json'),
  createDataSource: (url: string, options: PotreeSourceOptions) =>
    new PotreeNodesSource(url, options) // , PotreeNodesSource.defaultOptions)
} as const satisfies Source<PotreeNodesSource>;
