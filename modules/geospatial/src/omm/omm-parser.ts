// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {OMMRow} from './omm-schema';
import {
  OrbitFieldError,
  handleInvalidRecord,
  parseAlpha5CatalogNumber,
  parseOMMEpoch,
  type OrbitRecordErrorOptions
} from './orbit-record-utils';

/** Keywords that every element set must have. */
const REQUIRED_KEYWORDS = [
  'EPOCH',
  'MEAN_MOTION',
  'ECCENTRICITY',
  'INCLINATION',
  'RA_OF_ASC_NODE',
  'ARG_OF_PERICENTER',
  'MEAN_ANOMALY'
] as const;

/** Keywords with a floating-point value. */
const FLOAT_KEYWORDS = [
  'MEAN_MOTION',
  'ECCENTRICITY',
  'INCLINATION',
  'RA_OF_ASC_NODE',
  'ARG_OF_PERICENTER',
  'MEAN_ANOMALY',
  'BSTAR',
  'MEAN_MOTION_DOT',
  'MEAN_MOTION_DDOT'
] as const;

/** Keywords with an integer value. */
const INTEGER_KEYWORDS = ['EPHEMERIS_TYPE', 'ELEMENT_SET_NO', 'REV_AT_EPOCH'] as const;

/** Keywords with a text value. */
const STRING_KEYWORDS = ['OBJECT_NAME', 'OBJECT_ID', 'CLASSIFICATION_TYPE'] as const;

/** Supported values for optional GP metadata keywords. */
const GP_METADATA = {
  CENTER_NAME: ['EARTH'],
  REF_FRAME: ['TEME'],
  TIME_SYSTEM: ['UTC'],
  MEAN_ELEMENT_THEORY: ['SGP4', 'SGP/SGP4']
};

/**
 * Parses OMM text. The function reads the JSON form (an array of OMM objects, as CelesTrak
 * and Space-Track serve it) and the KVN (keyword = value) form.
 *
 * @param text - OMM document text.
 * @param options - Options that select throw or skip for invalid element sets.
 * @returns One row for each valid element set.
 */
export function parseOMMText(text: string, options: OrbitRecordErrorOptions = {}): OMMRow[] {
  const content = text.replace(/^﻿/, '').trimStart();
  if (content.length === 0) {
    return [];
  }
  if (content.startsWith('[') || content.startsWith('{')) {
    let json: unknown;
    try {
      json = JSON.parse(content);
    } catch (error) {
      throw new Error(`OMMLoader: invalid JSON: ${(error as Error).message}`);
    }
    return parseOMMJSON(json, options);
  }
  if (content.startsWith('<')) {
    throw new Error('OMMLoader: the OMM XML form is not supported. Use the JSON or the KVN form.');
  }
  return parseOMMKVNText(text, options);
}

/**
 * Converts parsed OMM JSON to rows.
 *
 * @param json - An array of OMM objects, or one OMM object.
 * @param options - Options that select throw or skip for invalid element sets.
 * @returns One row for each valid element set.
 */
export function parseOMMJSON(json: unknown, options: OrbitRecordErrorOptions = {}): OMMRow[] {
  const objects = Array.isArray(json) ? json : [json];
  const rows: OMMRow[] = [];
  for (let index = 0; index < objects.length; index++) {
    const object = objects[index];
    try {
      if (!object || typeof object !== 'object' || Array.isArray(object)) {
        throw new OrbitFieldError('an element set must be a JSON object');
      }
      rows.push(convertOMMObjectToRow(object as Record<string, unknown>));
    } catch (error) {
      handleInvalidRecord(
        `OMMLoader: element set ${index + 1}: ${getErrorMessage(error)}`,
        options
      );
    }
  }
  return rows;
}

/**
 * Parses the KVN form of OMM. Each `CCSDS_OMM_VERS` line starts a new element set.
 * The parser validates GP metadata and ignores `COMMENT` lines, `USER_DEFINED_*` keywords,
 * other metadata keywords and units in square brackets.
 * It skips the `META_START`, `META_STOP`, `DATA_START` and `DATA_STOP` delimiters while reading
 * their keywords. Other `*_START` blocks are skipped through their matching `*_STOP`, and a
 * missing stop delimiter invalidates the element set.
 *
 * @param text - OMM KVN text.
 * @param options - Options that select throw or skip for invalid element sets.
 * @returns One row for each valid element set.
 */
