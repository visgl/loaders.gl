// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {ArrowTable, Geometry} from '@loaders.gl/schema';
import {getGeoMetadata} from '@loaders.gl/schema';
import {convertWKBToGeometry} from '@loaders.gl/arrow-geometry/geometry-codecs';
import type {MLTWriterOptions} from '../mlt-writer';
import {
  concatenateBytes,
  encodeVarints,
  encodeString,
  encodeStream,
  encodeIntegerStream,
  encodeBooleanStream
} from './encode-mlt-streams';
import {encodeGeometryColumn, quantizeGeometry} from './encode-mlt-geometry';

/** Encodes one MLT v1 layer directly from Arrow columns, without a GeoJSON feature intermediate. */
export function encodeMLT(
  input: ArrowTable | arrow.Table,
  options: MLTWriterOptions = {}
): ArrayBuffer {
  const table = input instanceof arrow.Table ? input : input.data;
  const configuration = options.mlt ?? {};
  const extent = configuration.extent ?? 4096;
  const coordinates = configuration.coordinates ?? 'local';
  const layerName = configuration.layerName ?? 'features';
  const maximum = configuration.maxFeatures ?? 100000;
  if (!Number.isInteger(extent) || extent < 1 || extent > 65536)
    throw new Error('Invalid MLT extent');
  if (!['local', 'tile'].includes(coordinates)) throw new Error('Invalid MLT coordinates');
  if (!layerName) throw new Error('MLT layerName must be nonempty');
  if (!Number.isSafeInteger(maximum) || maximum < 1 || table.numRows > maximum)
    throw new Error('MLT feature limit exceeded or invalid');
  const geoMetadata = getGeoMetadata(table.schema.metadata);
  const geometryName = configuration.geometryColumn ?? geoMetadata?.primary_column;
  const candidates = table.schema.fields.filter(field =>
    geometryName
      ? field.name === geometryName
      : field.metadata.get('ARROW:extension:name') === 'geoarrow.wkb'
  );
  if (candidates.length !== 1)
    throw new Error('Select one GeoArrow WKB column with mlt.geometryColumn');
  const geometryField = candidates[0];
  const columnMetadata = geoMetadata?.columns[geometryField.name];
  if (
    geometryField.metadata.get('ARROW:extension:name') !== 'geoarrow.wkb' &&
    columnMetadata?.encoding !== 'wkb'
  )
    throw new Error('MLT requires GeoArrow WKB; tile native input with the Arrow tiler first');
  const extensionMetadata = JSON.parse(
    geometryField.metadata.get('ARROW:extension:metadata') || '{}'
  );
  const coordinateSystem =
    extensionMetadata.crs ??
    columnMetadata?.crs ??
    (columnMetadata && !Object.hasOwn(columnMetadata, 'crs') ? 'OGC:CRS84' : null);
  if (coordinateSystem != null)
    throw new Error('MLT requires tile-local geometry; use the Arrow tiler for geographic input');
  const geometryColumn = table.getChild(geometryField.name)!;
  const propertyNames =
    configuration.propertyColumns ??
    table.schema.fields
      .filter(
        field =>
          field.name !== geometryField.name &&
          !field.metadata.get('ARROW:extension:name')?.startsWith('geoarrow.') &&
          !geoMetadata?.columns[field.name]
      )
      .map(field => field.name);
  if (new Set(propertyNames).size !== propertyNames.length)
    throw new Error('Duplicate MLT property column');
  const properties = propertyNames.map(name => {
    const column = table.getChild(name);
    if (!column || name === geometryField.name)
      throw new Error(`Unknown MLT property column: ${name}`);
    return {name, column, type: getColumnType(column.type)};
  });
  const identifier = configuration.idColumn ? table.getChild(configuration.idColumn) : null;
  if (configuration.idColumn && !identifier) throw new Error('Unknown MLT idColumn');
  const rows: number[] = [];
  const geometries: Geometry[] = [];
  const identifiers: (number | null)[] = [];
  for (let row = 0; row < table.numRows; row++) {
    if (!geometryColumn.isValid(row)) continue;
    const geometry = quantizeGeometry(
      convertWKBToGeometry(geometryColumn.get(row)),
      coordinates === 'local' ? extent : 1
    );
    if (!geometry) continue;
    const value = identifier?.get(row);
    const numericId = value == null ? null : getScalar(value);
    if (
      numericId !== null &&
      (typeof numericId !== 'number' || !Number.isSafeInteger(numericId) || numericId < 0)
    )
      throw new Error('MLT feature IDs must be nonnegative safe integers');
    rows.push(row);
    geometries.push(geometry);
    identifiers.push(numericId as number | null);
  }
  if (!rows.length) return new ArrayBuffer(0);
  const metadata: Uint8Array[] = [];
  const columns: Uint8Array[] = [];
  if (identifier) {
    const nullable = identifiers.some(value => value === null);
    const longId = identifiers.some(value => value !== null && value > 0xffffffff);
    metadata.push(Uint8Array.of((longId ? 2 : 0) + Number(nullable)));
    columns.push(
      concatenateBytes([
        ...(nullable
          ? [
              encodeBooleanStream(
                0,
                identifiers.map(value => value !== null)
              )
            ]
          : []),
        encodeIntegerStream(
          0x10,
          identifiers.filter((value): value is number => value !== null)
        )
      ])
    );
  }
  metadata.push(Uint8Array.of(4));
  columns.push(encodeGeometryColumn(geometries));
  for (const {name, column, type} of properties) {
    const values = rows
      .map(row => column.get(row))
      .map(value => (value == null ? null : getScalar(value)));
    const nullable = values.some(value => value === null);
    const present = values.filter((value): value is string | number | boolean => value !== null);
    const streams = nullable
      ? [
          encodeBooleanStream(
            0,
            values.map(value => value !== null)
          )
        ]
      : [];
    metadata.push(concatenateBytes([Uint8Array.of(type + Number(nullable)), encodeString(name)]));
    switch (type) {
      case 10:
        streams.push(encodeBooleanStream(0x10, present as boolean[]));
        break;
      case 28: {
        const strings = (present as string[]).map(value => new TextEncoder().encode(value));
        streams.push(
          encodeIntegerStream(
            0x30,
            strings.map(value => value.length)
          )
        );
        const bytes = concatenateBytes(strings);
        streams.push(encodeStream(0x10, 0, bytes.length, bytes));
        break;
      }
      default: {
        // Float64 preserves every supported safe integer, including Arrow Int64, without truncation.
        const bytes = new Uint8Array(present.length * 8);
        const view = new DataView(bytes.buffer);
        for (let index = 0; index < present.length; index++)
          view.setFloat64(index * 8, present[index] as number, true);
        streams.push(encodeStream(0x10, 0, present.length, bytes));
      }
    }
    columns.push(
      concatenateBytes([...(type === 28 ? [encodeVarints([streams.length])] : []), ...streams])
    );
  }
  const body = concatenateBytes([
    Uint8Array.of(1),
    encodeString(layerName),
    encodeVarints([extent, metadata.length]),
    ...metadata,
    ...columns
  ]);
  return concatenateBytes([encodeVarints([body.length]), body]).buffer;
}

/** Maps decoded scalar Arrow types to MLT, rejecting implicit attribute loss. */
function getColumnType(type: arrow.DataType): number {
  if (arrow.DataType.isDictionary(type)) return getColumnType(type.dictionary);
  switch (type.typeId) {
    case arrow.Type.Bool:
      return 10;
    case arrow.Type.Utf8:
      return 28;
    case arrow.Type.Null:
    case arrow.Type.Int:
    case arrow.Type.Float:
      return 26;
    default:
      throw new Error('Unsupported MLT attribute type; select scalar mlt.propertyColumns');
  }
}

/** Rejects integer precision loss and nonfinite numbers rather than silently coercing attributes. */
function getScalar(value: unknown): string | number | boolean {
  if (typeof value === 'bigint') {
    if (value < BigInt(Number.MIN_SAFE_INTEGER) || value > BigInt(Number.MAX_SAFE_INTEGER))
      throw new Error('MLT integer exceeds the supported safe integer range');
    return Number(value);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || (Number.isInteger(value) && !Number.isSafeInteger(value)))
      throw new Error('Invalid or unsafe MLT number');
    return value;
  }
  if (typeof value === 'string' || typeof value === 'boolean') return value;
  throw new Error('Unsupported MLT scalar value');
}
