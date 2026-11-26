// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ArrowLoaderDefinition} from './arrow-loader-definition';

export type {ArrowLoaderOptions} from './arrow-loader-definition';

/** ArrowJS table loader */
async function preload() {
  const {ArrowLoaderWithParser} = await import('@loaders.gl/tables/arrow/parser');
  const {preloadArrowCompressionDecoders} = await import('./lib/parsers/arrow-compression');
  await preloadArrowCompressionDecoders();
  return ArrowLoaderWithParser;
}

/** Starts the browser module worker for Arrow decoding. */
function loadArrowWorker(): Worker | null {
  if (typeof Worker !== 'undefined') {
    const moduleUrl = import.meta.url;
    // Native browser workers cannot use the page's import map.
    if (
      /^https?:/.test(moduleUrl) &&
      new URL(moduleUrl).pathname.endsWith('/dist/arrow/arrow-loader-types.js')
    ) {
      const workerUrl = new URL('../arrow-worker.js', moduleUrl);
      return new Worker(workerUrl, {type: 'module'});
    }
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
