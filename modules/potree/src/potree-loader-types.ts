// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {PotreeMetadata} from './types/potree-metadata';
import type {Potree2Metadata} from './potree2-types';

/** Metadata for either supported Potree wire layout. */
export type PotreeDatasetMetadata = PotreeMetadata | Potree2Metadata;

import {PotreeFormat} from './potree-format';
// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Metadata parsing options shared by both Potree dataset layouts. */
export type POTreeLoaderOptions = LoaderOptions & {
  /** Reserved format-specific metadata options. */
  potree?: {};
};

/** Preloads the parser-bearing Potree loader implementation. */
async function preload() {
  const {PotreeLoaderWithParser} = await import('@loaders.gl/potree/potree-loader');
  return PotreeLoaderWithParser;
}

/** Metadata-only Potree loader. */
export const PotreeLoader = {
  ...PotreeFormat,
  dataType: null as unknown as PotreeDatasetMetadata,
  batchType: null as never,

  name: 'potree metadata',
  id: 'potree',
  module: 'potree',
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
  preload
} as const satisfies Loader<PotreeDatasetMetadata, never, POTreeLoaderOptions>;
