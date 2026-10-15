// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {SourceLoader, CoreAPI} from '@loaders.gl/loader-utils';
import type {PotreeSourceLoaderOptions} from './potree-source-options';
export type {PotreeSourceLoaderOptions} from './potree-source-options';
import {PotreeNodesSource} from './lib/potree-node-source';

// @ts-ignore __VERSION__ is injected by the package build.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

import {PotreeBinFormat} from './potree-format';

/**
 * Creates point cloud data sources for Potree urls
 */
export const PotreeSourceLoader = {
  ...PotreeBinFormat,
  dataType: null as unknown as PotreeNodesSource,
  batchType: null as never,
  name: 'Potree',
  id: 'potree',
  module: 'potree',
  version: VERSION,
  extensions: ['bin', 'las', 'laz', 'js', 'json'],
  mimeTypes: ['application/octet-stream'],
  type: 'potree',
  fromUrl: true,
  fromBlob: true,

  options: {
    potree: {colorFormat: 'uint8norm'}
  },

  defaultOptions: {
    potree: {colorFormat: 'uint8norm'}
  },

  testURL: (url: string) => /(?:\.js|(?:^|\/)metadata\.json)(?:[?#]|$)/.test(url),
  createDataSource: (url: string, options: PotreeSourceLoaderOptions, coreApi?: CoreAPI) =>
    new PotreeNodesSource(url, options, coreApi) // , PotreeNodesSource.defaultOptions)
} as const satisfies SourceLoader<PotreeNodesSource>;
