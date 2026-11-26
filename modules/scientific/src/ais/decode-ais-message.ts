// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {AISRow} from './ais-schema';

/** Lengths of fixed-size messages in ITU-R M.1371 Annex 8. */
const FIXED_MESSAGE_LENGTHS: Readonly<Partial<Record<number, number>>> = {
  1: 168,
  2: 168,
  3: 168,
  4: 168,
  5: 424,
  18: 168,
  19: 312,
  27: 96
};

/** Removes NMEA armoring and decodes the fields defined by ITU-R M.1371 Annex 8. */
export function decodeAISMessage(
  payload: string,
  fillBits: number,
  timestamp: number | null,
  channel: string | null
): AISRow | null {
  let bits = '';
  for (const character of payload) {
    const code = character.charCodeAt(0);
    const value = code - (code <= 87 ? 48 : 56);
    bits += value.toString(2).padStart(6, '0');
  }
  if (fillBits > 0) {
    if (!bits.endsWith('0'.repeat(fillBits))) {
      throw new Error('nonzero AIS fill bits');
    }
    bits = bits.slice(0, -fillBits);
  }
  if (bits.length < 38) {
    throw new Error('AIS payload is too short for a message header');
  }

  const messageType = readUnsigned(bits, 0, 6);
  const expectedLength = FIXED_MESSAGE_LENGTHS[messageType];
  if (expectedLength !== undefined && bits.length !== expectedLength) {
    throw new Error(`invalid type ${messageType} payload length (${bits.length} bits)`);
  }

  const row: AISRow = {
    timestamp,
    mmsi: readUnsigned(bits, 8, 30),
    messageType,
    longitude: null,
    latitude: null,
    speedOverGround: null,
    courseOverGround: null,
    heading: null,
    rateOfTurn: null,
    navigationStatus: null,
    positionAccuracy: null,
    name: null,
    callSign: null,
    imo: null,
    shipType: null,
    destination: null,
    draught: null,
    dimensionToBow: null,
    dimensionToStern: null,
    dimensionToPort: null,
    dimensionToStarboard: null,
    channel,
    baseStationTimestamp: null
  };

  switch (messageType) {
    case 1:
    case 2:
    case 3: {
      readPositionReport(row, bits, 50);
      row.navigationStatus = readNavigationStatus(bits, 38);
      const turn = readSigned(bits, 42, 8);
      row.rateOfTurn = Math.abs(turn) < 127 ? Math.sign(turn) * (turn / 4.733) ** 2 : null;
      break;
    }
    case 4:
      row.positionAccuracy = Boolean(readUnsigned(bits, 78, 1));
      readCoordinates(row, bits, 79, 28, 27, 600_000);
      row.baseStationTimestamp = readBaseStationTimestamp(bits);
      break;
    case 5:
      row.imo = readUnsigned(bits, 40, 30) || null;
      row.callSign = cleanText(readText(bits, 70, 7));
      row.name = cleanText(readText(bits, 112, 20));
      row.shipType = readUnsigned(bits, 232, 8) || null;
      readDimensions(row, bits, 240);
      row.draught = readUnsigned(bits, 294, 8) / 10 || null;
      row.destination = cleanText(readText(bits, 302, 20));
      break;
    case 18:
      readPositionReport(row, bits, 46);
      break;
    case 19:
      readPositionReport(row, bits, 46);
      row.name = cleanText(readText(bits, 143, 20));
      row.shipType = readUnsigned(bits, 263, 8) || null;
      readDimensions(row, bits, 271);
      break;
    case 21: {
      if (bits.length < 272 || bits.length > 360) {
        throw new Error(`invalid type 21 payload length (${bits.length} bits)`);
      }
      const extensionLength = Math.floor((bits.length - 272) / 6);
      row.name = cleanText(readText(bits, 43, 20) + readText(bits, 272, extensionLength));
      row.positionAccuracy = Boolean(readUnsigned(bits, 163, 1));
      readCoordinates(row, bits, 164, 28, 27, 600_000);
      readDimensions(row, bits, 219);
      break;
    }
    case 24:
      readStaticDataReport(row, bits);
      break;
    case 27: {
      row.positionAccuracy = Boolean(readUnsigned(bits, 38, 1));
      row.navigationStatus = readNavigationStatus(bits, 40);
      readCoordinates(row, bits, 44, 18, 17, 600);
      const speed = readUnsigned(bits, 79, 6);
      const course = readUnsigned(bits, 85, 9);
      row.speedOverGround = speed < 63 ? speed : null;
      row.courseOverGround = course < 360 ? course : null;
      break;
    }
    default:
      return null;
  }
  return row;
}

