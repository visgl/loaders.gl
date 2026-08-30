// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {convertGeoArrowColumn, decodeGeoArrowWKB, encodeGeoArrowWKB} from '@math.gl/geoarrow';
import type {DecodeGeoArrowWKBOptions} from '@math.gl/geoarrow';
import {convertGeometryToWKB, convertGeometryToWKT} from '@loaders.gl/gis';
import type {Geometry, Position} from '@loaders.gl/schema';
import {convertGeoArrowGeometryToGeoJSON} from '../lib/geometry-converters/convert-geoarrow-to-geojson';
import type {GeoArrowEncoding, GeoArrowMetadata} from '../metadata/geoarrow-metadata';
import {getGeometryMetadataForField} from '../metadata/geoarrow-metadata';
import {
  getGeoMetadata,
  type GeoMetadata,
  type GeoColumnMetadata,
  type GeoParquetGeometryType
} from '../metadata/geoparquet-metadata';
import {inspectGeoArrowVector} from '../geoarrow-inspection';
import {
  decodeWKTGeometryCollectionVector,
  decodeWKTNativeVector,
  decodeWKTUnionVector
} from '../lib/kernels/decode-wkt-native';
import {encodeGeoArrowBoxVector} from '../lib/kernels/encode-geoarrow-box';
import {encodeGeoArrowWKTVector} from '../lib/kernels/encode-geoarrow-wkt';
import {assertGeoArrowResourceLimits} from '../geoarrow-resource-limits';
import {
  makeArrowVectorFromGeoArrowColumn,
  makeGeoArrowColumnFromArrowVector
} from '../lib/arrow-geoarrow-adapter';
import {getGeoArrowUnionGeometryKind} from '../lib/kernels/geoarrow-union';

type GeoArrowGeometryKind =
  | 'Point'
  | 'LineString'
  | 'Polygon'
  | 'MultiPoint'
  | 'MultiLineString'
  | 'MultiPolygon'
  | 'GeometryCollection';

type GeometryUnionChildValue =
  | Geometry
  | string
  | Uint8Array
  | (number | null)[]
  | number[][]
  | number[][][]
  | number[][][][]
  | null;

/**
 * Options for converting geometry columns in a GeoArrow table.
 */
export type GeoArrowGeometryTarget = GeoArrowEncoding | 'native';
export type GeoArrowCoordinateLayout = 'interleaved' | 'separated';
export type GeoArrowDimension = 'xy' | 'xyz' | 'xym' | 'xyzm';
export type GeoArrowOffsetType = 'int32' | 'int64';

export type GeoArrowGeometryConvertOptions = {
  /** Optional single geometry column to convert. Defaults to all geometry columns. */
  geometryColumn?: string;
  /** Optional list of geometry columns to convert. Defaults to all geometry columns. */
  geometryColumns?: string[];
  /** Known geometry types used to select an adaptive native target for vector conversion. */
  geometryTypes?: readonly GeoParquetGeometryType[];
  /** Coordinate storage layout for native output. Defaults to interleaved. */
  coordinates?: GeoArrowCoordinateLayout;
  /** Exact coordinate dimensions for native output. */
  dimension?: GeoArrowDimension;
  /** Offset storage width for variable-length native output. Defaults to int32. */
  offsetType?: GeoArrowOffsetType;
  /** Maximum nested GeometryCollection depth. Defaults to 64. */
  maxGeometryCollectionDepth?: number;
  /** Maximum serialized bytes across one WKB or WKT input vector. */
  maxGeometryBytes?: number;
  /** Maximum coordinate vertices across one input vector. */
  maxGeometryVertices?: number;
  /** Behavior when no direct Arrow-buffer kernel exists. Defaults to the compatibility bridge. */
  fallback?: 'geojson' | 'error';
};

const DEFAULT_MAX_GEOMETRY_COLLECTION_DEPTH = 64;

/**
 * Converts one GeoArrow vector to a concrete or adaptive native encoding.
 *
 * Same-encoding conversions return the original vector so all Arrow buffers remain shared.
 *
 * @param column GeoArrow geometry vector.
 * @param sourceEncoding Source GeoArrow encoding.
 * @param targetEncoding Concrete target encoding or the adaptive `native` target.
 * @param options Conversion options and optional geometry type metadata.
 * @returns Converted GeoArrow vector.
 */
export function convertGeoArrowVector(
  column: arrow.Vector,
  sourceEncoding: GeoArrowEncoding,
  targetEncoding: GeoArrowGeometryTarget,
  options?: GeoArrowGeometryConvertOptions
): arrow.Vector {
  const maxGeometryCollectionDepth = getMaxGeometryCollectionDepth(options);
  assertGeoArrowResourceLimits(column, sourceEncoding, options);
  const resolvedTargetEncoding = resolveTargetEncoding(
    targetEncoding,
    sourceEncoding,
    options?.geometryTypes
  );

  if (
    sourceEncoding === resolvedTargetEncoding &&
    canReuseGeoArrowVector(column, resolvedTargetEncoding, options)
  ) {
    return column;
  }

  return convertGeometryColumn(column, sourceEncoding, resolvedTargetEncoding, 'geometry', {
    ...options,
    maxGeometryCollectionDepth
  });
}

/**
 * Converts one vector cell to GeoJSON, including dense-union and geometry-collection columns.
 *
 * Dense union cells need the parent vector's type-id buffer to recover the geometry kind; the
 * ordinary cell converter intentionally has no vector context and therefore cannot decode them.
 *
 * @param column GeoArrow geometry vector.
 * @param rowIndex Row index within the vector.
 * @param encoding Declared GeoArrow encoding.
 * @returns GeoJSON geometry or `null`.
 */
export function convertGeoArrowVectorCellToGeoJSON(
  column: arrow.Vector,
  rowIndex: number,
  encoding: GeoArrowEncoding
): Geometry | null {
  if (encoding === 'geoarrow.geometry') {
    return convertUnionValueToGeometry(
      column.get(rowIndex),
      getDenseUnionGeometryKind(column, rowIndex)
    );
  }
  if (encoding === 'geoarrow.geometrycollection') {
    const collectionValue = column.get(rowIndex);
    if (!collectionValue) return null;
    const childGeometries: Geometry[] = [];
    const unionVector = collectionValue as arrow.Vector;
    for (let memberIndex = 0; memberIndex < unionVector.length; memberIndex++) {
      const geometry = convertUnionValueToGeometry(
        unionVector.get(memberIndex),
        getDenseUnionGeometryKind(unionVector, memberIndex)
      );
      if (geometry) childGeometries.push(geometry);
    }
    return {type: 'GeometryCollection', geometries: childGeometries};
  }
  return convertGeoArrowGeometryToGeoJSON(column.get(rowIndex), encoding);
}

/**
 * Converts one or more geometry columns in a GeoArrow Arrow table to a target GeoArrow encoding.
 * @param table GeoArrow Apache Arrow table.
 * @param targetEncoding Target GeoArrow encoding for selected geometry columns.
 * @param options Conversion options.
 * @returns A new Arrow table with converted geometry columns.
 */
export function convertGeoArrowGeometry(
  table: arrow.Table,
  targetEncoding: GeoArrowGeometryTarget,
  options?: GeoArrowGeometryConvertOptions
): arrow.Table {
  const maxGeometryCollectionDepth = getMaxGeometryCollectionDepth(options);
  const geometryColumns = getGeometryColumnsFromArrowSchema(table.schema);
  const selectedGeometryColumns = resolveGeometryColumns(geometryColumns, options);
  const geoMetadata = getGeoMetadata(table.schema.metadata || new Map());

  if (selectedGeometryColumns.length === 0) {
    throw new Error('GeoArrowGeometryConverter requires at least one geometry column to convert.');
  }

  const convertedEncodings = new Map<string, GeoArrowEncoding>();
  const conversionOptions = new Map<string, GeoArrowGeometryConvertOptions | undefined>();
  for (const geometryColumn of selectedGeometryColumns) {
    const sourceMetadata = geometryColumns[geometryColumn];
    const sourceEncoding = sourceMetadata?.encoding;
    if (!sourceEncoding) {
      throw new Error(`GeoArrowGeometryConverter could not resolve column "${geometryColumn}".`);
    }

    const geometryTypes =
      options?.geometryTypes ||
      geoMetadata?.columns?.[geometryColumn]?.geometry_types ||
      sourceMetadata?.geometry_types ||
      inferGeometryTypes(table, geometryColumn, sourceEncoding);
    const resolvedTargetEncoding = resolveTargetEncoding(
      targetEncoding,
      sourceEncoding,
      geometryTypes
    );
    conversionOptions.set(
      geometryColumn,
      geometryTypes && geometryTypes.length > 0
        ? {...options, geometryTypes, maxGeometryCollectionDepth}
        : {...options, maxGeometryCollectionDepth}
    );
    const sourceVector = table.getChild(geometryColumn);
    if (
      sourceEncoding !== resolvedTargetEncoding ||
      (sourceVector &&
        !canReuseGeoArrowVector(
          sourceVector,
          resolvedTargetEncoding,
          conversionOptions.get(geometryColumn)
        ))
    ) {
      convertedEncodings.set(geometryColumn, resolvedTargetEncoding);
    }
  }

  if (convertedEncodings.size === 0) {
    for (const geometryColumn of selectedGeometryColumns) {
      const sourceMetadata = geometryColumns[geometryColumn];
      const sourceVector = table.getChild(geometryColumn);
      if (sourceMetadata?.encoding && sourceVector) {
        assertGeoArrowResourceLimits(sourceVector, sourceMetadata.encoding, options);
      }
    }
    return table;
  }

  const nextSchemaMetadata = cloneMetadataMap(table.schema.metadata);
  updateGeoMetadata(nextSchemaMetadata, geoMetadata, convertedEncodings, conversionOptions);
  const sourceGeometryColumns = getGeometryColumnsFromArrowSchema(table.schema);
  const convertedColumns = new Map<string, arrow.Vector>();
  for (const [geometryColumn, convertedEncoding] of convertedEncodings) {
    const sourceVector = table.getChild(geometryColumn);
    if (!sourceVector) {
      throw new Error(`GeoArrowGeometryConverter could not resolve column "${geometryColumn}".`);
    }
    convertedColumns.set(
      geometryColumn,
      convertGeoArrowVector(
        sourceVector,
        sourceGeometryColumns[geometryColumn].encoding!,
        convertedEncoding,
        conversionOptions.get(geometryColumn)
      )
    );
  }
  const nextFields = table.schema.fields.map(field => {
    const convertedEncoding = convertedEncodings.get(field.name);
    const convertedVector = convertedColumns.get(field.name);
    return convertedEncoding && convertedVector
      ? createConvertedField(
          field,
          convertedVector.type,
          convertedEncoding,
          conversionOptions.get(field.name)?.geometryTypes,
          conversionOptions.get(field.name),
          geoMetadata?.columns?.[field.name]
        )
      : field;
  });
  const nextSchema = new arrow.Schema(nextFields, nextSchemaMetadata);
  let rowOffset = 0;
  const nextBatches = table.batches.map(batch => {
    const children = table.schema.fields.map(field => {
      const convertedVector = convertedColumns.get(field.name);
      if (!convertedVector) {
        const sourceVector = batch.getChild(field.name);
        if (!sourceVector) {
          throw new Error(`GeoArrowGeometryConverter could not resolve column "${field.name}".`);
        }
        return sourceVector.data[0];
      }
      const batchVector = convertedVector.slice(rowOffset, rowOffset + batch.numRows);
      if (batchVector.data.length !== 1) {
        throw new Error(
          `Converted GeoArrow column "${field.name}" does not align to record batches.`
        );
      }
      return batchVector.data[0];
    });
    rowOffset += batch.numRows;
    return new arrow.RecordBatch(
      nextSchema,
      arrow.makeData({
        type: new arrow.Struct(nextFields),
        length: batch.numRows,
        nullCount: 0,
        children
      })
    );
  });

  return new arrow.Table(nextSchema, nextBatches);
}

