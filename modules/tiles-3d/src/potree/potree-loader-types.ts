// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {CoreAPI, Loader, LoaderOptions} from '@loaders.gl/core/loader-utils';
import type {PotreeMetadata} from './types/potree-metadata';
import type {Potree2Metadata} from './potree2-types';
import type {PotreeSourceLoaderOptions} from './potree-source-options';
import type {PotreeNodesSource} from './lib/potree-node-source';

/** Metadata for either supported Potree wire layout. */
export type PotreeDatasetMetadata = PotreeMetadata | Potree2Metadata;

import {PotreeFormat} from './potree-format';
// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Metadata parsing options shared by both Potree dataset layouts. */
export type POTreeLoaderOptions = LoaderOptions & {
  potree?: {};
};

/** Preloads the parser-bearing Potree loader implementation. */
async function preload() {
  const {PotreeLoaderWithParser} = await import('@loaders.gl/tiles-3d/potree-loader');
  return PotreeLoaderWithParser;
}

const potreeSourceMetadata = {
  type: 'potree',
  fromUrl: true,
  fromBlob: false,
  defaultOptions: {potree: {colorFormat: 'uint8norm'}},
  testURL: (url: string) => /(?:\.js|(?:^|\/)metadata\.json)(?:[?#]|$)/.test(url)
} as const;

/** Lazy descriptor for Potree metadata parsing and point-cloud source creation. */
export const PotreeLoader = {
  ...PotreeFormat,
  ...potreeSourceMetadata,
  dataType: null as unknown as PotreeDatasetMetadata,
  batchType: null as never,

  name: 'Potree',
  id: 'potree',
  module: 'tiles-3d',
  version: VERSION,
  text: true,
  extensions: ['js', 'json'],
  mimeTypes: ['application/json'],
  testText: (text: string) =>
    text.includes('octreeDir') ||
    (text.includes('"hierarchy"') && text.includes('"encoding"') && text.includes('"attributes"')),
  options: {
    potree: {}
  },
  preload,
  createDataSourceSync(
    _url: string,
    _options: PotreeSourceLoaderOptions,
    _coreApi?: CoreAPI
  ): PotreeNodesSource {
    throw new Error('Call preload(PotreeLoader) before creating a source synchronously.');
  }
} as const satisfies Loader<
  PotreeDatasetMetadata,
  never,
  PotreeSourceLoaderOptions,
  PotreeNodesSource
>;
