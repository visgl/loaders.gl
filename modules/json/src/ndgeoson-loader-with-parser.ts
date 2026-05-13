// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {parseNDJSONSync} from './lib/parsers/parse-ndjson';
import {parseNDJSONInBatches} from './lib/parsers/parse-ndjson-in-batches';
import type {ArrayRowTable, ObjectRowTable, Batch} from '@loaders.gl/schema';
import {NDJSONLoader as NDJSONLoaderMetadata} from './ndgeoson-loader';

const {preload: _NDJSONLoaderPreload, ...NDJSONLoaderMetadataWithoutPreload} = NDJSONLoaderMetadata;

/** Options for NDGeoJSONLoader */
export type NDGeoJSONLoaderOptions = LoaderOptions & {
  geojson?: {
    shape?: 'object-row-table';
  };
  gis?: {
    format: 'geojson';
  };
};

/** NDGeoJSONLoader */
export const NDJSONLoaderWithParser = {
  ...NDJSONLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer) => parseNDJSONSync(new TextDecoder().decode(arrayBuffer)),
  parseTextSync: parseNDJSONSync,
  parseInBatches: parseNDJSONInBatches
} as const satisfies LoaderWithParser<
  ArrayRowTable | ObjectRowTable,
  Batch,
  NDGeoJSONLoaderOptions
>;
