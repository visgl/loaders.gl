// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {openZipArchive, type ZipEntry} from '@loaders.gl/archives/api';
import type {Field, GeoJSONTable} from '@loaders.gl/core/schema';
import {readGTFSCSVRecords} from './parse-gtfs-csv';
import {
  GTFS_COLUMN_TYPES,
  type GTFSColumnType,
  type GTFSData,
  type GTFSFileWarnings,
  type GTFSRow,
  type GTFSTable
} from './gtfs-schema';

/** Options resolved by the parser-bearing loader. */
type ParseOptions = {
  /** Root CSV files to read, if supplied. */
  files?: readonly string[];
  /** Maximum rows per file. */
  maxRows: number;
  /** Maximum compressed and decoded length of any selected entry. */
  maxEntryBytes: number;
  /** Maximum decoded bytes read across all selected entries. */
  maxTotalBytes: number;
};

/** A CSV column and its optional GTFS-specific conversion. */
type Column = {
  /** Header as published in the feed. */
  name: string;
  /** Type conversion for a column with a known GTFS field type. */
  type?: GTFSColumnType;
  /** Whether to define an own data property explicitly for a prototype-related name. */
  defineOwnProperty: boolean;
  /** Derived service-day seconds column for a source time field. */
  secondsName?: string;
};

/** One point and its position along a published GTFS shape. */
type ShapePoint = {
  /** Order of the point in its shape. */
  sequence: number;
  /** Geographic coordinates in longitude, latitude order. */
  coordinates: [number, number];
};

/** Reads selected root CSV entries and derives feature collections from stops and shapes. */
export async function parseGTFS(
  arrayBuffer: ArrayBuffer,
  options: ParseOptions
): Promise<GTFSData> {
  if (!Number.isSafeInteger(options.maxRows) || options.maxRows < 0) {
    throw new RangeError('GTFS maxRows must be a non-negative safe integer');
  }
  if (!Number.isSafeInteger(options.maxEntryBytes) || options.maxEntryBytes < 1) {
    throw new RangeError('GTFS maxEntryBytes must be a positive safe integer');
  }
  if (!Number.isSafeInteger(options.maxTotalBytes) || options.maxTotalBytes < 1) {
    throw new RangeError('GTFS maxTotalBytes must be a positive safe integer');
  }
  const maxEntryBytes = BigInt(options.maxEntryBytes);
  const totalBytes = {read: 0, limit: options.maxTotalBytes};
  const selectedFiles = options.files?.map(name => (name.endsWith('.txt') ? name : `${name}.txt`));
  const archive = await openZipArchive(arrayBuffer, {
    maxCompressedBytes: maxEntryBytes,
    maxDecodedBytes: maxEntryBytes
  });
  const tables: GTFSData['tables'] = Object.create(null);
  const warnings: GTFSData['warnings'] = Object.create(null);
  try {
    const textEntries: ZipEntry[] = [];
    for await (const entry of archive.entries()) {
      if (!entry.directory && entry.path.endsWith('.txt')) textEntries.push(entry);
    }
    const rootPrefix = getRootPrefix(textEntries);
    if (rootPrefix !== undefined) {
      for (const entry of textEntries) {
        if (!entry.path.startsWith(rootPrefix)) continue;
        const fileName = entry.path.slice(rootPrefix.length);
        if (fileName.includes('/')) continue;
        if (selectedFiles ? !selectedFiles.includes(fileName) : fileName === 'stop_times.txt') {
          continue;
        }
        const name = fileName.slice(0, -4);
        const result = await parseTable(
          limitTotalBytes(archive.readInBatches(entry), totalBytes),
          name,
          entry.path,
          options.maxRows
        ).catch(error => {
          throw getEntryLimitError(error, entry.path, options.maxEntryBytes);
        });
        tables[name] = result.table;
        if (result.warnings.shortRows || result.warnings.longRows) warnings[name] = result.warnings;
      }
    }
  } finally {
    await archive.close();
  }

  return {
    tables,
    warnings,
    stops: makeStops(tables.stops?.data ?? []),
    shapes: makeShapes(tables.shapes?.data ?? [])
  };
}

