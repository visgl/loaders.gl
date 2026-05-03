// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {convertGeometryToWKB, convertGeometryToWKT} from '@loaders.gl/gis';
import type {Geometry, Position} from '@loaders.gl/schema';
import {convertGeoArrowGeometryToGeoJSON} from '../lib/geometry-converters/convert-geoarrow-to-geojson';
import type {GeoArrowEncoding} from '../metadata/geoarrow-metadata';
import {getGeometryMetadataForField} from '../metadata/geoarrow-metadata';
import {getGeoMetadata, type GeoMetadata} from '../metadata/geoparquet-metadata';

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
  | number[]
  | number[][]
  | number[][][]
  | number[][][][]
  | null;

/**
 * Options for converting geometry columns in a GeoArrow table.
 */
export type GeoArrowGeometryConvertOptions = {
  /** Optional single geometry column to convert. Defaults to all geometry columns. */
  geometryColumn?: string;
  /** Optional list of geometry columns to convert. Defaults to all geometry columns. */
  geometryColumns?: string[];
};

/**
 * Converts one or more geometry columns in a GeoArrow Arrow table to a target GeoArrow encoding.
 * @param table GeoArrow Apache Arrow table.
 * @param targetEncoding Target GeoArrow encoding for selected geometry columns.
 * @param options Conversion options.
 * @returns A new Arrow table with converted geometry columns.
 */
export function convertGeoArrowGeometry(
  table: arrow.Table,
  targetEncoding: GeoArrowEncoding,
  options?: GeoArrowGeometryConvertOptions
): arrow.Table {
  const geometryColumns = getGeometryColumnsFromArrowSchema(table.schema);
  const selectedGeometryColumns = resolveGeometryColumns(geometryColumns, options);

  if (selectedGeometryColumns.length === 0) {
    throw new Error('GeoArrowGeometryConverter requires at least one geometry column to convert.');
  }

  const convertedVectors = new Map<string, arrow.Vector>();
  for (const geometryColumn of selectedGeometryColumns) {
    const sourceEncoding = geometryColumns[geometryColumn]?.encoding;
    const column = table.getChild(geometryColumn);

    if (!sourceEncoding || !column) {
      throw new Error(`GeoArrowGeometryConverter could not resolve column "${geometryColumn}".`);
    }

    convertedVectors.set(
      geometryColumn,
      convertGeometryColumn(column, sourceEncoding, targetEncoding, geometryColumn)
    );
  }

  const nextFields = table.schema.fields.map(field => {
    const convertedVector = convertedVectors.get(field.name);
    return convertedVector
      ? createConvertedField(field, convertedVector.type, targetEncoding)
      : field;
  });

  const nextSchemaMetadata = cloneMetadataMap(table.schema.metadata);
  updateGeoMetadata(
    nextSchemaMetadata,
    getGeoMetadata(table.schema.metadata || new Map()),
    selectedGeometryColumns,
    targetEncoding
  );
  const nextSchema = new arrow.Schema(nextFields, nextSchemaMetadata);
  const nextRecordBatch = new arrow.RecordBatch(
    nextSchema,
    arrow.makeData({
      type: new arrow.Struct(nextFields),
      length: table.numRows,
      nullCount: 0,
      children: nextFields.map(field => {
        const convertedVector = convertedVectors.get(field.name);
        if (convertedVector) {
          return convertedVector.data[0];
        }
        return table.getChild(field.name)!.data[0];
      })
    })
  );

  return new arrow.Table(nextRecordBatch);
}

/**
 * Extracts GeoArrow geometry metadata from an Apache Arrow schema.
 * @param schema Apache Arrow schema.
 * @returns GeoArrow geometry columns keyed by field name.
 */
