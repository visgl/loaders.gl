// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Schema, FlatIndexedGeometry} from '@loaders.gl/schema';

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
  idColumn: number[];
  boundingBoxColumn: [number, number, number, number][];
  geometryTypeColumn: number[];
  geometryColumn: FlatIndexedGeometry[];
};