/** Counts decoded bytes across all selected entries and stops at the total limit. */
async function* limitTotalBytes(
  chunks: AsyncIterable<Uint8Array>,
  totalBytes: {read: number; limit: number}
): AsyncGenerator<Uint8Array> {
  for await (const chunk of chunks) {
    totalBytes.read += chunk.byteLength;
    if (totalBytes.read > totalBytes.limit) {
      throw new RangeError(
        `GTFS selected files are larger than gtfs.maxTotalBytes (${totalBytes.limit} bytes). Increase gtfs.maxTotalBytes or select fewer files with gtfs.files.`
      );
    }
    yield chunk;
  }
}

/** Names the file and the option when a ZIP entry exceeds the per-entry byte limit. */
function getEntryLimitError(error: unknown, filePath: string, maxEntryBytes: number): unknown {
  if (!(error instanceof RangeError) || !/byte limit exceeded/.test(error.message)) {
    return error;
  }
  return new RangeError(
    `GTFS ${filePath} is larger than gtfs.maxEntryBytes (${maxEntryBytes} bytes). Increase gtfs.maxEntryBytes to read it.`,
    {cause: error}
  );
}

/** Finds the ZIP root or a shared top-level folder containing the feed. */
function getRootPrefix(entries: readonly ZipEntry[]): string | undefined {
  if (entries.some(entry => !entry.path.includes('/'))) return '';
  if (!entries.length) return undefined;
  const firstPath = entries[0].path;
  const prefix = firstPath.slice(0, firstPath.indexOf('/') + 1);
  return entries.every(entry => entry.path.startsWith(prefix)) ? prefix : undefined;
}

/** Builds one table directly from CSV records and stops reading on the first excess row. */
async function parseTable(
  chunks: AsyncIterable<Uint8Array>,
  name: string,
  filePath: string,
  maxRows: number
): Promise<{table: GTFSTable; warnings: GTFSFileWarnings}> {
  const knownFields = Object.hasOwn(GTFS_COLUMN_TYPES, name) ? GTFS_COLUMN_TYPES[name] : undefined;
  const table: GTFSTable = {
    shape: 'object-row-table',
    schema: {fields: [], metadata: {}},
    data: []
  };
  const warnings: GTFSFileWarnings = {shortRows: 0, longRows: 0};
  let columns: Column[] | undefined;
  for await (const record of readGTFSCSVRecords(chunks, filePath)) {
    if (!columns) {
      columns = record.map(column => {
        const type =
          knownFields && Object.hasOwn(knownFields, column) ? knownFields[column] : undefined;
        return {
          name: column,
          type,
          defineOwnProperty:
            column === '__proto__' || column === 'constructor' || column === 'prototype',
          secondsName: type === 'time' ? `${column}_seconds` : undefined
        };
      });
      table.schema.fields = makeFields(columns, filePath);
      continue;
    }
    if (table.data.length >= maxRows) {
      throw new RangeError(
        `GTFS ${filePath} exceeds the per-file row limit (${maxRows}). Increase gtfs.maxRows.`
      );
    }
    const location = `${filePath} record ${table.data.length + 2}`;
    if (record.length < columns.length) warnings.shortRows++;
    if (record.length > columns.length) warnings.longRows++;
    const row: GTFSRow = {};
    // Missing trailing fields stay absent, so memory grows only with the bytes read.
    const fieldCount = Math.min(columns.length, record.length);
    for (let index = 0; index < fieldCount; index++) {
      const column = columns[index];
      const value = record[index];
      const parsedValue = parseValue(value, column, location);
      if (column.defineOwnProperty) {
        Object.defineProperty(row, column.name, {
          value: parsedValue,
          enumerable: true,
          writable: true,
          configurable: true
        });
      } else {
        row[column.name] = parsedValue;
      }
      if (column.secondsName) {
        row[column.secondsName] = parseTime(value, column.name, location);
      }
    }
    table.data.push(row);
  }
  return {table, warnings};
}