function getGeometryColumnsFromArrowSchema(
  schema: arrow.Schema
): Record<string, {encoding?: GeoArrowEncoding}> {
  const geometryColumns: Record<string, {encoding?: GeoArrowEncoding}> = {};

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
  geometryColumn: string
): arrow.Vector {
  const geometries = extractGeometries(column, sourceEncoding);

  const targetDimension = usesNativeGeoArrowCoordinates(targetEncoding)
    ? getTargetDimension(geometries)
    : 2;
  if (targetEncoding === 'geoarrow.geometry') {
    return createGeometryUnionVector(geometries, targetDimension, true, geometryColumn);
  }
  if (targetEncoding === 'geoarrow.geometrycollection') {
    return createGeometryCollectionVector(geometries, targetDimension, geometryColumn);
  }
  const targetValues = geometries.map(geometry =>
    convertGeometryValue(geometry, targetEncoding, targetDimension, geometryColumn)
  );
  return arrow.vectorFromArray(targetValues, getTargetArrowType(targetEncoding, targetDimension));
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
  geometryColumn: string
): string | Uint8Array | number[] | number[][] | number[][][] | number[][][][] | null {
  if (!geometry) {
    return null;
  }

  switch (targetEncoding) {
    case 'geoarrow.wkb':
      return new Uint8Array(convertGeometryToWKB(geometry, getGeometryWKBOptions(geometry)));
    case 'geoarrow.wkt':
      return convertGeometryToWKT(geometry);
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
    const {typeId} = getDenseUnionCellInfo(column, rowIndex);
    const geometryKind = getGeometryKindFromTypeId(typeId);
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
      const {typeId} = getDenseUnionCellInfo(unionVector, memberIndex);
      const geometryKind = getGeometryKindFromTypeId(typeId);
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
  geometryColumn: string
): arrow.Vector {
  const usedKinds = new Set<GeoArrowGeometryKind>();
  const typeIds: number[] = [];
  const valueOffsets: number[] = [];
  const childValues: Partial<Record<GeoArrowGeometryKind, GeometryUnionChildValue[]>> = {};

  const nullCarrierKind = getNullCarrierKind(geometries, allowGeometryCollections);
  usedKinds.add(nullCarrierKind);
  childValues[nullCarrierKind] = [];

  for (const geometry of geometries) {
    const geometryKind = geometry?.type || nullCarrierKind;
    if (geometryKind === 'GeometryCollection' && !allowGeometryCollections) {
      throw new Error(
        `GeoArrowGeometryConverter cannot encode GeometryCollection in "${geometryColumn}" without a geometrycollection child.`
      );
    }

    const childKind = (geometryKind || nullCarrierKind) as GeoArrowGeometryKind;
    usedKinds.add(childKind);
    childValues[childKind] ||= [];
    valueOffsets.push(childValues[childKind]!.length);
    typeIds.push(getUnionTypeId(childKind, targetDimension));

    childValues[childKind]!.push(
      geometry ? convertGeometryToUnionChildValue(geometry, targetDimension, geometryColumn) : null
    );
  }

  const orderedKinds = [...usedKinds].sort(
    (leftKind, rightKind) =>
      getUnionTypeId(leftKind, targetDimension) - getUnionTypeId(rightKind, targetDimension)
  );
  const fields = orderedKinds.map(
    kind =>
      new arrow.Field(
        getUnionFieldName(kind, targetDimension),
        getUnionChildType(kind, targetDimension),
        true
      )
  );
  const children = orderedKinds.map(kind => {
    const values = childValues[kind] || [];
    return createUnionChildVector(kind, values, targetDimension, geometryColumn).data[0];
  });
  const unionType = new arrow.DenseUnion(
    orderedKinds.map(kind => getUnionTypeId(kind, targetDimension)),
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
  geometryColumn: string
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
    geometryColumn
  );
  const listType = new arrow.List(new arrow.Field('geometries', memberUnionVector.type, true));

  return arrow.makeVector(
    arrow.makeData({
      type: listType,
      length: geometries.length,
      nullCount: validity.filter(isValid => !isValid).length,
      nullBitmap: createNullBitmap(validity),
      valueOffsets: Int32Array.from(valueOffsets),
      child: memberUnionVector.data[0]
    })
  );
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
): Geometry | number[] | number[][] | number[][][] | number[][][][] | null {
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
  geometryColumn: string
): arrow.Vector {
  if (geometryKind === 'GeometryCollection') {
    return createGeometryCollectionVector(
      values as (Geometry | null)[],
      targetDimension,
      geometryColumn
    );
  }

  return arrow.vectorFromArray(values, getUnionChildType(geometryKind, targetDimension));
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
        const {typeId} = getDenseUnionCellInfo(unionVector, memberIndex);
        const childGeometryKind = getGeometryKindFromTypeId(typeId);
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
      return {
        typeId: chunk.typeIds[chunk.offset + remainingRowIndex],
        valueOffset: chunk.valueOffsets[chunk.offset + remainingRowIndex]
      };
    }
    remainingRowIndex -= chunk.length;
  }

  throw new Error(`DenseUnion row ${rowIndex} is out of bounds.`);
}