/** Inspects all record batches when WKB geometry metadata does not declare geometry types. */
function inferGeometryTypes(
  table: arrow.Table,
  geometryColumn: string,
  sourceEncoding: GeoArrowEncoding
): readonly GeoParquetGeometryType[] | undefined {
  if (sourceEncoding !== 'geoarrow.wkb' && sourceEncoding !== 'geoarrow.wkt') {
    return undefined;
  }
  const vector = table.getChild(geometryColumn);
  if (!vector) return undefined;
  const inspection = inspectGeoArrowVector(vector, sourceEncoding);
  return inspection.geometryTypes.length > 0 ? inspection.geometryTypes : undefined;
}

/**
 * Extracts GeoArrow geometry metadata from an Apache Arrow schema.
 * @param schema Apache Arrow schema.
 * @returns GeoArrow geometry columns keyed by field name.
 */
function getGeometryColumnsFromArrowSchema(schema: arrow.Schema): Record<string, GeoArrowMetadata> {
  const geometryColumns: Record<string, GeoArrowMetadata> = {};

  for (const field of schema.fields) {
    const geometryMetadata = getGeometryMetadataForField(field.metadata || new Map());
    if (geometryMetadata) {
      geometryColumns[field.name] = geometryMetadata;
    }
  }

  return geometryColumns;
}

/**
 * Converts one GeoArrow geometry column to a target encoding.
 * @param column GeoArrow Arrow vector.
 * @param sourceEncoding Source encoding.
 * @param targetEncoding Target encoding.
 * @param geometryColumn Column name for error messages.
 * @returns Converted Arrow vector.
 */
function convertGeometryColumn(
  column: arrow.Vector,
  sourceEncoding: GeoArrowEncoding,
  targetEncoding: GeoArrowEncoding,
  geometryColumn: string,
  options?: GeoArrowGeometryConvertOptions
): arrow.Vector {
  if (targetEncoding === 'geoarrow.box') {
    return encodeGeoArrowBoxVector(column, sourceEncoding, options?.dimension);
  }
  const mathGeoArrowVector = convertGeometryColumnWithMath(
    column,
    sourceEncoding,
    targetEncoding,
    options
  );
  if (mathGeoArrowVector) return mathGeoArrowVector;
  if (targetEncoding === 'geoarrow.wkt') {
    const directWKTVector = encodeGeoArrowWKTVector(column, sourceEncoding, options?.dimension);
    if (directWKTVector) return directWKTVector;
  }
  if (sourceEncoding === 'geoarrow.wkt' && isConcreteNativeEncoding(targetEncoding)) {
    const directWKTVector = decodeWKTNativeVector(
      column,
      targetEncoding,
      options?.dimension,
      options?.coordinates,
      options?.offsetType,
      options?.maxGeometryCollectionDepth
    );
    if (directWKTVector) return directWKTVector;
  }
  if (sourceEncoding === 'geoarrow.wkt' && targetEncoding === 'geoarrow.geometry') {
    const directWKTUnionVector = decodeWKTUnionVector(
      column,
      options?.dimension,
      options?.coordinates,
      options?.offsetType,
      options?.geometryTypes,
      options?.maxGeometryCollectionDepth
    );
    if (directWKTUnionVector) return directWKTUnionVector;
  }
  if (sourceEncoding === 'geoarrow.wkt' && targetEncoding === 'geoarrow.geometrycollection') {
    const directWKTCollectionVector = decodeWKTGeometryCollectionVector(
      column,
      options?.dimension,
      options?.coordinates,
      options?.offsetType,
      options?.geometryTypes,
      options?.maxGeometryCollectionDepth
    );
    if (directWKTCollectionVector) return directWKTCollectionVector;
  }
  if (options?.fallback === 'error') {
    throw new Error(
      `No direct GeoArrow conversion kernel is available for ${sourceEncoding} to ${targetEncoding}.`
    );
  }
  const geometries = extractGeometries(column, sourceEncoding);
  assertGeometryCollectionDepth(geometries, options?.maxGeometryCollectionDepth);
  if (
    (targetEncoding === 'geoarrow.geometry' || targetEncoding === 'geoarrow.geometrycollection') &&
    getGeometryCollectionDepth(geometries) > 1
  ) {
    throw new Error(
      'Native GeoArrow layouts do not support recursive GeometryCollections; keep the column as WKB or WKT.'
    );
  }

  const targetDimension = usesNativeGeoArrowCoordinates(targetEncoding)
    ? getTargetDimension(geometries, options?.dimension)
    : 2;
  const targetDimensionName = usesNativeGeoArrowCoordinates(targetEncoding)
    ? getTargetDimensionName(geometries, options)
    : 'xy';
  if (targetEncoding === 'geoarrow.geometry') {
    return createGeometryUnionVector(
      geometries,
      targetDimension,
      true,
      geometryColumn,
      options,
      getGeometryCollectionDepth(geometries),
      targetDimensionName
    );
  }
  if (targetEncoding === 'geoarrow.geometrycollection') {
    return createGeometryCollectionVector(
      geometries,
      targetDimension,
      geometryColumn,
      options,
      getGeometryCollectionDepth(geometries),
      targetDimensionName
    );
  }
  const targetValues = geometries.map(geometry =>
    convertGeometryValue(geometry, targetEncoding, targetDimension, geometryColumn, options)
  );
  const nativeValues =
    options?.coordinates === 'separated'
      ? targetValues.map(value => separateCoordinateValues(value, targetDimension))
      : targetValues;
  return arrow.vectorFromArray(
    nativeValues,
    getTargetArrowType(
      targetEncoding,
      targetDimension,
      options,
      options?.dimension || getDimensionFromGeometryTypes(options?.geometryTypes)
    )
  );
}

/** Uses math.gl for physical GeoArrow and WKB conversions without materializing geometry rows. */
function convertGeometryColumnWithMath(
  column: arrow.Vector,
  sourceEncoding: GeoArrowEncoding,
  targetEncoding: GeoArrowEncoding,
  options?: GeoArrowGeometryConvertOptions
): arrow.Vector | null {
  const sourceIsNative = isMathGeoArrowNativeEncoding(sourceEncoding);
  const targetIsNative = isMathGeoArrowNativeEncoding(targetEncoding);
  const supportsConversion =
    (sourceEncoding === 'geoarrow.wkb' && targetIsNative) ||
    (sourceIsNative && targetEncoding === 'geoarrow.wkb') ||
    (sourceIsNative && targetIsNative);
  if (!supportsConversion) return null;

  const declaredDimension = getDimensionFromGeometryTypes(options?.geometryTypes);
  const sourceColumn = makeGeoArrowColumnFromArrowVector(column, {
    encoding: sourceEncoding,
    dimension:
      sourceEncoding === 'geoarrow.wkb'
        ? declaredDimension || 'xy'
        : declaredDimension || (targetEncoding === 'geoarrow.wkb' ? options?.dimension : undefined)
  });
  if (sourceEncoding === 'geoarrow.wkb') {
    try {
      const decodedColumn = decodeGeoArrowWKB(sourceColumn, {
        encoding: targetEncoding as DecodeGeoArrowWKBOptions['encoding'],
        dimension: options?.dimension || declaredDimension || 'infer',
        coordinateLayout: options?.coordinates || 'interleaved',
        offsetType: options?.offsetType || 'int32',
        traversal: {maximumDepth: options?.maxGeometryCollectionDepth}
      });
      return makeArrowVectorFromGeoArrowColumn(decodedColumn);
    } catch (error) {
      if (
        options?.maxGeometryCollectionDepth !== undefined &&
        error instanceof Error &&
        error.message.includes('nesting exceeds maximumDepth')
      ) {
        throw new Error(
          `GeometryCollection nesting exceeds maxGeometryCollectionDepth (${options.maxGeometryCollectionDepth}).`
        );
      }
      throw error;
    }
  }
  if (targetEncoding === 'geoarrow.wkb') {
    return makeArrowVectorFromGeoArrowColumn(encodeGeoArrowWKB(sourceColumn));
  }

  const convertedColumn = convertGeoArrowColumn(sourceColumn, {
    encoding: targetEncoding,
    dimension: options?.dimension,
    coordinateLayout: options?.coordinates || 'preserve',
    offsetType: options?.offsetType || 'preserve'
  });
  return convertedColumn === sourceColumn
    ? column
    : makeArrowVectorFromGeoArrowColumn(convertedColumn);
}

