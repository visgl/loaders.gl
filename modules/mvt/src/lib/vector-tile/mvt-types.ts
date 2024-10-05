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

  _currentFeature: number;
  /** list of all keys in layer: Temporary, used when building up the layer */
  _keys: string[];
  /** single list of all values in all columns - Temporary values used when building up the layer */
  _values: (string | number | boolean | null)[];
  /** list of all feature start positions in the PBF - Temporary values used when building up the layer */
  _featurePositions: number[];
  /** list of all geometry start positions in the PBF - Temporary values used when building up the layer */
  _geometryPositions: number[];
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
