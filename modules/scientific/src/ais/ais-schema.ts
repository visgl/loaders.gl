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

/** One decoded maritime AIS message. */
export type AISRow = MovingObjectPosition & {
  /** Maritime Mobile Service Identity of the transmitter. */
  mmsi: number;
  /** AIS message type. */
  messageType: number;
  /** Speed over ground in knots. */
  speedOverGround: number | null;
  /** Course over ground in degrees clockwise from true north. */
  courseOverGround: number | null;
  /** True heading in degrees. */
  heading: number | null;
  /** Signed rate of turn in degrees per minute. */
  rateOfTurn: number | null;
  /** AIS navigational status code. */
  navigationStatus: number | null;
  /** `true` for high accuracy (10 m or better). */
  positionAccuracy: boolean | null;
  /** Vessel or aid-to-navigation name. */
  name: string | null;
  /** Radio call sign. */
  callSign: string | null;
  /** Reported IMO ship identification number. */
  imo: number | null;
  /** AIS ship and cargo type code. */
  shipType: number | null;
  /** Reported voyage destination. */
  destination: string | null;
  /** Present static draught in metres. */
  draught: number | null;
  /** Distance from the position reference point to the bow in metres. */
  dimensionToBow: number | null;
  /** Distance from the position reference point to the stern in metres. */
  dimensionToStern: number | null;
  /** Distance from the position reference point to port in metres. */
  dimensionToPort: number | null;
  /** Distance from the position reference point to starboard in metres. */
  dimensionToStarboard: number | null;
  /** Receive channel as recorded in the NMEA sentence. */
  channel: string | null;
  /** UTC time broadcast by a type 4 base station, in Unix seconds. */
  baseStationTimestamp: number | null;
};

/** Columns of the maritime AIS table in output order. */
export const AIS_COLUMNS = [
  TIMESTAMP_COLUMN,
  {name: 'mmsi', type: 'int32', nullable: false},
  {name: 'messageType', type: 'int32', nullable: false},
  ...COORDINATE_COLUMNS,
  ...GROUND_MOTION_COLUMNS.ais,
  {name: 'heading', type: 'int32', nullable: true, metadata: {unit: 'deg'}},
  {name: 'rateOfTurn', type: 'float64', nullable: true, metadata: {unit: 'deg/min'}},
  {name: 'navigationStatus', type: 'int32', nullable: true},
  {name: 'positionAccuracy', type: 'bool', nullable: true},
  {name: 'name', type: 'utf8', nullable: true},
  {name: 'callSign', type: 'utf8', nullable: true},
  {name: 'imo', type: 'int32', nullable: true},
  {name: 'shipType', type: 'int32', nullable: true},
  {name: 'destination', type: 'utf8', nullable: true},
  {name: 'draught', type: 'float64', nullable: true, metadata: {unit: 'm'}},
  {name: 'dimensionToBow', type: 'int32', nullable: true, metadata: {unit: 'm'}},
  {name: 'dimensionToStern', type: 'int32', nullable: true, metadata: {unit: 'm'}},
  {name: 'dimensionToPort', type: 'int32', nullable: true, metadata: {unit: 'm'}},
  {name: 'dimensionToStarboard', type: 'int32', nullable: true, metadata: {unit: 'm'}},
  {name: 'channel', type: 'utf8', nullable: true},
  {...TIMESTAMP_COLUMN, name: 'baseStationTimestamp'}
] as const satisfies readonly MovingObjectColumn<AISRow>[];
