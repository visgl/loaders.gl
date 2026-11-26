// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table as ArrowTable} from 'apache-arrow';
import type {Loader, LoaderOptions} from '@loaders.gl/core/loader-utils';
import type {ObjectRowTable} from '@loaders.gl/core/schema';
import type {OMMTableShape} from './omm-schema';
import {OMMFormat} from './omm-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for `OMMLoader`. */
export type OMMLoaderOptions = LoaderOptions & {
  /** OMM parser options. */
  omm?: {
    /** Output shape. Default `'arrow'`. */
    shape?: OMMTableShape;
    /** When `true`, skip invalid element sets and log a warning. When `false`, throw. Default `false`. */
    skipInvalidRecords?: boolean;
  };
};

/** Preloads the parser-bearing OMM loader implementation. */
async function preloadOMMLoader() {
  const {OMMLoaderWithParser} = await import('@loaders.gl/scientific/omm/parser');
  return OMMLoaderWithParser;
}

/** Metadata-only loader for CCSDS OMM (Orbit Mean-Elements Message) data. */
export const OMMLoader = {
  supportsNativeArrow: true,
  defaultShape: 'arrow',
  dataType: null as unknown as ArrowTable | ObjectRowTable,
  batchType: null as never,

  ...OMMFormat,
  version: VERSION,
  options: {
    omm: {
      shape: 'arrow',
      skipInvalidRecords: false
    }
  },
  preload: preloadOMMLoader
} as const satisfies Loader<ArrowTable | ObjectRowTable, never, OMMLoaderOptions>;
