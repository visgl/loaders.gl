// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table as ArrowTable} from 'apache-arrow';
import type {Loader, LoaderOptions} from '@loaders.gl/core/loader-utils';
import type {ObjectRowTable} from '@loaders.gl/core/schema';
import type {OMMTableShape} from '../omm/omm-schema';
import {TLEFormat} from './tle-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for `TLELoader`. */
export type TLELoaderOptions = LoaderOptions & {
  /** TLE parser options. */
  tle?: {
    /** Output shape. Default `'arrow'`. */
    shape?: OMMTableShape;
    /** When `false`, do not compare the line checksums. Default `true`. */
    validateChecksum?: boolean;
    /** When `true`, skip invalid element sets and log a warning. When `false`, throw. Default `false`. */
    skipInvalidRecords?: boolean;
  };
};

/** Preloads the parser-bearing TLE loader implementation. */
async function preloadTLELoader() {
  const {TLELoaderWithParser} = await import('@loaders.gl/geospatial/tle');
  return TLELoaderWithParser;
}

/** Metadata-only loader for two-line element sets (TLE). */
export const TLELoader = {
  supportsNativeArrow: true,
  defaultShape: 'arrow',
  dataType: null as unknown as ArrowTable | ObjectRowTable,
  batchType: null as never,

  ...TLEFormat,
  version: VERSION,
  options: {
    tle: {
      shape: 'arrow',
      validateChecksum: true,
      skipInvalidRecords: false
    }
  },
  preload: preloadTLELoader
} as const satisfies Loader<ArrowTable | ObjectRowTable, never, TLELoaderOptions>;
