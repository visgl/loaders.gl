// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Schema, GeojsonGeometryInfo} from '@loaders.gl/schema';

export type MVTTile = {
  layers: Record<string, MVTLayer>;
};

export type MVTLayer = {
  version: number;
  name: string;
  extent: number;
  length: number;
  schema: Schema;
  columns: Record<string, (string | number | boolean | null)[]>;
  geometryColumn: unknown[];
  idColumn: number[];
  geometryTypeColumn: number[];
};

export interface MVTFeature {
  id: number | null;
  type: number;
  properties: Record<string, string | number | boolean | null>;
  extent: any;

  // Temporary values used when building up the feature
  _geometryPos: number;
  _keys: string[];
  _values: (string | number | boolean | null)[];
  _geometryInfo: GeojsonGeometryInfo;
}