export function parseOMMKVNText(text: string, options: OrbitRecordErrorOptions = {}): OMMRow[] {
  const lines = text.replace(/^﻿/, '').split(/\r\n|\r|\n/);
  const rows: OMMRow[] = [];
  let record: KVNRecord | null = null;
  let ignoredBlock: {
    /** Line number of the opening delimiter. */
    startLine: number;
    /** Delimiter that closes the block. */
    stopDelimiter: string;
  } | null = null;

  /** Reports an unterminated block or converts the completed record, then clears parser state. */
  const finishRecord = (): void => {
    if (ignoredBlock) {
      handleInvalidRecord(
        `OMMLoader: line ${ignoredBlock.startLine}: unterminated block, expected ${ignoredBlock.stopDelimiter}`,
        options
      );
    } else if (record) {
      convertKVNRecord(record, rows, options);
    }
    ignoredBlock = null;
    record = null;
  };

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const lineNumber = lineIndex + 1;
    const line = lines[lineIndex].trim();
    if (line.length === 0 || line === 'COMMENT' || line.startsWith('COMMENT ')) {
      continue;
    }
    const keywordValue = splitKVNLine(line);
    if (keywordValue?.[0] === 'CCSDS_OMM_VERS') {
      finishRecord();
    }
    if (ignoredBlock) {
      if (line === ignoredBlock.stopDelimiter) {
        ignoredBlock = null;
      }
      continue;
    }
    if (!keywordValue) {
      if (
        line === 'META_START' ||
        line === 'META_STOP' ||
        line === 'DATA_START' ||
        line === 'DATA_STOP'
      ) {
        continue;
      }
      const blockStart = /^([A-Z][A-Z0-9_]*)_START$/.exec(line);
      if (blockStart) {
        ignoredBlock = {startLine: lineNumber, stopDelimiter: `${blockStart[1]}_STOP`};
        continue;
      }
      throw new Error(`OMMLoader: line ${lineNumber}: expected "KEYWORD = value", found "${line}"`);
    }
    const [keyword, value] = keywordValue;
    record ||= {startLine: lineNumber, values: {}, lineNumbers: {}};
    if (keyword in record.values) {
      handleInvalidRecord(
        `OMMLoader: line ${lineNumber}: keyword ${keyword} appears twice in one element set`,
        options
      );
      record = {startLine: lineNumber, values: {}, lineNumbers: {}, invalid: true};
      continue;
    }
    record.values[keyword] = value;
    record.lineNumbers[keyword] = lineNumber;
  }
  finishRecord();
  return rows;
}

/**
 * Converts one OMM object, with CCSDS keyword names, to a validated row.
 * Omitted or blank GP metadata implies Earth, TEME, UTC and SGP4.
 * Number fields can be JSON numbers or numeric strings (Space-Track writes strings).
 *
 * @param object - OMM object, for example one element of CelesTrak `FORMAT=json` output.
 * @returns Validated orbit mean-element row.
 */
export function convertOMMObjectToRow(object: Record<string, unknown>): OMMRow {
  for (const keyword of REQUIRED_KEYWORDS) {
    if (isEmpty(object[keyword])) {
      throw new OrbitFieldError(`required keyword ${keyword} is missing`, keyword);
    }
  }
  for (const [keyword, supportedValues] of Object.entries(GP_METADATA)) {
    const value = object[keyword];
    if (isEmpty(value)) {
      continue;
    }
    if (typeof value !== 'string' || !supportedValues.includes(value.trim().toUpperCase())) {
      const description = typeof value === 'string' ? `"${value}"` : typeof value;
      throw new OrbitFieldError(
        `${keyword} must be ${supportedValues.join(' or ')}, found ${description}`,
        keyword
      );
    }
  }

  const row = {} as OMMRow;
  for (const keyword of STRING_KEYWORDS) {
    row[keyword] = isEmpty(object[keyword]) ? null : String(object[keyword]).trim();
  }
  row.NORAD_CAT_ID = readCatalogNumber(object.NORAD_CAT_ID);
  row.EPOCH = String(object.EPOCH).trim();
  parseOMMEpoch(row.EPOCH);
  for (const keyword of FLOAT_KEYWORDS) {
    row[keyword] = readNumber(object[keyword], keyword) as number;
  }
  for (const keyword of INTEGER_KEYWORDS) {
    const value = readNumber(object[keyword], keyword);
    if (value !== null && !Number.isInteger(value)) {
      throw new OrbitFieldError(`${keyword} must be an integer, found ${value}`, keyword);
    }
    row[keyword] = value;
  }
  validateElements(row);

  // Keep the column order of OMM_COLUMNS.
  return {
    OBJECT_NAME: row.OBJECT_NAME,
    OBJECT_ID: row.OBJECT_ID,
    NORAD_CAT_ID: row.NORAD_CAT_ID,
    EPOCH: row.EPOCH,
    MEAN_MOTION: row.MEAN_MOTION,
    ECCENTRICITY: row.ECCENTRICITY,
    INCLINATION: row.INCLINATION,
    RA_OF_ASC_NODE: row.RA_OF_ASC_NODE,
    ARG_OF_PERICENTER: row.ARG_OF_PERICENTER,
    MEAN_ANOMALY: row.MEAN_ANOMALY,
    EPHEMERIS_TYPE: row.EPHEMERIS_TYPE,
    CLASSIFICATION_TYPE: row.CLASSIFICATION_TYPE,
    ELEMENT_SET_NO: row.ELEMENT_SET_NO,
    REV_AT_EPOCH: row.REV_AT_EPOCH,
    BSTAR: row.BSTAR,
    MEAN_MOTION_DOT: row.MEAN_MOTION_DOT,
    MEAN_MOTION_DDOT: row.MEAN_MOTION_DDOT
  };
}

