// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  COORDINATE_COLUMNS,
  GROUND_MOTION_COLUMNS,
  TIMESTAMP_COLUMN,
  type MovingObjectColumn,
  type MovingObjectPosition
} from '../moving-objects/moving-object-table';

/** One aircraft state in a snapshot. */
export type ADSBRow = MovingObjectPosition & {
  /** Transponder address as reported in the snapshot. */
  icao24: string;
  /** Trimmed aircraft call sign. */
  callsign: string | null;
  /** Barometric altitude in metres. */
  altitudeBaro: number | null;
  /** Geometric altitude in metres. */
  altitudeGeom: number | null;
  /** Whether the aircraft is on the ground, when reported. */
  onGround: boolean | null;
  /** Ground speed in metres per second. */
  groundSpeed: number | null;
  /** True track in degrees clockwise from north. */
  track: number | null;
  /** Signed vertical rate in metres per second. */
  verticalRate: number | null;
  /** Transponder squawk code, preserving leading zeroes. */
  squawk: string | null;
  /** Source category code represented as text. */
  category: string | null;
};

/** Columns of the ADS-B table in output order. */
export const ADSB_COLUMNS = [
  TIMESTAMP_COLUMN,
  {name: 'icao24', type: 'utf8', nullable: false},
  {name: 'callsign', type: 'utf8', nullable: true},
  ...COORDINATE_COLUMNS,
  {name: 'altitudeBaro', type: 'float64', nullable: true, metadata: {unit: 'm'}},
  {name: 'altitudeGeom', type: 'float64', nullable: true, metadata: {unit: 'm'}},
  {name: 'onGround', type: 'bool', nullable: true},
  ...GROUND_MOTION_COLUMNS.adsb,
  {name: 'verticalRate', type: 'float64', nullable: true, metadata: {unit: 'm/s'}},
  {name: 'squawk', type: 'utf8', nullable: true},
  {name: 'category', type: 'utf8', nullable: true}
] as const satisfies readonly MovingObjectColumn<ADSBRow>[];
