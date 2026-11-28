// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {JSONLoader} from '@loaders.gl/tables/json/bundled';
import type {JSONLoaderOptions} from '@loaders.gl/tables/json';
import {_FastStreamingJSONParser, _parseJSONInBatches} from '@loaders.gl/tables/json/api';
import StreamingJSONParser from './streaming-json-parser';

/** Creates a caller-side comparison loader for a reference row parser. */
function makeReferenceJSONLoader(
  backend: 'clarinet' | 'fast',
  Parser: typeof StreamingJSONParser | typeof _FastStreamingJSONParser
) {
  return {
    ...JSONLoader,
    id: `reference-json-${backend}`,
    worker: false,
    /** Streams the selected reference parser without worker transport. */
    parseInBatches(input: Parameters<typeof JSONLoader.parseInBatches>[0], options?: JSONLoaderOptions) {
      return _parseJSONInBatches(input, options ?? {}, {
        parserFactory: parserOptions => new Parser(parserOptions)
      });
    }
  };
}

/** Website reference equivalent to the experimental FastJSONLoader. */
export const FastJSONReferenceLoader = makeReferenceJSONLoader('fast', _FastStreamingJSONParser);

/** Website reference using the legacy Clarinet parser. */
export const ClarinetJSONReferenceLoader = makeReferenceJSONLoader('clarinet', StreamingJSONParser);
