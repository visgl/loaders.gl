// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table as ArrowTable} from 'apache-arrow';
import type {Loader, LoaderOptions} from '@loaders.gl/core/loader-utils';
import type {ObjectRowTable} from '@loaders.gl/core/schema';
import type {MovingObjectTableShape} from '../moving-objects/moving-object-table';
import {AISFormat, testAISText} from './ais-format';

/** Version injected at build time. */
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for `AISLoader`. */
export type AISLoaderOptions = LoaderOptions & {
  /** AIS parser options. */
  ais?: {
    /** Output shape. Default `'arrow'`. */
    shape?: MovingObjectTableShape;
    /** Validate NMEA sentence and tag block checksums. Default `true`. */
    validateChecksum?: boolean;
    /** Skip malformed records instead of throwing. Default `true`. */
    skipInvalidRecords?: boolean;
  };
};

/** Preloads the parser-bearing AIS loader implementation. */
async function preloadAISLoader() {
  const {AISLoaderWithParser} = await import('@loaders.gl/scientific/ais/parser');
  return AISLoaderWithParser;
}

/** Metadata-only loader for maritime AIS reports encapsulated as NMEA text. */
export const AISLoader = {
  supportsNativeArrow: true,
  defaultShape: 'arrow',
  dataType: null as unknown as ArrowTable | ObjectRowTable,
  batchType: null as never,

  ...AISFormat,
  version: VERSION,
  options: {
    ais: {
      shape: 'arrow',
      validateChecksum: true,
      skipInvalidRecords: true
    }
  },
  testText: testAISText,
  preload: preloadAISLoader
} as const satisfies Loader<ArrowTable | ObjectRowTable, never, AISLoaderOptions>;
