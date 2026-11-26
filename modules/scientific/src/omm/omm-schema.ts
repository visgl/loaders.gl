// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {DataType, Field, ObjectRowTable, Schema} from '@loaders.gl/core/schema';

/**
 * One mean-element set, with the CCSDS OMM keyword names.
 *
 * `OMMLoader` and `TLELoader` both return rows of this type. Angles are in degrees.
 */
export type OMMRow = {
  /** Spacecraft name. `null` for a two-line TLE set without a name line. */
  OBJECT_NAME: string | null;
  /** International designator, for example `1998-067A`. */
  OBJECT_ID: string | null;
  /** Satellite catalog number. Alpha-5 TLE catalog numbers are converted to integers. */
  NORAD_CAT_ID: number | null;
  /** Epoch of the elements, in UTC, as an ISO 8601 string. */
  EPOCH: string;
  /** Mean motion, in revolutions per day. */
  MEAN_MOTION: number;
  /** Eccentricity, without unit. */
  ECCENTRICITY: number;
  /** Inclination, in degrees. */
  INCLINATION: number;
  /** Right ascension of the ascending node, in degrees. */
  RA_OF_ASC_NODE: number;
  /** Argument of pericenter, in degrees. */
  ARG_OF_PERICENTER: number;
  /** Mean anomaly, in degrees. */
  MEAN_ANOMALY: number;
  /** Ephemeris type. `0` is the usual value for SGP4 element sets. */
  EPHEMERIS_TYPE: number | null;
  /** Classification: `U` (unclassified), `C` or `S`. */
  CLASSIFICATION_TYPE: string | null;
  /** Element set number. */
  ELEMENT_SET_NO: number | null;
  /** Revolution number at epoch. */
  REV_AT_EPOCH: number | null;
  /** SGP4 drag term, in 1/earth radii. */
  BSTAR: number | null;
  /** First derivative of mean motion, in revolutions per day squared (TLE line 1 value). */
  MEAN_MOTION_DOT: number | null;
  /** Second derivative of mean motion, in revolutions per day cubed (TLE line 1 value). */
  MEAN_MOTION_DDOT: number | null;
};

/** Name of one column of the orbit mean-element table. */
export type OMMColumnName = keyof OMMRow;

/** Output shapes that the OMM and TLE loaders can return. */
export type OMMTableShape = 'arrow' | 'object-row-table';

/** Description of one column of the orbit mean-element table. */
type OMMColumn = {
  /** CCSDS OMM keyword. */
  name: OMMColumnName;
  /** loaders.gl data type of the column. */
  type: Extract<DataType, 'utf8' | 'float64' | 'int32'>;
  /** `true` when the column can contain `null`. */
  nullable: boolean;
  /** Unit of the values, stored in the field metadata. */
  unit?: string;
};

/** Columns of the orbit mean-element table, in output order. */
export const OMM_COLUMNS: readonly OMMColumn[] = [
  {name: 'OBJECT_NAME', type: 'utf8', nullable: true},
  {name: 'OBJECT_ID', type: 'utf8', nullable: true},
  {name: 'NORAD_CAT_ID', type: 'int32', nullable: true},
  {name: 'EPOCH', type: 'utf8', nullable: false, unit: 'UTC'},
  {name: 'MEAN_MOTION', type: 'float64', nullable: false, unit: 'rev/day'},
  {name: 'ECCENTRICITY', type: 'float64', nullable: false},
  {name: 'INCLINATION', type: 'float64', nullable: false, unit: 'deg'},
  {name: 'RA_OF_ASC_NODE', type: 'float64', nullable: false, unit: 'deg'},
  {name: 'ARG_OF_PERICENTER', type: 'float64', nullable: false, unit: 'deg'},
  {name: 'MEAN_ANOMALY', type: 'float64', nullable: false, unit: 'deg'},
  {name: 'EPHEMERIS_TYPE', type: 'int32', nullable: true},
  {name: 'CLASSIFICATION_TYPE', type: 'utf8', nullable: true},
  {name: 'ELEMENT_SET_NO', type: 'int32', nullable: true},
  {name: 'REV_AT_EPOCH', type: 'int32', nullable: true},
  {name: 'BSTAR', type: 'float64', nullable: true, unit: '1/ER'},
  {name: 'MEAN_MOTION_DOT', type: 'float64', nullable: true, unit: 'rev/day**2'},
  {name: 'MEAN_MOTION_DDOT', type: 'float64', nullable: true, unit: 'rev/day**3'}
] as const;

/** Schema of the orbit mean-element table. Field metadata holds the `unit` of each column. */
export const OMM_SCHEMA: Schema = {
  fields: OMM_COLUMNS.map(
    (column): Field => ({
      name: column.name,
      type: column.type,
      nullable: column.nullable,
      metadata: column.unit ? {unit: column.unit} : {}
    })
  ),
  metadata: {}
};

/**
 * Makes a table of the requested shape from orbit mean-element rows.
 *
 * @param rows - Validated orbit mean-element rows.
 * @param shape - Requested output shape.
 * @returns An Apache Arrow table or a loaders.gl object-row table.
 */
export function makeOMMTable(rows: OMMRow[], shape: OMMTableShape): arrow.Table | ObjectRowTable {
  switch (shape) {
    case 'arrow':
      return makeOMMArrowTable(rows);
    case 'object-row-table':
      return {shape: 'object-row-table', schema: OMM_SCHEMA, data: rows};
    default:
      throw new Error(`Unsupported orbit element table shape: ${shape as string}`);
  }
}

/**
 * Makes an Apache Arrow table from orbit mean-element rows.
 *
 * @param rows - Validated orbit mean-element rows.
 * @returns Arrow table with one column for each CCSDS OMM keyword.
 */
export function makeOMMArrowTable(rows: OMMRow[]): arrow.Table {
  const fields = OMM_COLUMNS.map(
    column =>
      new arrow.Field(
        column.name,
        getArrowType(column.type),
        column.nullable,
        column.unit ? new Map([['unit', column.unit]]) : undefined
      )
  );
  const schema = new arrow.Schema(fields);
  if (rows.length === 0) {
    return new arrow.Table(schema);
  }
  const vectors: Record<string, arrow.Vector> = {};
  for (const field of fields) {
    const columnName = field.name as OMMColumnName;
    vectors[columnName] = arrow.vectorFromArray(
      rows.map(row => row[columnName]),
      field.type
    );
  }
  return new arrow.Table(schema, vectors);
}

/**
 * Returns the Arrow data type for a loaders.gl column type.
 *
 * @param type - loaders.gl data type of the column.
 * @returns Matching Arrow data type.
 */
function getArrowType(type: OMMColumn['type']): arrow.DataType {
  switch (type) {
    case 'utf8':
      return new arrow.Utf8();
    case 'int32':
      return new arrow.Int32();
    default:
      return new arrow.Float64();
  }
}