/** Returns whether math.gl models an encoding as native physical geometry buffers. */
function isMathGeoArrowNativeEncoding(
  encoding: GeoArrowEncoding
): encoding is Exclude<GeoArrowEncoding, 'geoarrow.box' | 'geoarrow.wkb' | 'geoarrow.wkt'> {
  return (
    encoding === 'geoarrow.point' ||
    encoding === 'geoarrow.linestring' ||
    encoding === 'geoarrow.polygon' ||
    encoding === 'geoarrow.multipoint' ||
    encoding === 'geoarrow.multilinestring' ||
    encoding === 'geoarrow.multipolygon' ||
    encoding === 'geoarrow.geometry' ||
    encoding === 'geoarrow.geometrycollection'
  );
}

/** Returns a validated collection-depth limit for all conversion paths. */
function getMaxGeometryCollectionDepth(options?: GeoArrowGeometryConvertOptions): number {
  const maximumDepth = options?.maxGeometryCollectionDepth ?? DEFAULT_MAX_GEOMETRY_COLLECTION_DEPTH;
  if (!Number.isSafeInteger(maximumDepth) || maximumDepth < 0) {
    throw new Error('maxGeometryCollectionDepth must be a non-negative safe integer.');
  }
  return maximumDepth;
}

/** Rejects hostile or accidentally unbounded nested GeometryCollections without recursion. */
function assertGeometryCollectionDepth(
  geometries: readonly (Geometry | null)[],
  maximumDepth = DEFAULT_MAX_GEOMETRY_COLLECTION_DEPTH
): void {
  const pending: {geometry: Geometry; depth: number}[] = [];
  for (const geometry of geometries) {
    if (geometry) pending.push({geometry, depth: 0});
  }
  while (pending.length > 0) {
    const current = pending.pop()!;
    if (current.geometry.type !== 'GeometryCollection') continue;
    const depth = current.depth + 1;
    if (depth > maximumDepth) {
      throw new Error(
        `GeometryCollection nesting exceeds maxGeometryCollectionDepth (${maximumDepth}).`
      );
    }
    for (const child of current.geometry.geometries) {
      pending.push({geometry: child, depth});
    }
  }
}

function isConcreteNativeEncoding(
  encoding: GeoArrowEncoding
): encoding is
  | 'geoarrow.point'
  | 'geoarrow.linestring'
  | 'geoarrow.polygon'
  | 'geoarrow.multipoint'
  | 'geoarrow.multilinestring'
  | 'geoarrow.multipolygon' {
  return (
    encoding === 'geoarrow.point' ||
    encoding === 'geoarrow.linestring' ||
    encoding === 'geoarrow.polygon' ||
    encoding === 'geoarrow.multipoint' ||
    encoding === 'geoarrow.multilinestring' ||
    encoding === 'geoarrow.multipolygon'
  );
}

/**
 * Converts one geometry value to the requested target encoding payload.
 * @param geometry Source geometry.
 * @param targetEncoding Target GeoArrow encoding.
 * @param targetDimension Target coordinate dimension.
 * @param geometryColumn Column name for error messages.
 * @returns Arrow cell value for the target encoding.
 */
function convertGeometryValue(
  geometry: Geometry | null,
  targetEncoding: GeoArrowEncoding,
  targetDimension: 2 | 3 | 4,
  geometryColumn: string,
  options?: GeoArrowGeometryConvertOptions
): string | Uint8Array | (number | null)[] | number[][] | number[][][] | number[][][][] | null {
  if (!geometry) {
    return null;
  }

  switch (targetEncoding) {
    case 'geoarrow.wkb':
      return new Uint8Array(
        convertGeometryToWKB(geometry, getGeometryWKBOptions(geometry, options))
      );
    case 'geoarrow.wkt':
      return convertGeometryToWKT(geometry, {dimension: getGeometryDimension(geometry, options)});
    case 'geoarrow.point':
      return normalizePointCoordinates(geometry, targetDimension, geometryColumn);
    case 'geoarrow.linestring':
      return normalizeLineStringCoordinates(geometry, targetDimension, geometryColumn);
    case 'geoarrow.polygon':
      return normalizePolygonCoordinates(geometry, targetDimension, geometryColumn);
    case 'geoarrow.multipoint':
      return normalizeMultiPointCoordinates(geometry, targetDimension, geometryColumn);
    case 'geoarrow.multilinestring':
      return normalizeMultiLineStringCoordinates(geometry, targetDimension, geometryColumn);
    case 'geoarrow.multipolygon':
      return normalizeMultiPolygonCoordinates(geometry, targetDimension, geometryColumn);
    default:
      throw new Error(`Unsupported GeoArrow target encoding "${targetEncoding}".`);
  }
}

/**
 * Extracts GeoJSON geometries from a GeoArrow column.
 * @param column GeoArrow column vector.
 * @param sourceEncoding Source GeoArrow encoding.
 * @returns Decoded geometries.
 */
function extractGeometries(
  column: arrow.Vector,
  sourceEncoding: GeoArrowEncoding
): (Geometry | null)[] {
  switch (sourceEncoding) {
    case 'geoarrow.geometry':
      return extractGeometryUnionColumn(column);
    case 'geoarrow.geometrycollection':
      return extractGeometryCollectionColumn(column);
    default: {
      const geometries: (Geometry | null)[] = [];
      for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
        geometries.push(convertGeoArrowGeometryToGeoJSON(column.get(rowIndex), sourceEncoding));
      }
      return geometries;
    }
  }
}

/**
 * Extracts geometries from a `geoarrow.geometry` DenseUnion column.
 * @param column DenseUnion GeoArrow vector.
 * @returns Decoded geometries.
 */
function extractGeometryUnionColumn(column: arrow.Vector): (Geometry | null)[] {
  const geometries: (Geometry | null)[] = [];

  for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
    const geometryKind = getDenseUnionGeometryKind(column, rowIndex);
    geometries.push(convertUnionValueToGeometry(column.get(rowIndex), geometryKind));
  }

  return geometries;
}

/**
 * Extracts geometries from a `geoarrow.geometrycollection` column.
 * @param column List<DenseUnion> GeoArrow vector.
 * @returns Decoded geometry collections.
 */
function extractGeometryCollectionColumn(column: arrow.Vector): (Geometry | null)[] {
  const geometries: (Geometry | null)[] = [];

  for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
    const collectionValue = column.get(rowIndex);
    if (!collectionValue) {
      geometries.push(null);
      continue;
    }

    const childGeometries: Geometry[] = [];
    const unionVector = collectionValue as arrow.Vector;
    for (let memberIndex = 0; memberIndex < unionVector.length; memberIndex++) {
      const geometryKind = getDenseUnionGeometryKind(unionVector, memberIndex);
      const geometry = convertUnionValueToGeometry(unionVector.get(memberIndex), geometryKind);
      if (geometry) {
        childGeometries.push(geometry);
      }
    }

    geometries.push({
      type: 'GeometryCollection',
      geometries: childGeometries
    });
  }

  return geometries;
}

/**
 * Builds a `geoarrow.geometry` DenseUnion vector.
 * @param geometries Source geometries.
 * @param targetDimension Target coordinate dimension.
 * @param allowGeometryCollections Whether geometry collection children are allowed.
 * @param geometryColumn Column name for error messages.
 * @returns DenseUnion vector.
 */
