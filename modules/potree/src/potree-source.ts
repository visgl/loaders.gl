// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Source} from '@loaders.gl/loader-utils';
import {PotreeNodesSource, PotreeNodesSourceProps} from './lib/potree-node-source';

const VERSION = '1.7';

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
  options: {url: undefined!, potree: {}},
  type: 'potree',
  fromUrl: true,
  fromBlob: true,

  testURL: (url: string) => url.endsWith('.js'),
  createDataSource: (url: string | Blob, props: PotreeNodesSourceProps) =>
    new PotreeNodesSource(url, props)
} as const satisfies Source<PotreeNodesSource, PotreeNodesSourceProps>;
