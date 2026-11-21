// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ArrowLoaderDefinition} from './arrow-loader-definition';

export type {ArrowLoaderOptions} from './arrow-loader-definition';

/** ArrowJS table loader */
async function preload() {
  const {ArrowLoaderWithParser} = await import('@loaders.gl/tables/arrow');
  const {preloadArrowCompressionDecoders} = await import('./lib/parsers/arrow-compression');
  await preloadArrowCompressionDecoders();
  return {...ArrowLoaderWithParser, loadWorker: loadArrowWorker};
}

/** Starts the browser module worker for Arrow decoding. */
function loadArrowWorker(): Worker | null {
  if (typeof Worker !== 'undefined') {
    return new Worker(new URL('./workers/arrow-worker.js', import.meta.url), {type: 'module'});
  }
  return null;
}

/** Metadata-only Arrow loader with an on-demand browser worker. */
export const ArrowLoader = {
  ...ArrowLoaderDefinition,
  loadWorker: loadArrowWorker,
  preload
} as const;