function createGeometryUnionVector(
  geometries: (Geometry | null)[],
  targetDimension: 2 | 3 | 4,
  allowGeometryCollections: boolean,
  geometryColumn: string,
  options?: GeoArrowGeometryConvertOptions,
  geometryCollectionDepth = allowGeometryCollections ? getGeometryCollectionDepth(geometries) : 0,
  targetDimensionName: GeoArrowDimension = getDimensionName(targetDimension)
): arrow.Vector {
  const usedKinds = new Set<GeoArrowGeometryKind>();
  const typeIds: number[] = [];
  const valueOffsets: number[] = [];
  const childValues: Partial<Record<GeoArrowGeometryKind, GeometryUnionChildValue[]>> = {};

  const nullCarrierKind = getNullCarrierKind(geometries, allowGeometryCollections);
  usedKinds.add(nullCarrierKind);
  childValues[nullCarrierKind] = [];
  for (const geometryType of options?.geometryTypes || []) {
    const geometryKind = getBaseGeometryKind(geometryType);
    if (geometryKind && (allowGeometryCollections || geometryKind !== 'GeometryCollection')) {
      usedKinds.add(geometryKind);
      childValues[geometryKind] ||= [];
    }
  }

  for (const geometry of geometries) {
    const geometryKind = geometry?.type || nullCarrierKind;
    if (geometryKind === 'GeometryCollection' && geometryCollectionDepth === 0) {
      throw new Error(
        `GeoArrowGeometryConverter cannot encode GeometryCollection in "${geometryColumn}" without a geometrycollection child.`
      );
    }

    const childKind = (geometryKind || nullCarrierKind) as GeoArrowGeometryKind;
    usedKinds.add(childKind);
    childValues[childKind] ||= [];
    valueOffsets.push(childValues[childKind]!.length);
    typeIds.push(getUnionTypeId(childKind, targetDimension, targetDimensionName));

    childValues[childKind]!.push(
      geometry ? convertGeometryToUnionChildValue(geometry, targetDimension, geometryColumn) : null
    );
  }

  const orderedKinds = [...usedKinds].sort(
    (leftKind, rightKind) =>
      getUnionTypeId(leftKind, targetDimension, targetDimensionName) -
      getUnionTypeId(rightKind, targetDimension, targetDimensionName)
  );
  const fields = orderedKinds.map(
    kind =>
      new arrow.Field(
        getUnionFieldName(kind, targetDimension, targetDimensionName),
        getUnionChildType(
          kind,
          targetDimension,
          options,
          geometryCollectionDepth,
          targetDimensionName
        ),
        true
      )
  );
  const children = orderedKinds.map(kind => {
    const values = childValues[kind] || [];
    return createUnionChildVector(
      kind,
      values,
      targetDimension,
      geometryColumn,
      options,
      geometryCollectionDepth,
      targetDimensionName
    ).data[0];
  });
  const unionType = new arrow.DenseUnion(
    orderedKinds.map(kind => getUnionTypeId(kind, targetDimension, targetDimensionName)),
    fields
  );

  return arrow.makeVector(
    arrow.makeData({
      type: unionType,
      length: geometries.length,
      nullCount: 0,
      typeIds: Int8Array.from(typeIds),
      valueOffsets: Int32Array.from(valueOffsets),
      children
    })
  );
}

/**
 * Builds a `geoarrow.geometrycollection` vector.
 * @param geometries Source geometries.
 * @param targetDimension Target coordinate dimension.
 * @param geometryColumn Column name for error messages.
 * @returns Geometry collection vector.
 */
function createGeometryCollectionVector(
  geometries: (Geometry | null)[],
  targetDimension: 2 | 3 | 4,
  geometryColumn: string,
  options?: GeoArrowGeometryConvertOptions,
  geometryCollectionDepth = getGeometryCollectionDepth(geometries),
  targetDimensionName: GeoArrowDimension = getDimensionName(targetDimension)
): arrow.Vector {
  const flattenedGeometries: (Geometry | null)[] = [];
  const valueOffsets = [0];
  const validity: boolean[] = [];

  for (const geometry of geometries) {
    if (!geometry) {
      validity.push(false);
      valueOffsets.push(flattenedGeometries.length);
      continue;
    }
    if (geometry.type !== 'GeometryCollection') {
      throw new Error(
        `GeoArrowGeometryConverter cannot encode ${geometry.type} as geoarrow.geometrycollection in column "${geometryColumn}".`
      );
    }

    validity.push(true);
    flattenedGeometries.push(...geometry.geometries);
    valueOffsets.push(flattenedGeometries.length);
  }

  const memberUnionVector = createGeometryUnionVector(
    flattenedGeometries,
    targetDimension,
    false,
    geometryColumn,
    options,
    0,
    targetDimensionName
  );
  const listType = createListType(
    new arrow.Field('geometries', memberUnionVector.type, true),
    options?.offsetType
  );

  const listData = {
    length: geometries.length,
    nullCount: validity.filter(isValid => !isValid).length,
    nullBitmap: createNullBitmap(validity),
    valueOffsets: createOffsetArray(valueOffsets, options?.offsetType),
    child: memberUnionVector.data[0]
  };
  const listDataValue =
    listType instanceof arrow.LargeList
      ? arrow.makeData({
          type: listType,
          ...listData,
          valueOffsets: BigInt64Array.from(valueOffsets, BigInt)
        })
      : arrow.makeData({
          type: listType as arrow.List,
          ...listData,
          valueOffsets: Int32Array.from(valueOffsets)
        });
  return arrow.makeVector(listDataValue as any);
}

/**
 * Converts one GeoJSON geometry to a native GeoArrow union child payload.
 * @param geometry Source geometry.
 * @param targetDimension Target coordinate dimension.
 * @param geometryColumn Column name for error messages.
 * @returns Union child payload.
 */
function convertGeometryToUnionChildValue(
  geometry: Geometry,
  targetDimension: 2 | 3 | 4,
  geometryColumn: string
): Geometry | (number | null)[] | number[][] | number[][][] | number[][][][] | null {
  switch (geometry.type) {
    case 'Point':
      return normalizePointCoordinates(geometry, targetDimension, geometryColumn);
    case 'LineString':
      return normalizeLineStringCoordinates(geometry, targetDimension, geometryColumn);
    case 'Polygon':
      return normalizePolygonCoordinates(geometry, targetDimension, geometryColumn);
    case 'MultiPoint':
      return normalizeMultiPointCoordinates(geometry, targetDimension, geometryColumn);
    case 'MultiLineString':
      return normalizeMultiLineStringCoordinates(geometry, targetDimension, geometryColumn);
    case 'MultiPolygon':
      return normalizeMultiPolygonCoordinates(geometry, targetDimension, geometryColumn);
    case 'GeometryCollection':
      return geometry;
  }
}

/**
 * Creates a child vector for a geometry union.
 * @param geometryKind Child geometry kind.
 * @param values Child values.
 * @param targetDimension Target coordinate dimension.
 * @param geometryColumn Column name for error messages.
 * @returns Child vector.
 */
function createUnionChildVector(
  geometryKind: GeoArrowGeometryKind,
  values: unknown[],
  targetDimension: 2 | 3 | 4,
  geometryColumn: string,
  options?: GeoArrowGeometryConvertOptions,
  geometryCollectionDepth = 0,
  dimensionName: GeoArrowDimension = getDimensionName(targetDimension)
): arrow.Vector {
  if (geometryKind === 'GeometryCollection') {
    return createGeometryCollectionVector(
      values as (Geometry | null)[],
      targetDimension,
      geometryColumn,
      options,
      Math.max(geometryCollectionDepth - 1, 0),
      dimensionName
    );
  }

  const nativeValues =
    options?.coordinates === 'separated'
      ? values.map(value => separateCoordinateValues(value, targetDimension))
      : values;
  return arrow.vectorFromArray(
    nativeValues,
    getUnionChildType(
      geometryKind,
      targetDimension,
      options,
      geometryCollectionDepth,
      dimensionName
    )
  );
}

/**
 * Converts a union child value back to GeoJSON geometry.
 * @param value Arrow child value.
 * @param geometryKind Geometry kind.
 * @returns GeoJSON geometry.
 */
function convertUnionValueToGeometry(
  value: unknown,
  geometryKind: GeoArrowGeometryKind
): Geometry | null {
  if (value == null) return null;
  switch (geometryKind) {
    case 'Point':
      return convertGeoArrowGeometryToGeoJSON(value, 'geoarrow.point');
    case 'LineString':
      return convertGeoArrowGeometryToGeoJSON(value, 'geoarrow.linestring');
    case 'Polygon':
      return convertGeoArrowGeometryToGeoJSON(value, 'geoarrow.polygon');
    case 'MultiPoint':
      return convertGeoArrowGeometryToGeoJSON(value, 'geoarrow.multipoint');
    case 'MultiLineString':
      return convertGeoArrowGeometryToGeoJSON(value, 'geoarrow.multilinestring');
    case 'MultiPolygon':
      return convertGeoArrowGeometryToGeoJSON(value, 'geoarrow.multipolygon');
    case 'GeometryCollection': {
      const geometries: Geometry[] = [];
      const unionVector = value as arrow.Vector;
      for (let memberIndex = 0; memberIndex < unionVector.length; memberIndex++) {
        const childGeometryKind = getDenseUnionGeometryKind(unionVector, memberIndex);
        const geometry = convertUnionValueToGeometry(
          unionVector.get(memberIndex),
          childGeometryKind
        );
        if (geometry) {
          geometries.push(geometry);
        }
      }
      return {type: 'GeometryCollection', geometries};
    }
    default:
      throw new Error(`Unsupported geometry kind "${geometryKind}".`);
  }
}

/**
 * Returns the union cell type identifier for one row.
 * @param vector DenseUnion vector or sliced nested vector.
 * @param rowIndex Row index within the vector.
 * @returns Dense union type id and value offset for the row.
 */
function getDenseUnionCellInfo(
  vector: arrow.Vector,
  rowIndex: number
): {typeId: number; valueOffset: number} {
  let remainingRowIndex = rowIndex;

  for (const chunk of vector.data) {
    if (remainingRowIndex < chunk.length) {
      const typeIdIndex = getUnionBufferIndex(
        chunk.typeIds.length,
        chunk.offset,
        remainingRowIndex,
        chunk.typeIds.length <= chunk.length
      );
      const valueOffsetIndex = getUnionBufferIndex(
        chunk.valueOffsets.length,
        chunk.offset,
        remainingRowIndex,
        chunk.typeIds.length <= chunk.length
      );
      return {
        typeId: chunk.typeIds[typeIdIndex],
        valueOffset: chunk.valueOffsets[valueOffsetIndex]
      };
    }
    remainingRowIndex -= chunk.length;
  }

  throw new Error(`DenseUnion row ${rowIndex} is out of bounds.`);
}