/** Reads the shared Class A and Class B position fields from their SOG offset. */
function readPositionReport(row: AISRow, bits: string, speedOffset: number): void {
  const speed = readUnsigned(bits, speedOffset, 10);
  const course = readUnsigned(bits, speedOffset + 66, 12);
  const heading = readUnsigned(bits, speedOffset + 78, 9);
  row.speedOverGround = speed < 1023 ? speed / 10 : null;
  row.courseOverGround = course < 3600 ? course / 10 : null;
  row.heading = heading < 360 ? heading : null;
  row.positionAccuracy = Boolean(readUnsigned(bits, speedOffset + 10, 1));
  readCoordinates(row, bits, speedOffset + 11, 28, 27, 600_000);
}

/** Reads signed coordinates and excludes values outside the geographic range. */
function readCoordinates(
  row: AISRow,
  bits: string,
  offset: number,
  longitudeWidth: number,
  latitudeWidth: number,
  scale: number
): void {
  const longitude = readSigned(bits, offset, longitudeWidth) / scale;
  const latitude = readSigned(bits, offset + longitudeWidth, latitudeWidth) / scale;
  row.longitude = Math.abs(longitude) <= 180 ? longitude : null;
  row.latitude = Math.abs(latitude) <= 90 ? latitude : null;
}

/** Reads a navigational status code, treating the undefined code 15 as unavailable. */
function readNavigationStatus(bits: string, offset: number): number | null {
  const status = readUnsigned(bits, offset, 4);
  return status === 15 ? null : status;
}

/** Reads the four offsets to the ship or aid-to-navigation edges, in metres. */
function readDimensions(row: AISRow, bits: string, offset: number): void {
  const bow = readUnsigned(bits, offset, 9);
  const stern = readUnsigned(bits, offset + 9, 9);
  const port = readUnsigned(bits, offset + 18, 6);
  const starboard = readUnsigned(bits, offset + 24, 6);
  if (bow || stern || port || starboard) {
    row.dimensionToBow = bow;
    row.dimensionToStern = stern;
    row.dimensionToPort = port;
    row.dimensionToStarboard = starboard;
  }
}

/** Reads the UTC calendar fields of a base station report, rejecting incomplete dates. */
function readBaseStationTimestamp(bits: string): number | null {
  const year = readUnsigned(bits, 38, 14);
  const month = readUnsigned(bits, 52, 4);
  const day = readUnsigned(bits, 56, 5);
  const hour = readUnsigned(bits, 61, 5);
  const minute = readUnsigned(bits, 66, 6);
  const second = readUnsigned(bits, 72, 6);
  if (
    year < 1 ||
    year > 9999 ||
    month < 1 ||
    month > 12 ||
    !day ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return null;
  }
  const time = new Date(0);
  time.setUTCFullYear(year, month - 1, day);
  time.setUTCHours(hour, minute, second, 0);
  return time.getUTCDate() === day ? time.getTime() / 1000 : null;
}

/** Reads the type 24 name or the separately transmitted ship details. */
function readStaticDataReport(row: AISRow, bits: string): void {
  const part = readUnsigned(bits, 38, 2);
  if (part === 0 && (bits.length === 160 || bits.length === 168)) {
    row.name = cleanText(readText(bits, 40, 20));
  } else if (part === 1 && bits.length === 168) {
    row.shipType = readUnsigned(bits, 40, 8) || null;
    row.callSign = cleanText(readText(bits, 90, 7));
    // Legacy reports from auxiliary craft can put the parent MMSI in the dimensions field.
    if (Math.floor(row.mmsi / 10_000_000) !== 98) {
      readDimensions(row, bits, 132);
    }
  } else {
    throw new Error('invalid type 24 part or payload length');
  }
}

/** Reads an unsigned binary integer from a zero-based bit offset. */
function readUnsigned(bits: string, offset: number, width: number): number {
  return Number.parseInt(bits.slice(offset, offset + width), 2);
}

/** Reads a signed two's complement integer from a zero-based bit offset. */
function readSigned(bits: string, offset: number, width: number): number {
  const unsigned = readUnsigned(bits, offset, width);
  return bits[offset] === '1' ? unsigned - 2 ** width : unsigned;
}

/** Reads ITU-R M.1371 six-bit ASCII text, which differs from the NMEA payload armoring. */
function readText(bits: string, offset: number, length: number): string {
  let text = '';
  for (let index = 0; index < length; index++) {
    const value = readUnsigned(bits, offset + index * 6, 6);
    text += String.fromCharCode(value < 32 ? value + 64 : value);
  }
  return text;
}

/** Removes trailing text padding and maps an empty field to null. */
function cleanText(text: string): string | null {
  return text.replace(/[@ ]+$/, '').trim() || null;
}
