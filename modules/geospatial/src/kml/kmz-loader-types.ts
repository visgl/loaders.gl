// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {KMZSourceOptions} from './kmz-source';
import type {Table as ArrowTable} from 'apache-arrow';
import type {Loader, LoaderOptions} from '@loaders.gl/core/loader-utils';
import type {GeoJSONTable, ObjectRowTable} from '@loaders.gl/core/schema';
import {KMZFormat} from './kml-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type KMZLoaderOptions = LoaderOptions & {
  kmz?: KMZSourceOptions['kmz'] & {
    shape?: 'object-row-table' | 'geojson-table' | 'arrow';
    includeKMLMetadata?: boolean;
  };
};

/** Preloads the parser-bearing KMZ loader implementation. */
async function preload() {
  return (await import('@loaders.gl/geospatial/kmz')).KMZLoaderWithParser;
}

/** Metadata-only loader for KMZ archives containing KML documents. */
export const KMZLoader = {
  /** Matches input for source selection. */
  testURL: (url: string): boolean => /\.kmz($|[?#])/i.test(url),
  testData: (data: Blob): boolean =>
    ['application/vnd.google-earth.kmz', 'application/vnd.google-earth.kmz+zip'].includes(
      data.type.toLowerCase()
    ),
  fromUrl: true,
  fromBlob: true,
  type: 'kmz',
  supportsNativeArrow: true,
  defaultShape: 'arrow',
  dataType: null as unknown as ObjectRowTable | GeoJSONTable | ArrowTable,
  batchType: null as never,

  ...KMZFormat,
  version: VERSION,
  options: {
    kmz: {shape: 'arrow', includeKMLMetadata: false},
    gis: {}
  },
  preload
} as const satisfies Loader<ObjectRowTable | GeoJSONTable | ArrowTable, never, KMZLoaderOptions>;