/** Resolves union buffer indexes for both full and already-sliced Arrow buffers. */
function getUnionBufferIndex(
  bufferLength: number,
  offset: number,
  rowIndex: number,
  useLogicalIndex: boolean
): number {
  if (useLogicalIndex) return rowIndex;
  const physicalIndex = offset + rowIndex;
  return physicalIndex < bufferLength ? physicalIndex : rowIndex;
}

/**
 * Maps a GeoArrow dense union type id to the base geometry kind.
 * @param typeId GeoArrow union type id.
 * @returns Base geometry kind.
 */
function getDenseUnionGeometryKind(vector: arrow.Vector, rowIndex: number): GeoArrowGeometryKind {
  const {typeId} = getDenseUnionCellInfo(vector, rowIndex);
  if (!(vector.type instanceof arrow.DenseUnion)) {
    throw new Error('GeoArrow geometry storage requires a DenseUnion vector.');
  }
  const childIndex = vector.type.typeIds.indexOf(typeId);
  const fieldName = childIndex >= 0 ? vector.type.children[childIndex]?.name : undefined;
  const geometryKind = getGeoArrowUnionGeometryKind(fieldName, typeId);
  if (!geometryKind) {
    throw new Error(`Unsupported GeoArrow union type id "${typeId}".`);
  }
  return geometryKind;
}

/**
 * Selects a geometry kind that can carry null union members.
 * @param geometries Source geometries.
 * @param allowGeometryCollections Whether geometry collections are valid children.
 * @returns A geometry kind present in the table or a point fallback.
 */
function getNullCarrierKind(
  geometries: (Geometry | null)[],
  allowGeometryCollections: boolean
): GeoArrowGeometryKind {
  for (const geometry of geometries) {
    if (!geometry) {
      continue;
    }
    if (geometry.type === 'GeometryCollection' && !allowGeometryCollections) {
      continue;
    }
    return geometry.type;
  }

  return 'Point';
}

/** Removes a GeoParquet dimension suffix and validates a geometry union child kind. */
function getBaseGeometryKind(geometryType: GeoParquetGeometryType): GeoArrowGeometryKind | null {
  const geometryKind = geometryType.replace(/ (?:ZM|Z|M)$/, '');
  switch (geometryKind) {
    case 'Point':
    case 'LineString':
    case 'Polygon':
    case 'MultiPoint':
    case 'MultiLineString':
    case 'MultiPolygon':
    case 'GeometryCollection':
      return geometryKind;
    default:
      return null;
  }
}

/** Returns the maximum nested GeometryCollection depth in a geometry sequence. */
function getGeometryCollectionDepth(geometries: (Geometry | null)[]): number {
  let maximumDepth = 0;
  for (const geometry of geometries) {
    if (geometry?.type === 'GeometryCollection') {
      maximumDepth = Math.max(maximumDepth, 1 + getGeometryCollectionDepth(geometry.geometries));
    }
  }
  return maximumDepth;
}

/**
 * Returns the GeoArrow union type id for a geometry kind and coordinate dimension.
 * @param geometryKind Geometry kind.
 * @param targetDimension Coordinate dimension.
 * @returns GeoArrow union type id.
 */
function getUnionTypeId(
  geometryKind: GeoArrowGeometryKind,
  targetDimension: 2 | 3 | 4,
  dimensionName = getDimensionName(targetDimension)
): number {
  const baseTypeId = getUnionBaseTypeId(geometryKind);

  switch (dimensionName) {
    case 'xy':
      return baseTypeId;
    case 'xyz':
      return 10 + baseTypeId;
    case 'xym':
      return 20 + baseTypeId;
    case 'xyzm':
      return 30 + baseTypeId;
    default:
      return baseTypeId;
  }
}

/**
 * Returns the GeoArrow child field name for a dense union member.
 * @param geometryKind Geometry kind.
 * @param targetDimension Coordinate dimension.
 * @returns Arrow field name.
 */
function getUnionFieldName(
  geometryKind: GeoArrowGeometryKind,
  targetDimension: 2 | 3 | 4,
  dimensionName = getDimensionName(targetDimension)
): string {
  switch (dimensionName) {
    case 'xy':
      return geometryKind;
    case 'xyz':
      return `${geometryKind} Z`;
    case 'xym':
      return `${geometryKind} M`;
    case 'xyzm':
      return `${geometryKind} ZM`;
    default:
      return geometryKind;
  }
}

/**
 * Returns the Arrow child type for one dense union member.
 * @param geometryKind Geometry kind.
 * @param targetDimension Coordinate dimension.
 * @returns Arrow child type.
 */
function getUnionChildType(
  geometryKind: GeoArrowGeometryKind,
  targetDimension: 2 | 3 | 4,
  options?: GeoArrowGeometryConvertOptions,
  geometryCollectionDepth = 0,
  dimensionName: GeoArrowDimension = getDimensionName(targetDimension)
): arrow.DataType {
  if (geometryKind === 'GeometryCollection') {
    return buildGeometryCollectionType(
      targetDimension,
      options,
      Math.max(geometryCollectionDepth - 1, 0),
      dimensionName
    );
  }

  return getTargetArrowType(
    getGeometryKindEncoding(geometryKind),
    targetDimension,
    options,
    dimensionName
  );
}

/**
 * Packs Arrow validity bits into a null bitmap.
 * @param validity Row validity values.
 * @returns Arrow null bitmap.
 */
function createNullBitmap(validity: boolean[]): Uint8Array {
  const nullBitmap = new Uint8Array(Math.ceil(validity.length / 8));

  for (let index = 0; index < validity.length; index++) {
    if (validity[index]) {
      nullBitmap[index >> 3] |= 1 << (index % 8);
    }
  }

  return nullBitmap;
}

/**
 * Resolves the geometry columns that should be converted.
 * @param geometryColumns Geometry columns from schema metadata.
 * @param options Conversion options.
 * @returns Geometry column names to convert.
 */
function resolveGeometryColumns(
  geometryColumns: Record<string, {encoding?: GeoArrowEncoding}>,
  options?: GeoArrowGeometryConvertOptions
): string[] {
  const availableGeometryColumns = Object.keys(geometryColumns);

  if (options?.geometryColumn && options?.geometryColumns?.length) {
    throw new Error('Specify only one of "geometryColumn" or "geometryColumns".');
  }

  if (options?.geometryColumn) {
    if (!geometryColumns[options.geometryColumn]) {
      throw new Error(
        `GeoArrowGeometryConverter could not find geometry column "${options.geometryColumn}".`
      );
    }
    return [options.geometryColumn];
  }

  if (options?.geometryColumns?.length) {
    for (const geometryColumn of options.geometryColumns) {
      if (!geometryColumns[geometryColumn]) {
        throw new Error(
          `GeoArrowGeometryConverter could not find geometry column "${geometryColumn}".`
        );
      }
    }
    return options.geometryColumns;
  }

  return availableGeometryColumns;
}

/**
 * Creates a cloned field with updated GeoArrow encoding metadata.
 * @param field Source Arrow field.
 * @param type Target Arrow type.
 * @param targetEncoding Target GeoArrow encoding.
 * @returns Converted Arrow field.
 */
function createConvertedField(
  field: arrow.Field,
  type: arrow.DataType,
  targetEncoding: GeoArrowEncoding,
  geometryTypes?: readonly GeoParquetGeometryType[],
  options?: GeoArrowGeometryConvertOptions,
  sourceGeoColumnMetadata?: GeoColumnMetadata
): arrow.Field {
  const metadata = cloneMetadataMap(field.metadata);
  metadata.set('ARROW:extension:name', targetEncoding);
  const effectiveGeometryTypes = options?.dimension
    ? getGeometryTypesForEncoding(targetEncoding, options.dimension)
    : geometryTypes && geometryTypes.length > 0
      ? geometryTypes
      : getGeometryTypesForEncoding(targetEncoding, options?.dimension);
  if (effectiveGeometryTypes.length > 0) {
    const extensionMetadata = {
      ...(getGeometryMetadataForField(metadata) || {}),
      ...getPreservedFieldMetadata(sourceGeoColumnMetadata)
    };
    extensionMetadata.encoding = targetEncoding;
    extensionMetadata.geometry_types = [...effectiveGeometryTypes];
    metadata.set('ARROW:extension:metadata', JSON.stringify(extensionMetadata));
  }
  return new arrow.Field(field.name, type, field.nullable, metadata);
}

/** Carries GeoParquet semantics into the GeoArrow field without copying its file-level encoding. */
function getPreservedFieldMetadata(
  sourceGeoColumnMetadata?: GeoColumnMetadata
): Record<string, unknown> {
  if (!sourceGeoColumnMetadata) return {};
  const preservedMetadata: Record<string, unknown> = {};
  for (const key of ['crs', 'orientation', 'bbox', 'epoch', 'edges']) {
    const value = sourceGeoColumnMetadata[key];
    if (value !== undefined && value !== null && !(key === 'edges' && value === 'planar')) {
      preservedMetadata[key] = value;
    }
  }
  for (const [key, value] of Object.entries(sourceGeoColumnMetadata)) {
    if (!(key in preservedMetadata) && !['encoding', 'geometry_types', 'crs'].includes(key)) {
      preservedMetadata[key] = value;
    }
  }
  return preservedMetadata;
}

