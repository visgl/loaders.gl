// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {Field, ObjectRowTable, Schema, SchemaMetadata} from '@loaders.gl/core/schema';
import {convertSchemaToArrow} from '@loaders.gl/core/schema-utils';

/** Output shapes for the moving-object loaders. */
export type MovingObjectTableShape = 'arrow' | 'object-row-table';

/** Position fields shared by maritime and aircraft observations. */
export type MovingObjectPosition = {
  /** Observation time in Unix seconds. */
  timestamp: number | null;
  /** Longitude in decimal degrees, east positive. */
  longitude: number | null;
  /** Latitude in decimal degrees, north positive. */
  latitude: number | null;
};

/** Time column shared by both table schemas. */
export const TIMESTAMP_COLUMN = {
  name: 'timestamp',
  type: 'float64',
  nullable: true,
  metadata: {unit: 's'}
} as const satisfies Field;

/** Coordinate columns shared by both table schemas. */
export const COORDINATE_COLUMNS = [
  {name: 'longitude', type: 'float64', nullable: true, metadata: {unit: 'deg'}},
  {name: 'latitude', type: 'float64', nullable: true, metadata: {unit: 'deg'}}
] as const satisfies readonly Field[];

/** Format-specific names and units for speed and direction over ground. */
export const GROUND_MOTION_COLUMNS = {
  ais: [
    {name: 'speedOverGround', type: 'float64', nullable: true, metadata: {unit: 'kn'}},
    {name: 'courseOverGround', type: 'float64', nullable: true, metadata: {unit: 'deg'}}
  ],
  adsb: [
    {name: 'groundSpeed', type: 'float64', nullable: true, metadata: {unit: 'm/s'}},
    {name: 'track', type: 'float64', nullable: true, metadata: {unit: 'deg'}}
  ]
} as const satisfies Record<string, readonly Field[]>;

/** Column definition whose name must correspond to a row property. */
export type MovingObjectColumn<Row> = Field & {name: Extract<keyof Row, string>};

/** Creates an Arrow or object-row table with the same schema, including for empty input. */
export function makeMovingObjectTable<Row extends Record<string, unknown>>(
  rows: Row[],
  fields: readonly MovingObjectColumn<Row>[],
  shape: MovingObjectTableShape,
  metadata: SchemaMetadata = {}
): arrow.Table | ObjectRowTable {
  const schema: Schema = {fields: [...fields], metadata};
  switch (shape) {
    case 'object-row-table':
      return {shape, schema, data: rows};
    case 'arrow': {
      const arrowSchema = convertSchemaToArrow(schema);
      if (!rows.length) {
        return new arrow.Table(arrowSchema);
      }
      const vectors: Record<string, arrow.Vector> = {};
      for (const field of arrowSchema.fields) {
        vectors[field.name] = arrow.vectorFromArray(
          rows.map(row => row[field.name]),
          field.type
        );
      }
      return new arrow.Table(arrowSchema, vectors);
    }
    default:
      throw new Error(`Unsupported moving-object table shape: ${shape as string}`);
  }
}
