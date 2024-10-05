// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {GeojsonGeometryInfo} from '@loaders.gl/schema';

export type MVTTile = {
  layers: Record<string, MVTLayer>;
};

export type MVTLayer = {
  version: number;
  name: string;
  extent: number;
  length: number;
  _keys: string[];
  _values: (string | number | boolean | null)[];
  _features: number[];
};

export interface MVTFeature {
  id: number | null;
  type: number;
  properties: Record<string, string | number | boolean | null>;
  extent: any;
  _geometryPos: number;
  _keys: string[];
  _values: (string | number | boolean | null)[];
  _geometryInfo: GeojsonGeometryInfo;
}
