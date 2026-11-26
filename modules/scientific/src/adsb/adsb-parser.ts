// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ADSBRow} from './adsb-schema';

/** International feet to metres. */
const FEET_TO_METRES = 0.3048;

/** Feet per minute to metres per second. */
const FEET_PER_MINUTE_TO_METRES_PER_SECOND = FEET_TO_METRES / 60;

/** Knots to metres per second. */
const KNOTS_TO_METRES_PER_SECOND = 1852 / 3600;

/** Parses either of the two documented aircraft snapshot layouts. */
export function parseADSBText(text: string): ADSBRow[] {
  const snapshot: unknown = JSON.parse(text.replace(/^\uFEFF/, ''));
  if (isObject(snapshot)) {
    // `aircraft` with `now` in seconds, or the v2 API layout: `ac` with `now` in milliseconds.
    const records = Array.isArray(snapshot.aircraft) ? snapshot.aircraft : snapshot.ac;
    if (Array.isArray(records)) {
      const now = readNumber(snapshot.now);
      const snapshotTime = now !== null && !Array.isArray(snapshot.aircraft) ? now / 1000 : now;
      return records.map((aircraft: unknown) => readAircraft(aircraft, snapshotTime));
    }
    if (Array.isArray(snapshot.states)) {
      return snapshot.states.map((state: unknown) => readStateVector(state));
    }
    if (snapshot.states === null && readNumber(snapshot.time) !== null) {
      return [];
    }
  }
  throw new Error('ADSBLoader: expected an aircraft, ac or states snapshot');
}

/** Reads a named-field aircraft record whose altitude, speed and climb use aviation units. */
function readAircraft(aircraft: unknown, snapshotTime: number | null): ADSBRow {
  if (!isObject(aircraft)) {
    throw new Error('ADSBLoader: expected an aircraft object');
  }
  const position = readPosition(aircraft.lon, aircraft.lat);
  const positionAge = readNumber(aircraft.seen_pos);
  const altitude = readNumber(aircraft.alt_baro);
  return {
    timestamp:
      position.longitude !== null && snapshotTime !== null && positionAge !== null
        ? snapshotTime - positionAge
        : null,
    icao24: readAddress(aircraft.hex),
    callsign: readString(aircraft.flight),
    ...position,
    altitudeBaro: scaleNumber(aircraft.alt_baro, FEET_TO_METRES),
    altitudeGeom: scaleNumber(aircraft.alt_geom, FEET_TO_METRES),
    onGround: aircraft.alt_baro === 'ground' ? true : altitude === null ? null : false,
    groundSpeed: scaleNumber(aircraft.gs, KNOTS_TO_METRES_PER_SECOND),
    track: readNumber(aircraft.track),
    verticalRate: scaleNumber(aircraft.baro_rate, FEET_PER_MINUTE_TO_METRES_PER_SECOND),
    squawk: readString(aircraft.squawk),
    category: readString(aircraft.category)
  };
}

/** Reads an indexed aircraft state vector whose measurements already use SI units. */
function readStateVector(state: unknown): ADSBRow {
  if (!Array.isArray(state)) {
    throw new Error('ADSBLoader: expected an aircraft state vector');
  }
  const [
    address,
    callsign,
    ,
    positionTime,
    ,
    longitude,
    latitude,
    altitudeBaro,
    onGround,
    groundSpeed,
    track,
    verticalRate,
    ,
    altitudeGeom,
    squawk,
    ,
    ,
    category
  ]: unknown[] = state;
  const categoryCode = readNumber(category);
  return {
    timestamp: readNumber(positionTime),
    icao24: readAddress(address),
    callsign: readString(callsign),
    ...readPosition(longitude, latitude),
    altitudeBaro: readNumber(altitudeBaro),
    altitudeGeom: readNumber(altitudeGeom),
    onGround: typeof onGround === 'boolean' ? onGround : null,
    groundSpeed: readNumber(groundSpeed),
    track: readNumber(track),
    verticalRate: readNumber(verticalRate),
    squawk: readString(squawk),
    category: categoryCode === null ? null : String(categoryCode)
  };
}

/** Reads a coordinate pair, treating an incomplete pair as an unavailable position. */
function readPosition(
  longitude: unknown,
  latitude: unknown
): Pick<ADSBRow, 'longitude' | 'latitude'> {
  const east = readNumber(longitude);
  const north = readNumber(latitude);
  return east === null || north === null
    ? {longitude: null, latitude: null}
    : {longitude: east, latitude: north};
}

/** Reads the required aircraft address. */
function readAddress(value: unknown): string {
  const address = readString(value);
  if (!address) {
    throw new Error('ADSBLoader: missing aircraft address');
  }
  return address;
}

/** Converts a finite number to a requested unit, preserving missing values. */
function scaleNumber(value: unknown, factor: number): number | null {
  const number = readNumber(value);
  return number === null ? null : number * factor;
}

/** Reads a finite JSON number or returns null. */
function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Reads a trimmed string, mapping an empty field to null. */
function readString(value: unknown): string | null {
  return typeof value === 'string' ? value.trim() || null : null;
}

/** Checks for a JSON object. */
function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
