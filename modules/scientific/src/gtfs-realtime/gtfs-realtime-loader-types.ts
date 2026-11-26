// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table as ArrowTable} from 'apache-arrow';
import type {Loader, LoaderOptions} from '@loaders.gl/core/loader-utils';
import type {ObjectRowTable} from '@loaders.gl/core/schema';
import type {MovingObjectTableShape} from '../moving-objects/moving-object-table';
import {GTFSRealtimeFormat} from './gtfs-realtime-format';
import type {GTFSRealtimeFeed} from './gtfs-realtime-schema';

/** Version injected at build time. */
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for `GTFSRealtimeLoader`. */
export type GTFSRealtimeLoaderOptions = LoaderOptions & {
  /** GTFS Realtime parser options. */
  gtfsRealtime?: {
    /** Output shape. Default `'arrow'`. */
    shape?: MovingObjectTableShape | 'gtfs-realtime-feed';
  };
};

/** Preloads the parser-bearing GTFS Realtime loader implementation. */
async function preloadGTFSRealtimeLoader() {
  const {GTFSRealtimeLoaderWithParser} = await import(
    '@loaders.gl/scientific/gtfs-realtime/bundled'
  );
  return GTFSRealtimeLoaderWithParser;
}

/** Metadata-only loader for binary GTFS Realtime snapshots. */
export const GTFSRealtimeLoader = {
  supportsNativeArrow: true,
  defaultShape: 'arrow',
  dataType: null as unknown as ArrowTable | ObjectRowTable | GTFSRealtimeFeed,
  batchType: null as never,

  ...GTFSRealtimeFormat,
  version: VERSION,
  options: {gtfsRealtime: {shape: 'arrow'}},
  preload: preloadGTFSRealtimeLoader
} as const satisfies Loader<
  ArrowTable | ObjectRowTable | GTFSRealtimeFeed,
  never,
  GTFSRealtimeLoaderOptions
>;
