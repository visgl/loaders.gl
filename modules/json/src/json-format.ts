// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

/** JSON document format. */
export const JSONFormat = {
  name: 'JSON',
  id: 'json',
  module: 'json',
  encoding: 'json',
  format: 'json',
  extensions: ['json', 'geojson'],
  mimeTypes: ['application/json'],
  category: 'table',
  text: true
} as const satisfies Format;

/** GeoJSON document format. */
export const GeoJSONFormat = {
  name: 'GeoJSON',
  id: 'geojson',
  module: 'geojson',
  encoding: 'json',
  format: 'geojson',
  extensions: ['geojson'],
  mimeTypes: ['application/geo+json'],
  category: 'geometry',
  text: true
} as const satisfies Format;

/** Newline-delimited JSON row table format. */
export const NDJSONFormat = {
  name: 'NDJSON',
  id: 'ndjson',
  module: 'json',
  encoding: 'json',
  format: 'ndjson',
  extensions: ['ndjson', 'jsonl'],
  mimeTypes: ['application/x-ndjson', 'application/jsonlines', 'application/json-seq'],
  category: 'table',
  text: true
} as const satisfies Format;

/** Newline-delimited GeoJSON row table format. */
export const NDGeoJSONFormat = {
  name: 'NDJSON',
  id: 'ndjson',
  module: 'json',
  encoding: 'json',
  format: 'ndgeojson',
  extensions: ['ndjson', 'ndgeojson'],
  mimeTypes: [
    'application/geo+x-ndjson',
    'application/geo+x-ldjson',
    'application/jsonlines',
    'application/geo+json-seq',
    'application/x-ndjson'
  ],
  category: 'table',
  text: true
} as const satisfies Format;