/** Derives one concrete geometry type for explicit native dimension metadata. */
function getGeometryTypesForEncoding(
  encoding: GeoArrowEncoding,
  dimension?: GeoArrowDimension
): GeoParquetGeometryType[] {
  if (!dimension) return [];
  const geometryTypeByEncoding: Partial<Record<GeoArrowEncoding, string>> = {
    'geoarrow.point': 'Point',
    'geoarrow.linestring': 'LineString',
    'geoarrow.polygon': 'Polygon',
    'geoarrow.multipoint': 'MultiPoint',
    'geoarrow.multilinestring': 'MultiLineString',
    'geoarrow.multipolygon': 'MultiPolygon'
  };
  const geometryType = geometryTypeByEncoding[encoding];
  if (!geometryType) return [];
  const suffix =
    dimension === 'xy' ? '' : dimension === 'xyz' ? ' Z' : dimension === 'xym' ? ' M' : ' ZM';
  return [`${geometryType}${suffix}` as GeoParquetGeometryType];
}

/**
 * Updates schema-level GeoParquet metadata after geometry conversion.
 * @param metadata Schema metadata map to mutate.
 * @param geoMetadata Parsed GeoParquet metadata.
 * @param selectedGeometryColumns Geometry columns that were converted.
 * @param targetEncoding Target GeoArrow encoding.
 */
function updateGeoMetadata(
  metadata: Map<string, string>,
  geoMetadata: GeoMetadata | null,
  convertedEncodings: Map<string, GeoArrowEncoding>,
  conversionOptions: Map<string, GeoArrowGeometryConvertOptions | undefined>
): void {
  if (!geoMetadata) {
    return;
  }

  const nextGeoMetadata = JSON.parse(JSON.stringify(geoMetadata)) as GeoMetadata;

  for (const [geometryColumn, targetEncoding] of convertedEncodings) {
    const geometryColumnMetadata = nextGeoMetadata.columns?.[geometryColumn];
    if (!geometryColumnMetadata) continue;
    const targetGeoParquetEncoding = getGeoParquetEncoding(targetEncoding);
    if (targetGeoParquetEncoding) {
      geometryColumnMetadata.encoding = targetGeoParquetEncoding;
    }
    const requestedDimension = conversionOptions.get(geometryColumn)?.dimension;
    if (requestedDimension) {
      const geometryTypes = getGeometryTypesForEncoding(targetEncoding, requestedDimension);
      if (geometryTypes.length > 0) {
        geometryColumnMetadata.geometry_types = geometryTypes;
      }
    }
  }

  const remainingGeometryColumns = Object.keys(nextGeoMetadata.columns || {});
  if (
    nextGeoMetadata.primary_column &&
    !nextGeoMetadata.columns?.[nextGeoMetadata.primary_column]
  ) {
    if (remainingGeometryColumns.length > 0) {
      nextGeoMetadata.primary_column = remainingGeometryColumns[0];
    } else {
      delete nextGeoMetadata.primary_column;
    }
  }

  if (remainingGeometryColumns.length === 0) {
    metadata.delete('geo');
    return;
  }

  metadata.set('geo', JSON.stringify(nextGeoMetadata));
}

/** Maps a GeoArrow target to a representable GeoParquet encoding when one exists. */
function getGeoParquetEncoding(targetEncoding: GeoArrowEncoding): string | null {
  switch (targetEncoding) {
    case 'geoarrow.wkb':
      return 'wkb';
    case 'geoarrow.wkt':
      return 'wkt';
    case 'geoarrow.geometry':
      return 'geometry';
    case 'geoarrow.point':
      return 'point';
    case 'geoarrow.linestring':
      return 'linestring';
    case 'geoarrow.polygon':
      return 'polygon';
    case 'geoarrow.multipoint':
      return 'multipoint';
    case 'geoarrow.multilinestring':
      return 'multilinestring';
    case 'geoarrow.multipolygon':
      return 'multipolygon';
    default:
      return null;
  }
}

/**
 * Returns the Arrow data type for a target GeoArrow encoding.
 * @param targetEncoding Target GeoArrow encoding.
 * @param targetDimension Target coordinate dimension.
 * @returns Arrow data type for the converted column.
 */
function getTargetArrowType(
  targetEncoding: GeoArrowEncoding,
  targetDimension: 2 | 3 | 4,
  options?: GeoArrowGeometryConvertOptions,
  dimensionName: GeoArrowDimension = getDimensionName(targetDimension)
): arrow.DataType {
  const coordinateType = getCoordinateType(targetDimension, options?.coordinates, dimensionName);
  const createList = (field: arrow.Field): arrow.DataType =>
    createListType(field, options?.offsetType);

  switch (targetEncoding) {
    case 'geoarrow.geometry':
      return buildGeometryUnionType(targetDimension, true, options, 1, dimensionName);
    case 'geoarrow.geometrycollection':
      return buildGeometryCollectionType(targetDimension, options, 0, dimensionName);
    case 'geoarrow.point':
      return coordinateType;
    case 'geoarrow.linestring':
    case 'geoarrow.multipoint':
      return createList(new arrow.Field('value', coordinateType, true));
    case 'geoarrow.polygon':
    case 'geoarrow.multilinestring':
      return createList(
        new arrow.Field('value', createList(new arrow.Field('value', coordinateType, true)), true)
      );
    case 'geoarrow.multipolygon':
      return createList(
        new arrow.Field(
          'value',
          createList(
            new arrow.Field(
              'value',
              createList(new arrow.Field('value', coordinateType, true)),
              true
            )
          ),
          true
        )
      );
    case 'geoarrow.box':
      return new arrow.Struct(
        getBoxFieldNames(options?.dimension || getDimensionName(targetDimension)).map(
          name => new arrow.Field(name, new arrow.Float64(), true)
        )
      );
    case 'geoarrow.wkb':
      return new arrow.Binary();
    case 'geoarrow.wkt':
      return new arrow.Utf8();
    default:
      throw new Error(`Unsupported GeoArrow target encoding "${targetEncoding}".`);
  }
}

/**
 * Returns true when a target encoding uses native coordinate nesting.
 * @param targetEncoding Target GeoArrow encoding.
 * @returns `true` for native point/line/polygon encodings.
 */
function usesNativeGeoArrowCoordinates(targetEncoding: GeoArrowEncoding): boolean {
  return targetEncoding !== 'geoarrow.wkb' && targetEncoding !== 'geoarrow.wkt';
}

/**
 * Returns whether an explicitly requested native physical layout already matches a vector.
 *
 * Encoding names alone do not describe coordinate layout, dimensions, or offset width. Keeping
 * this check next to the identity fast path prevents an adaptive `native` request from silently
 * ignoring an explicit physical representation requirement.
 *
 * @param column GeoArrow vector to inspect.
 * @param encoding Resolved target encoding.
 * @param options Conversion options.
 * @returns Whether the vector can be reused without conversion.
 */
function canReuseGeoArrowVector(
  column: arrow.Vector,
  encoding: GeoArrowEncoding,
  options?: GeoArrowGeometryConvertOptions
): boolean {
  if (!usesNativeGeoArrowCoordinates(encoding)) {
    return true;
  }

  if (options?.dimension) {
    // A three-coordinate vector cannot distinguish XYZ from XYM from its physical type alone.
    return false;
  }
  if (options?.coordinates && getCoordinateLayout(column.type) !== options.coordinates) {
    return false;
  }
  if (options?.offsetType && getVectorOffsetType(column.type) !== options.offsetType) {
    return false;
  }
  return true;
}

/** Returns the coordinate layout found in a nested native GeoArrow type. */
function getCoordinateLayout(type: arrow.DataType): GeoArrowCoordinateLayout | null {
  if (type instanceof arrow.FixedSizeList) return 'interleaved';
  if (type instanceof arrow.Struct) {
    const names = type.children.map(child => child.name);
    if (names[0] === 'x' && names[1] === 'y') return 'separated';
    for (const child of type.children) {
      const layout = getCoordinateLayout(child.type);
      if (layout) return layout;
    }
    return null;
  }
  if (type instanceof arrow.List || type instanceof arrow.LargeList) {
    return getCoordinateLayout(type.children[0].type);
  }
  if (type instanceof arrow.DenseUnion) {
    for (const child of type.children) {
      const layout = getCoordinateLayout(child.type);
      if (layout) return layout;
    }
  }
  return null;
}

/** Returns the first variable-length offset width found in a nested native GeoArrow type. */
function getVectorOffsetType(type: arrow.DataType): GeoArrowOffsetType | null {
  if (type instanceof arrow.List) return 'int32';
  if (type instanceof arrow.LargeList) return 'int64';
  if (type instanceof arrow.Struct) {
    for (const child of type.children) {
      const offsetType = getVectorOffsetType(child.type);
      if (offsetType) return offsetType;
    }
  }
  if (type instanceof arrow.DenseUnion) {
    for (const child of type.children) {
      const offsetType = getVectorOffsetType(child.type);
      if (offsetType) return offsetType;
    }
  }
  return null;
}

/**
 * Resolves the adaptive native target for one geometry column.
 * @param targetEncoding Requested target encoding.
 * @param sourceEncoding Source encoding.
 * @param geometryTypes Trusted geometry type metadata, when available.
 * @returns Concrete GeoArrow target encoding.
 */
function resolveTargetEncoding(
  targetEncoding: GeoArrowGeometryTarget,
  sourceEncoding: GeoArrowEncoding,
  geometryTypes?: readonly GeoParquetGeometryType[]
): GeoArrowEncoding {
  if (targetEncoding !== 'native') {
    return targetEncoding;
  }

  if (
    sourceEncoding === 'geoarrow.geometry' ||
    sourceEncoding === 'geoarrow.geometrycollection' ||
    sourceEncoding === 'geoarrow.box'
  ) {
    return sourceEncoding;
  }

  if (
    sourceEncoding !== 'geoarrow.wkb' &&
    sourceEncoding !== 'geoarrow.wkt' &&
    sourceEncoding.startsWith('geoarrow.')
  ) {
    return sourceEncoding;
  }

  return selectNativeEncoding(geometryTypes);
}

