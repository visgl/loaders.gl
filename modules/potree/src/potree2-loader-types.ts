// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {Potree2Metadata} from './potree2-types';

// @ts-ignore __VERSION__ is injected by the package build.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Imports the parser-bearing metadata loader. */
async function preload() {
  const {Potree2LoaderWithParser} = await import('@loaders.gl/potree/potree2-loader');
  return Potree2LoaderWithParser;
}

/** Metadata-only loader for Potree 2.0 metadata.json. */
export const Potree2Loader = {
  name: 'Potree 2.0 metadata',
  id: 'potree2',
  module: 'potree',
  version: VERSION,
  dataType: null as unknown as Potree2Metadata,
  batchType: null as never,
  text: true,
  extensions: ['json'],
  mimeTypes: ['application/json'],
  testText: (text: string) =>
    text.includes('"hierarchy"') && text.includes('"encoding"') && text.includes('"attributes"'),
  options: {},
  preload
} as const satisfies Loader<Potree2Metadata>;