/** Describes source columns and appends service-day seconds without overwriting source data. */
function makeFields(columns: Column[], filePath: string): Field[] {
  const names = new Set(columns.map(column => column.name));
  if (names.has('') || names.size !== columns.length) {
    throw new Error(`Empty or duplicate GTFS CSV header in ${filePath}`);
  }
  const fields: Field[] = columns.map(column => {
    const numeric = column.type === 'integer' || column.type === 'float';
    return {name: column.name, type: numeric ? 'float64' : 'utf8', nullable: numeric};
  });
  for (const {secondsName} of columns) {
    if (!secondsName) continue;
    if (names.has(secondsName)) {
      throw new Error(
        `GTFS CSV header conflicts with derived column ${secondsName} in ${filePath}`
      );
    }
    fields.push({name: secondsName, type: 'float64', nullable: true, metadata: {unit: 's'}});
  }
  return fields;
}

/** Removes surrounding ASCII spaces from typed fields. */
function trimSpaces(value: string): string {
  return value.startsWith(' ') || value.endsWith(' ') ? value.replace(/^ +| +$/g, '') : value;
}

/** Converts a typed numeric field, leaving identifiers and text in their original form. */
function parseValue(value: string, column: Column, location: string): string | number | null {
  if (column.type !== 'integer' && column.type !== 'float') return value;
  value = trimSpaces(value);
  if (value === '') return null;
  const number = Number(value);
  const valid =
    column.type === 'integer'
      ? /^[+-]?\d+$/.test(value) && Number.isSafeInteger(number)
      : /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value) && Number.isFinite(number);
  if (!valid) throw new Error(`Invalid GTFS ${column.name} in ${location}`);
  return number;
}

/** Converts a service-day time to seconds without wrapping at midnight. */
function parseTime(value: string, column: string, location: string): number | null {
  value = trimSpaces(value);
  if (value === '') return null;
  const parts = /^(\d+):([0-5]\d):([0-5]\d)$/.exec(value);
  const seconds = parts ? Number(parts[1]) * 3600 + Number(parts[2]) * 60 + Number(parts[3]) : NaN;
  if (!Number.isSafeInteger(seconds)) throw new Error(`Invalid GTFS ${column} in ${location}`);
  return seconds;
}

/** Returns a point in GeoJSON axis order when it lies within WGS84 bounds. */
function getCoordinates(longitude: unknown, latitude: unknown): [number, number] | null {
  if (
    typeof longitude !== 'number' ||
    typeof latitude !== 'number' ||
    Math.abs(longitude) > 180 ||
    Math.abs(latitude) > 90
  )
    return null;
  return [longitude, latitude];
}

/** Makes a feature collection from stops that provide usable coordinates. */
function makeStops(rows: GTFSRow[]): GeoJSONTable {
  const table: GeoJSONTable = {shape: 'geojson-table', type: 'FeatureCollection', features: []};
  for (const row of rows) {
    const coordinates = getCoordinates(row.stop_lon, row.stop_lat);
    if (coordinates) {
      table.features.push({
        type: 'Feature',
        geometry: {type: 'Point', coordinates},
        properties: row
      });
    }
  }
  return table;
}

/** Collects and sorts shape points without changing the original CSV row order. */
function makeShapes(rows: GTFSRow[]): GeoJSONTable {
  const pointsByShape = new Map<string, ShapePoint[]>();
  for (const row of rows) {
    const {shape_id: id, shape_pt_sequence: sequence} = row;
    const coordinates = getCoordinates(row.shape_pt_lon, row.shape_pt_lat);
    if (typeof id !== 'string' || !id || typeof sequence !== 'number' || !coordinates) continue;
    const points = pointsByShape.get(id) ?? [];
    points.push({sequence, coordinates});
    pointsByShape.set(id, points);
  }
  const table: GeoJSONTable = {shape: 'geojson-table', type: 'FeatureCollection', features: []};
  for (const [id, points] of pointsByShape) {
    if (points.length < 2) continue;
    points.sort((left, right) => left.sequence - right.sequence);
    table.features.push({
      type: 'Feature',
      id,
      properties: {shape_id: id},
      geometry: {type: 'LineString', coordinates: points.map(point => point.coordinates)}
    });
  }
  return table;
}