/**
 * Selects a concrete native encoding from GeoParquet geometry type metadata.
 * @param geometryTypes Geometry type metadata.
 * @returns Concrete native encoding or dense union when metadata is incomplete.
 */
function selectNativeEncoding(geometryTypes?: readonly GeoParquetGeometryType[]): GeoArrowEncoding {
  if (!geometryTypes || geometryTypes.length === 0) {
    return 'geoarrow.geometry';
  }

  const geometryKinds = new Set(
    geometryTypes.map(geometryType => geometryType.replace(/ (Z|M|ZM)$/, ''))
  );
  const dimensions = new Set(
    geometryTypes.map(geometryType => {
      if (geometryType.endsWith(' ZM')) return 'xyzm';
      if (geometryType.endsWith(' Z')) return 'xyz';
      if (geometryType.endsWith(' M')) return 'xym';
      return 'xy';
    })
  );

  if (dimensions.size > 1) {
    return 'geoarrow.geometry';
  }

  if (geometryKinds.has('GeometryCollection')) {
    return 'geoarrow.geometry';
  }

  if (geometryKinds.size === 1) {
    switch ([...geometryKinds][0]) {
      case 'Point':
        return 'geoarrow.point';
      case 'MultiPoint':
        return 'geoarrow.multipoint';
      case 'LineString':
        return 'geoarrow.linestring';
      case 'MultiLineString':
        return 'geoarrow.multilinestring';
      case 'Polygon':
        return 'geoarrow.polygon';
      case 'MultiPolygon':
        return 'geoarrow.multipolygon';
      default:
        return 'geoarrow.geometry';
    }
  }

  if (geometryKinds.size === 2) {
    if (geometryKinds.has('Point') && geometryKinds.has('MultiPoint')) {
      return 'geoarrow.multipoint';
    }
    if (geometryKinds.has('LineString') && geometryKinds.has('MultiLineString')) {
      return 'geoarrow.multilinestring';
    }
    if (geometryKinds.has('Polygon') && geometryKinds.has('MultiPolygon')) {
      return 'geoarrow.multipolygon';
    }
  }

  return 'geoarrow.geometry';
}

/**
 * Builds the Arrow type for a GeoArrow dense union geometry column.
 * @param targetDimension Coordinate dimension.
 * @param allowGeometryCollections Whether to include geometrycollection children.
 * @returns DenseUnion Arrow type.
 */
function buildGeometryUnionType(
  targetDimension: 2 | 3 | 4,
  allowGeometryCollections: boolean,
  options?: GeoArrowGeometryConvertOptions,
  geometryCollectionDepth = allowGeometryCollections ? 1 : 0,
  dimensionName: GeoArrowDimension = getDimensionName(targetDimension)
): arrow.DenseUnion {
  const geometryKinds: GeoArrowGeometryKind[] = [
    'Point',
    'LineString',
    'Polygon',
    'MultiPoint',
    'MultiLineString',
    'MultiPolygon'
  ];

  if (allowGeometryCollections && geometryCollectionDepth > 0) {
    geometryKinds.push('GeometryCollection');
  }

  return new arrow.DenseUnion(
    geometryKinds.map(geometryKind => getUnionTypeId(geometryKind, targetDimension, dimensionName)),
    geometryKinds.map(
      geometryKind =>
        new arrow.Field(
          getUnionFieldName(geometryKind, targetDimension, dimensionName),
          getUnionChildType(
            geometryKind,
            targetDimension,
            options,
            geometryCollectionDepth,
            dimensionName
          ),
          true
        )
    )
  );
}

/**
 * Builds the Arrow type for a GeoArrow geometry collection column.
 * @param targetDimension Coordinate dimension.
 * @returns List<DenseUnion> Arrow type.
 */
function buildGeometryCollectionType(
  targetDimension: 2 | 3 | 4,
  options?: GeoArrowGeometryConvertOptions,
  geometryCollectionDepth = 0,
  dimensionName: GeoArrowDimension = getDimensionName(targetDimension)
): arrow.DataType {
  return createListType(
    new arrow.Field(
      'geometries',
      buildGeometryUnionType(
        targetDimension,
        geometryCollectionDepth > 0,
        options,
        geometryCollectionDepth,
        dimensionName
      ),
      true
    ),
    options?.offsetType
  );
}

/**
 * Returns the GeoArrow union base type id for a geometry kind.
 * @param geometryKind Geometry kind.
 * @returns Base union type id.
 */
function getUnionBaseTypeId(geometryKind: GeoArrowGeometryKind): number {
  switch (geometryKind) {
    case 'Point':
      return 1;
    case 'LineString':
      return 2;
    case 'Polygon':
      return 3;
    case 'MultiPoint':
      return 4;
    case 'MultiLineString':
      return 5;
    case 'MultiPolygon':
      return 6;
    case 'GeometryCollection':
      return 7;
    default:
      throw new Error(`Unsupported geometry kind "${geometryKind}".`);
  }
}

/**
 * Maps a geometry kind to its concrete GeoArrow encoding.
 * @param geometryKind Geometry kind.
 * @returns GeoArrow encoding.
 */
function getGeometryKindEncoding(
  geometryKind: Exclude<GeoArrowGeometryKind, 'GeometryCollection'>
): GeoArrowEncoding {
  switch (geometryKind) {
    case 'Point':
      return 'geoarrow.point';
    case 'LineString':
      return 'geoarrow.linestring';
    case 'Polygon':
      return 'geoarrow.polygon';
    case 'MultiPoint':
      return 'geoarrow.multipoint';
    case 'MultiLineString':
      return 'geoarrow.multilinestring';
    case 'MultiPolygon':
      return 'geoarrow.multipolygon';
    default:
      throw new Error(`Unsupported geometry kind "${geometryKind}".`);
  }
}

/**
 * Determines the target coordinate dimension for a set of geometries.
 * @param geometries Source geometries.
 * @param dimensionName Optional exact dimension name.
 * @returns Coordinate dimension for the converted column.
 */
function getTargetDimension(
  geometries: (Geometry | null)[],
  dimensionName?: GeoArrowDimension
): 2 | 3 | 4 {
  if (dimensionName) {
    return dimensionName.length === 2 ? 2 : dimensionName.length === 3 ? 3 : 4;
  }
  let dimension = 2;

  for (const geometry of geometries) {
    if (!geometry) {
      continue;
    }
    dimension = Math.max(dimension, getGeometryCoordinateDimension(geometry));
  }

  return Math.min(Math.max(dimension, 2), 4) as 2 | 3 | 4;
}

/**
 * Gets the coordinate dimension used by a GeoJSON geometry.
 * @param geometry GeoJSON geometry.
 * @returns Number of coordinate values.
 */
function getGeometryCoordinateDimension(geometry: Geometry): number {
  if ('coordinates' in geometry) {
    return getCoordinateDimension(geometry.coordinates);
  }

  if (geometry.geometries.length > 0) {
    return getGeometryCoordinateDimension(geometry.geometries[0]);
  }

  return 2;
}

/**
 * Gets the coordinate dimension used in nested coordinate arrays.
 * @param coordinates Nested coordinates.
 * @returns Number of coordinate values.
 */
function getCoordinateDimension(coordinates: unknown): number {
  if (!Array.isArray(coordinates)) {
    return 2;
  }

  if (typeof coordinates[0] === 'number') {
    return coordinates.length;
  }

  if (coordinates.length === 0) {
    return 2;
  }

  return getCoordinateDimension(coordinates[0]);
}

function getDimensionName(coordinateSize: 2 | 3 | 4): GeoArrowDimension {
  return coordinateSize === 2 ? 'xy' : coordinateSize === 4 ? 'xyzm' : 'xyz';
}

/** Resolves physical coordinate width and semantic Z/M meaning for a conversion. */
function getTargetDimensionName(
  geometries: (Geometry | null)[],
  options?: GeoArrowGeometryConvertOptions
): GeoArrowDimension {
  return (
    options?.dimension ||
    getDimensionFromGeometryTypes(options?.geometryTypes) ||
    getDimensionName(getTargetDimension(geometries))
  );
}

/** Returns one semantic dimension when all declared geometry types agree. */
function getDimensionFromGeometryTypes(
  geometryTypes?: readonly GeoParquetGeometryType[]
): GeoArrowDimension | undefined {
  if (!geometryTypes || geometryTypes.length === 0) return undefined;
  const dimensions = new Set(
    geometryTypes.map(geometryType =>
      geometryType.endsWith(' ZM')
        ? 'xyzm'
        : geometryType.endsWith(' Z')
          ? 'xyz'
          : geometryType.endsWith(' M')
            ? 'xym'
            : 'xy'
    )
  );
  return dimensions.size === 1 ? ([...dimensions][0] as GeoArrowDimension) : undefined;
}

function getBoxFieldNames(dimension: GeoArrowDimension): string[] {
  const minimumNames =
    dimension === 'xy'
      ? ['xmin', 'ymin']
      : dimension === 'xyz'
        ? ['xmin', 'ymin', 'zmin']
        : dimension === 'xym'
          ? ['xmin', 'ymin', 'mmin']
          : ['xmin', 'ymin', 'zmin', 'mmin'];
  const maximumNames =
    dimension === 'xy'
      ? ['xmax', 'ymax']
      : dimension === 'xyz'
        ? ['xmax', 'ymax', 'zmax']
        : dimension === 'xym'
          ? ['xmax', 'ymax', 'mmax']
          : ['xmax', 'ymax', 'zmax', 'mmax'];
  return [...minimumNames, ...maximumNames];
}

