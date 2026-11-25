// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table as ArrowTable} from 'apache-arrow';
import type {Loader, LoaderOptions} from '@loaders.gl/core/loader-utils';
import type {ObjectRowTable} from '@loaders.gl/core/schema';
import type {MovingObjectTableShape} from '../moving-objects/moving-object-table';
import {ADSBFormat, testADSBText} from './adsb-format';

/** Version injected at build time. */
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for `ADSBLoader`. */
export type ADSBLoaderOptions = LoaderOptions & {
  /** ADSB parser options. */
  adsb?: {
    /** Output shape. Default `'arrow'`. */
    shape?: MovingObjectTableShape;
  };
};

/** Preloads the parser-bearing ADSB loader implementation. */
async function preloadADSBLoader() {
  const {ADSBLoaderWithParser} = await import('@loaders.gl/geospatial/adsb/bundled');
  return ADSBLoaderWithParser;
}

/** Metadata-only loader for ADS-B aircraft state JSON snapshots. */
export const ADSBLoader = {
  supportsNativeArrow: true,
  defaultShape: 'arrow',
  dataType: null as unknown as ArrowTable | ObjectRowTable,
  batchType: null as never,

  ...ADSBFormat,
  version: VERSION,
  options: {
    adsb: {
      shape: 'arrow'
    }
  },
  testText: testADSBText,
  preload: preloadADSBLoader
} as const satisfies Loader<ArrowTable | ObjectRowTable, never, ADSBLoaderOptions>;
