// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {JSONLoader} from '@loaders.gl/tables/json/bundled';
import type {JSONLoaderOptions} from '@loaders.gl/tables/json';

/** Creates a caller-side reference loader for comparing the original row parsers. */
function makeReferenceJSONLoader(backend: 'clarinet' | 'fast') {
  return {
    ...JSONLoader,
    id: `reference-json-${backend}`,
    worker: false,
    /** Streams the selected row parser without worker transport. */
    parseInBatches(input: Parameters<typeof JSONLoader.parseInBatches>[0], options?: JSONLoaderOptions) {
      return JSONLoader.parseInBatches(input, {
        ...options,
        json: {...options?.json, backend}
      });
    }
  };
}

/** Website comparison equivalent to the experimental FastJSONLoader. */
export const FastJSONReferenceLoader = makeReferenceJSONLoader('fast');

/** Website comparison using the legacy Clarinet parser. */
export const ClarinetJSONReferenceLoader = makeReferenceJSONLoader('clarinet');