/**
 * Checks the value ranges of the Keplerian elements.
 *
 * @param row - Row with parsed numbers.
 */
export function validateElements(row: OMMRow): void {
  if (!(row.MEAN_MOTION > 0)) {
    throw new OrbitFieldError(
      `MEAN_MOTION must be positive, found ${row.MEAN_MOTION}`,
      'MEAN_MOTION'
    );
  }
  if (!(row.ECCENTRICITY >= 0 && row.ECCENTRICITY < 1)) {
    throw new OrbitFieldError(
      `ECCENTRICITY must be in the range [0, 1), found ${row.ECCENTRICITY}`,
      'ECCENTRICITY'
    );
  }
  if (!(row.INCLINATION >= 0 && row.INCLINATION <= 180)) {
    throw new OrbitFieldError(
      `INCLINATION must be in the range [0, 180], found ${row.INCLINATION}`,
      'INCLINATION'
    );
  }
}

/** Keyword values of one KVN element set, with the line number of each keyword. */
type KVNRecord = {
  /** Line number of the first keyword of the element set. */
  startLine: number;
  /** Values by keyword. */
  values: Record<string, string>;
  /** Line numbers by keyword. */
  lineNumbers: Record<string, number>;
  /** `true` when the element set had an error and must be skipped. */
  invalid?: boolean;
};

/**
 * Converts one KVN element set and appends the row, or reports the error with a line number.
 *
 * @param record - Keyword values of the element set.
 * @param rows - Output rows.
 * @param options - Options that select throw or skip for invalid element sets.
 */
function convertKVNRecord(
  record: KVNRecord,
  rows: OMMRow[],
  options: OrbitRecordErrorOptions
): void {
  if (record.invalid) {
    return;
  }
  try {
    rows.push(convertOMMObjectToRow(record.values));
  } catch (error) {
    const keyword = error instanceof OrbitFieldError ? error.keyword : undefined;
    const lineNumber = (keyword && record.lineNumbers[keyword]) || record.startLine;
    handleInvalidRecord(`OMMLoader: line ${lineNumber}: ${getErrorMessage(error)}`, options);
  }
}

/**
 * Reads an optional number from a JSON number or a numeric string.
 *
 * @param value - Field value.
 * @param keyword - CCSDS OMM keyword, for the error message.
 * @returns The number, or `null` when the field is empty.
 */
function readNumber(value: unknown, keyword: string): number | null {
  if (isEmpty(value)) {
    return null;
  }
  const number = typeof value === 'number' ? value : Number(String(value).trim());
  if (typeof value === 'boolean' || !Number.isFinite(number)) {
    throw new OrbitFieldError(`${keyword} must be a number, found "${String(value)}"`, keyword);
  }
  return number;
}

/**
 * Reads an optional catalog number. Numeric strings and Alpha-5 strings are accepted.
 *
 * @param value - Field value.
 * @returns The catalog number, or `null` when the field is empty.
 */
function readCatalogNumber(value: unknown): number | null {
  if (isEmpty(value)) {
    return null;
  }
  if (typeof value === 'number') {
    if (!Number.isInteger(value) || value < 0) {
      throw new OrbitFieldError(`invalid catalog number ${value}`, 'NORAD_CAT_ID');
    }
    return value;
  }
  const text = String(value).trim();
  return /^\d+$/.test(text) ? Number(text) : parseAlpha5CatalogNumber(text);
}

/**
 * Returns `true` for `undefined`, `null` and blank strings.
 *
 * @param value - Field value.
 */
function isEmpty(value: unknown): boolean {
  return (
    value === undefined || value === null || (typeof value === 'string' && value.trim() === '')
  );
}

/**
 * Returns the message of an error.
 *
 * @param error - Thrown value.
 */
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Splits a KVN line into its keyword and its value, and removes a trailing `[unit]`.
 * String operations only, so that the time is linear in the line length.
 *
 * @param line - Trimmed KVN line.
 * @returns `[keyword, value]`, or `null` when the line is not `KEYWORD = value`.
 */
function splitKVNLine(line: string): [string, string] | null {
  const equals = line.indexOf('=');
  if (equals < 0) {
    return null;
  }
  const keyword = line.slice(0, equals).trim();
  if (!/^[A-Z0-9_]+$/.test(keyword)) {
    return null;
  }
  let value = line.slice(equals + 1).trim();
  if (value.endsWith(']')) {
    const unitStart = value.lastIndexOf('[');
    if (unitStart >= 0 && value.indexOf(']') === value.length - 1) {
      value = value.slice(0, unitStart).trim();
    }
  }
  return [keyword, value];
}