/**
 * Maps a GeoArrow dense union type id to the base geometry kind.
 * @param typeId GeoArrow union type id.
 * @returns Base geometry kind.
 */
function getGeometryKindFromTypeId(typeId: number): GeoArrowGeometryKind {
  switch (typeId % 10) {
    case 1:
      return 'Point';
    case 2:
      return 'LineString';
    case 3:
      return 'Polygon';
    case 4:
      return 'MultiPoint';
    case 5:
      return 'MultiLineString';
    case 6:
      return 'MultiPolygon';
    case 7:
      return 'GeometryCollection';
    default:
      throw new Error(`Unsupported GeoArrow union type id "${typeId}".`);
  }
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

/**
 * Returns the GeoArrow union type id for a geometry kind and coordinate dimension.
 * @param geometryKind Geometry kind.
 * @param targetDimension Coordinate dimension.
 * @returns GeoArrow union type id.
 */
function getUnionTypeId(geometryKind: GeoArrowGeometryKind, targetDimension: 2 | 3 | 4): number {
  const baseTypeId = getUnionBaseTypeId(geometryKind);

  switch (targetDimension) {
    case 2:
      return baseTypeId;
    case 3:
      return 10 + baseTypeId;
    case 4:
      return 30 + baseTypeId;
    default:
      throw new Error(`Unsupported GeoArrow coordinate dimension "${targetDimension}".`);
  }
}

/**
 * Returns the GeoArrow child field name for a dense union member.
 * @param geometryKind Geometry kind.
 * @param targetDimension Coordinate dimension.
 * @returns Arrow field name.
 */
function getUnionFieldName(geometryKind: GeoArrowGeometryKind, targetDimension: 2 | 3 | 4): string {
  switch (targetDimension) {
    case 2:
      return geometryKind;
    case 3:
      return `${geometryKind} Z`;
    case 4:
      return `${geometryKind} ZM`;
    default:
      throw new Error(`Unsupported GeoArrow coordinate dimension "${targetDimension}".`);
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
  targetDimension: 2 | 3 | 4
): arrow.DataType {
  if (geometryKind === 'GeometryCollection') {
    return buildGeometryCollectionType(targetDimension);
  }

  return getTargetArrowType(getGeometryKindEncoding(geometryKind), targetDimension);
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
  targetEncoding: GeoArrowEncoding
): arrow.Field {
  const metadata = cloneMetadataMap(field.metadata);
  metadata.set('ARROW:extension:name', targetEncoding);
  return new arrow.Field(field.name, type, field.nullable, metadata);
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
  selectedGeometryColumns: string[],
  targetEncoding: GeoArrowEncoding
): void {
  if (!geoMetadata) {
    return;
  }

  const nextGeoMetadata = JSON.parse(JSON.stringify(geoMetadata)) as GeoMetadata;

  if (targetEncoding === 'geoarrow.wkb' || targetEncoding === 'geoarrow.wkt') {
    const targetGeoParquetEncoding = targetEncoding === 'geoarrow.wkb' ? 'wkb' : 'wkt';
    for (const geometryColumn of selectedGeometryColumns) {
      if (nextGeoMetadata.columns?.[geometryColumn]) {
        nextGeoMetadata.columns[geometryColumn].encoding = targetGeoParquetEncoding;
      }
    }
    metadata.set('geo', JSON.stringify(nextGeoMetadata));
    return;
  }

  for (const geometryColumn of selectedGeometryColumns) {
    delete nextGeoMetadata.columns?.[geometryColumn];
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

/**
 * Returns the Arrow data type for a target GeoArrow encoding.
 * @param targetEncoding Target GeoArrow encoding.
 * @param targetDimension Target coordinate dimension.
 * @returns Arrow data type for the converted column.
 */
function getTargetArrowType(
  targetEncoding: GeoArrowEncoding,
  targetDimension: 2 | 3 | 4
): arrow.DataType {
  const coordinateType = new arrow.FixedSizeList(
    targetDimension,
    new arrow.Field('value', new arrow.Float64(), false)
  );

  switch (targetEncoding) {
    case 'geoarrow.geometry':
      return buildGeometryUnionType(targetDimension, true);
    case 'geoarrow.geometrycollection':
      return buildGeometryCollectionType(targetDimension);
    case 'geoarrow.point':
      return coordinateType;
    case 'geoarrow.linestring':
    case 'geoarrow.multipoint':
      return new arrow.List(new arrow.Field('value', coordinateType, true));
    case 'geoarrow.polygon':
    case 'geoarrow.multilinestring':
      return new arrow.List(
        new arrow.Field(
          'value',
          new arrow.List(new arrow.Field('value', coordinateType, true)),
          true
        )
      );
    case 'geoarrow.multipolygon':
      return new arrow.List(
        new arrow.Field(
          'value',
          new arrow.List(
            new arrow.Field(
              'value',
              new arrow.List(new arrow.Field('value', coordinateType, true)),
              true
            )
          ),
          true
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
 * Builds the Arrow type for a GeoArrow dense union geometry column.
 * @param targetDimension Coordinate dimension.
 * @param allowGeometryCollections Whether to include geometrycollection children.
 * @returns DenseUnion Arrow type.
 */
function buildGeometryUnionType(
  targetDimension: 2 | 3 | 4,
  allowGeometryCollections: boolean
): arrow.DenseUnion {
  const geometryKinds: GeoArrowGeometryKind[] = [
    'Point',
    'LineString',
    'Polygon',
    'MultiPoint',
    'MultiLineString',
    'MultiPolygon'
  ];

  if (allowGeometryCollections) {
    geometryKinds.push('GeometryCollection');
  }

  return new arrow.DenseUnion(
    geometryKinds.map(geometryKind => getUnionTypeId(geometryKind, targetDimension)),
    geometryKinds.map(
      geometryKind =>
        new arrow.Field(
          getUnionFieldName(geometryKind, targetDimension),
          getUnionChildType(geometryKind, targetDimension),
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
function buildGeometryCollectionType(targetDimension: 2 | 3 | 4): arrow.List {
  return new arrow.List(
    new arrow.Field('geometries', buildGeometryUnionType(targetDimension, false), true)
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
 * @returns Coordinate dimension for the converted column.
 */
function getTargetDimension(geometries: (Geometry | null)[]): 2 | 3 | 4 {
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
function getGeometryWKBOptions(geometry: Geometry): {hasZ?: boolean; hasM?: boolean} {
  const dimensions = getGeometryCoordinateDimension(geometry);
  return {
    hasZ: dimensions > 2,
    hasM: dimensions > 3
  };
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
): number[] {
  if (geometry.type !== 'Point') {
    throw new Error(
      `GeoArrowGeometryConverter cannot encode ${geometry.type} as geoarrow.point in column "${geometryColumn}".`
    );
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