/** Creates the Arrow coordinate type for the requested layout and dimension. */
function getCoordinateType(
  targetDimension: 2 | 3 | 4,
  coordinates: GeoArrowCoordinateLayout = 'interleaved',
  dimensionName: GeoArrowDimension = getDimensionName(targetDimension)
): arrow.DataType {
  if (coordinates === 'interleaved') {
    return new arrow.FixedSizeList(
      targetDimension,
      new arrow.Field('value', new arrow.Float64(), true)
    );
  }

  const coordinateNames =
    dimensionName === 'xy'
      ? ['x', 'y']
      : dimensionName === 'xyz'
        ? ['x', 'y', 'z']
        : dimensionName === 'xym'
          ? ['x', 'y', 'm']
          : ['x', 'y', 'z', 'm'];
  return new arrow.Struct(
    coordinateNames.map(name => new arrow.Field(name, new arrow.Float64(), true))
  );
}

/** Creates a variable-length list type with the requested offset width. */
function createListType(
  field: arrow.Field,
  offsetType: GeoArrowOffsetType = 'int32'
): arrow.DataType {
  return offsetType === 'int64' ? new arrow.LargeList(field) : new arrow.List(field);
}

/** Creates offsets compatible with the selected Arrow list type. */
function createOffsetArray(
  offsets: number[],
  offsetType: GeoArrowOffsetType = 'int32'
): Int32Array | BigInt64Array {
  return offsetType === 'int64' ? BigInt64Array.from(offsets, BigInt) : Int32Array.from(offsets);
}

/** Recursively converts interleaved coordinate tuples to separated struct values. */
function separateCoordinateValues(value: unknown, targetDimension: 2 | 3 | 4): unknown {
  if (!Array.isArray(value)) {
    return value;
  }
  if (value.length === 0 || (typeof value[0] !== 'number' && !value.every(item => item === null))) {
    return value.map(item => separateCoordinateValues(item, targetDimension));
  }

  const names = ['x', 'y', 'z', 'm'];
  return Object.fromEntries(
    names.slice(0, targetDimension).map((name, index) => [name, value[index]])
  );
}

/**
 * Clones Arrow metadata into a mutable map.
 * @param metadata Metadata to clone.
 * @returns Cloned metadata map.
 */
function cloneMetadataMap(metadata?: Map<string, string>): Map<string, string> {
  return metadata ? new Map(metadata.entries()) : new Map();
}

/**
 * Returns WKB write options that preserve Z and M dimensions.
 * @param geometry Geometry being encoded.
 * @returns WKB options.
 */
function getGeometryWKBOptions(
  geometry: Geometry,
  options?: GeoArrowGeometryConvertOptions
): {hasZ?: boolean; hasM?: boolean} {
  const dimension = getGeometryDimension(geometry, options);
  return {
    hasZ: dimension === 'xyz' || dimension === 'xyzm',
    hasM: dimension === 'xym' || dimension === 'xyzm'
  };
}

/** Resolves the semantic dimension of one geometry, honoring WKT annotations and metadata. */
function getGeometryDimension(
  geometry: Geometry,
  options?: GeoArrowGeometryConvertOptions
): GeoArrowDimension {
  if (options?.dimension) return options.dimension;
  const declaredDimension = (geometry as Geometry & {__geoarrowDimension?: GeoArrowDimension})
    .__geoarrowDimension;
  if (declaredDimension) return declaredDimension;
  const geometryTypes = options?.geometryTypes || [];
  const dimensions = new Set(
    geometryTypes.map(geometryType =>
      geometryType.endsWith(' ZM')
        ? 'xyzm'
        : geometryType.endsWith(' Z')
          ? 'xyz'
          : geometryType.endsWith(' M')
            ? 'xym'
            : 'xy'
    )
  );
  if (dimensions.size === 1) return [...dimensions][0] as GeoArrowDimension;
  const coordinateDimension = getGeometryCoordinateDimension(geometry);
  return coordinateDimension === 4 ? 'xyzm' : coordinateDimension === 3 ? 'xyz' : 'xy';
}

/**
 * Normalizes a point geometry for native GeoArrow point output.
 * @param geometry Source geometry.
 * @param targetDimension Target coordinate dimension.
 * @param geometryColumn Column name for error messages.
 * @returns Padded point coordinates.
 */
function normalizePointCoordinates(
  geometry: Geometry,
  targetDimension: 2 | 3 | 4,
  geometryColumn: string
): (number | null)[] {
  if (geometry.type !== 'Point') {
    throw new Error(
      `GeoArrowGeometryConverter cannot encode ${geometry.type} as geoarrow.point in column "${geometryColumn}".`
    );
  }
  if (geometry.coordinates.length === 0) {
    return Array.from({length: targetDimension}, () => null);
  }
  return padPosition(geometry.coordinates, targetDimension);
}

/**
 * Normalizes a linestring geometry for native GeoArrow linestring output.
 * @param geometry Source geometry.
 * @param targetDimension Target coordinate dimension.
 * @param geometryColumn Column name for error messages.
 * @returns Padded linestring coordinates.
 */
function normalizeLineStringCoordinates(
  geometry: Geometry,
  targetDimension: 2 | 3 | 4,
  geometryColumn: string
): number[][] {
  if (geometry.type !== 'LineString') {
    throw new Error(
      `GeoArrowGeometryConverter cannot encode ${geometry.type} as geoarrow.linestring in column "${geometryColumn}".`
    );
  }
  return geometry.coordinates.map(position => padPosition(position, targetDimension));
}

/**
 * Normalizes a polygon geometry for native GeoArrow polygon output.
 * @param geometry Source geometry.
 * @param targetDimension Target coordinate dimension.
 * @param geometryColumn Column name for error messages.
 * @returns Padded polygon coordinates.
 */
function normalizePolygonCoordinates(
  geometry: Geometry,
  targetDimension: 2 | 3 | 4,
  geometryColumn: string
): number[][][] {
  if (geometry.type !== 'Polygon') {
    throw new Error(
      `GeoArrowGeometryConverter cannot encode ${geometry.type} as geoarrow.polygon in column "${geometryColumn}".`
    );
  }
  return geometry.coordinates.map(ring =>
    ring.map(position => padPosition(position, targetDimension))
  );
}

/**
 * Normalizes a multipoint geometry for native GeoArrow multipoint output.
 * @param geometry Source geometry.
 * @param targetDimension Target coordinate dimension.
 * @param geometryColumn Column name for error messages.
 * @returns Padded multipoint coordinates.
 */
function normalizeMultiPointCoordinates(
  geometry: Geometry,
  targetDimension: 2 | 3 | 4,
  geometryColumn: string
): number[][] {
  if (geometry.type === 'Point') {
    return [padPosition(geometry.coordinates, targetDimension)];
  }
  if (geometry.type !== 'MultiPoint') {
    throw new Error(
      `GeoArrowGeometryConverter cannot encode ${geometry.type} as geoarrow.multipoint in column "${geometryColumn}".`
    );
  }
  return geometry.coordinates.map(position => padPosition(position, targetDimension));
}

/**
 * Normalizes a multilinestring geometry for native GeoArrow multilinestring output.
 * @param geometry Source geometry.
 * @param targetDimension Target coordinate dimension.
 * @param geometryColumn Column name for error messages.
 * @returns Padded multilinestring coordinates.
 */
function normalizeMultiLineStringCoordinates(
  geometry: Geometry,
  targetDimension: 2 | 3 | 4,
  geometryColumn: string
): number[][][] {
  if (geometry.type === 'LineString') {
    return [geometry.coordinates.map(position => padPosition(position, targetDimension))];
  }
  if (geometry.type !== 'MultiLineString') {
    throw new Error(
      `GeoArrowGeometryConverter cannot encode ${geometry.type} as geoarrow.multilinestring in column "${geometryColumn}".`
    );
  }
  return geometry.coordinates.map(line =>
    line.map(position => padPosition(position, targetDimension))
  );
}

/**
 * Normalizes a multipolygon geometry for native GeoArrow multipolygon output.
 * @param geometry Source geometry.
 * @param targetDimension Target coordinate dimension.
 * @param geometryColumn Column name for error messages.
 * @returns Padded multipolygon coordinates.
 */
function normalizeMultiPolygonCoordinates(
  geometry: Geometry,
  targetDimension: 2 | 3 | 4,
  geometryColumn: string
): number[][][][] {
  if (geometry.type === 'Polygon') {
    return [
      geometry.coordinates.map(ring => ring.map(position => padPosition(position, targetDimension)))
    ];
  }
  if (geometry.type !== 'MultiPolygon') {
    throw new Error(
      `GeoArrowGeometryConverter cannot encode ${geometry.type} as geoarrow.multipolygon in column "${geometryColumn}".`
    );
  }
  return geometry.coordinates.map(polygon =>
    polygon.map(ring => ring.map(position => padPosition(position, targetDimension)))
  );
}

/**
 * Pads one coordinate tuple to the target dimension.
 * @param position Coordinate tuple.
 * @param targetDimension Target coordinate dimension.
 * @returns Padded coordinate tuple.
 */
function padPosition(position: Position, targetDimension: 2 | 3 | 4): number[] {
  const paddedPosition = [...position];
  while (paddedPosition.length < targetDimension) {
    paddedPosition.push(0);
  }
  return paddedPosition.slice(0, targetDimension);
}
