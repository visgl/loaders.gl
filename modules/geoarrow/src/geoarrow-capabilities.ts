// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {
  GeoArrowCoordinateLayout,
  GeoArrowDimension,
  GeoArrowEncoding,
  GeoArrowOffsetType,
  GeoParquetGeometryType
} from '@loaders.gl/schema';
import {getGeometryMetadataForField} from './metadata/geoarrow-metadata';
import {getGeoArrowGeometryInfo} from './get-geoarrow-geometry-info';
import {getWKBGeometryStatistics, convertWKTToGeometry} from '@loaders.gl/gis';
import {inspectGeoArrowLayout} from './geoarrow-layout';

/** Physical and logical capabilities of one GeoArrow field. */
export type GeoArrowFieldInfo = Readonly<{
  /** GeoArrow extension encoding declared by the field. */
  encoding: GeoArrowEncoding | null;
  /** Geometry types declared by extension or GeoParquet metadata. */
  geometryTypes: readonly GeoParquetGeometryType[];
  /** Compatible encodings inferred from the physical Arrow type. */
  compatibleEncodings: readonly GeoArrowEncoding[];
  /** Number and semantic name of coordinate dimensions. */
  dimension: GeoArrowDimension | null;
  /** Coordinate storage layout for native encodings. */
  coordinates: GeoArrowCoordinateLayout | null;
  /** Width of variable-length offsets used by the physical type. */
  offsetType: GeoArrowOffsetType | null;
}>;

/** One actionable GeoArrow validation diagnostic. */
export type GeoArrowValidationIssue = Readonly<{
  /** Field or nested type path associated with the issue. */
  path: string;
  /** Human-readable diagnostic. */
  message: string;
}>;

/** Result returned by {@link validateGeoArrowField}. */
export type GeoArrowValidationResult = Readonly<{
  /** Whether the field is a valid GeoArrow field. */
  valid: boolean;
  /** All validation diagnostics, in stable order. */
  issues: readonly GeoArrowValidationIssue[];
  /** Inferred field capabilities when the type is inspectable. */
  info: GeoArrowFieldInfo | null;
}>;

/** Result returned by {@link validateGeoArrowVector}. */
export type GeoArrowVectorValidationResult = Readonly<{
  /** Whether all rows reference valid child data. */
  valid: boolean;
  /** Row-level union and serialized-value diagnostics. */
  issues: readonly GeoArrowValidationIssue[];
}>;

/** Requirements accepted by the GeoArrow encoding negotiator. */
export type GeoArrowEncodingRequirements = Readonly<{
  /** Required target encoding, or native for adaptive selection. */
  encoding?: GeoArrowEncoding | 'native';
  /** Required coordinate layout. */
  coordinates?: GeoArrowCoordinateLayout;
  /** Required coordinate dimension. */
  dimension?: GeoArrowDimension;
  /** Required offset width. */
  offsetType?: GeoArrowOffsetType;
  /** Allow a conversion instead of requiring the current physical layout. */
  allowConversion?: boolean;
}>;

/** Returns physical and metadata-derived capabilities for a GeoArrow field. */
export function getGeoArrowFieldInfo(field: arrow.Field): GeoArrowFieldInfo | null {
  const metadata = getGeometryMetadataForField(field.metadata || new Map());
  const geometryInfo = getGeoArrowGeometryInfo(field);
  const encoding = metadata?.encoding || null;
  if (!metadata && !geometryInfo) {
    return null;
  }

  return {
    encoding,
    geometryTypes: metadata?.geometry_types || [],
    compatibleEncodings: geometryInfo?.compatibleEncodings || (encoding ? [encoding] : []),
    dimension: geometryInfo
      ? getDimensionName(field, geometryInfo.dimension, metadata?.geometry_types)
      : null,
    coordinates: geometryInfo?.coordinates || null,
    offsetType: getOffsetType(field.type)
  };
}

/** Validates the physical Arrow type and extension metadata of one field. */
export function validateGeoArrowField(field: arrow.Field): GeoArrowValidationResult {
  const info = getGeoArrowFieldInfo(field);
  const layoutInspection = inspectGeoArrowLayout(field);
  const issues: GeoArrowValidationIssue[] = layoutInspection.issues.map(issue => ({
    path: issue.path,
    message: issue.message
  }));
  const metadata = getGeometryMetadataForField(field.metadata || new Map());
  if (!info) {
    if (!issues.some(issue => issue.message.includes('recognized GeoArrow physical type'))) {
      issues.push({path: field.name, message: 'Field is not a recognized GeoArrow physical type.'});
    }
    return {valid: false, issues, info: null};
  }
  if (
    metadata?.encoding &&
    !getGeoArrowGeometryInfo(field) &&
    !issues.some(issue => issue.message.includes('physical Arrow layout'))
  ) {
    issues.push({
      path: field.name,
      message: `Encoding ${metadata.encoding} does not have a recognized physical Arrow layout.`
    });
  }
  if (metadata?.geometry_types && metadata.geometry_types.length === 0) {
    issues.push({
      path: `${field.name}.geometry_types`,
      message: 'geometry_types must be non-empty when present.'
    });
  }
  return {valid: issues.length === 0, issues, info};
}

/** Validates dense-union type IDs and child offsets for one GeoArrow vector. */
export function validateGeoArrowVector(
  column: arrow.Vector,
  encoding: GeoArrowEncoding
): GeoArrowVectorValidationResult {
  const issues: GeoArrowValidationIssue[] = [];
  if (encoding === 'geoarrow.wkb' || encoding === 'geoarrow.wkt') {
    validateSerializedVector(column, encoding, issues);
    return {valid: issues.length === 0, issues};
  }
  if (isNativeEncoding(encoding)) {
    for (const [chunkIndex, data] of column.data.entries()) {
      validateNativeData(data, `chunk[${chunkIndex}]`, issues);
    }
    return {valid: issues.length === 0, issues};
  }
  if (encoding !== 'geoarrow.geometry' && encoding !== 'geoarrow.geometrycollection') {
    return {valid: true, issues};
  }
  for (const [chunkIndex, data] of column.data.entries()) {
    validateNativeData(data, `chunk[${chunkIndex}]`, issues);
  }
  if (
    encoding === 'geoarrow.geometrycollection' &&
    !(column.type instanceof arrow.List) &&
    !(column.type instanceof arrow.LargeList)
  ) {
    issues.push({path: 'type', message: `${encoding} requires a list of dense union children.`});
  }
  return {valid: issues.length === 0, issues};
}

/** Validates native coordinate buffers, list offsets, and box children without reading rows. */
function validateNativeData(
  data: arrow.Data,
  path: string,
  issues: GeoArrowValidationIssue[]
): void {
  const {type} = data;
  if (type instanceof arrow.DenseUnion) {
    validateUnionData(data, path, issues);
    return;
  }
  if (type instanceof arrow.List || type instanceof arrow.LargeList) {
    const offsets = data.valueOffsets;
    const child = data.children[0];
    if (!offsets || !child) {
      issues.push({path, message: 'Native list is missing its offsets or child buffer.'});
      return;
    }
    const offsetStart = getDataBufferIndex(offsets.length, data.offset, 0, data.length);
    const offsetEnd = getDataBufferIndex(offsets.length, data.offset, data.length, data.length);
    if (offsetEnd >= offsets.length || offsetStart >= offsets.length) {
      issues.push({
        path: `${path}.offsets`,
        message: 'Native list offsets are shorter than its data.'
      });
      return;
    }
    let previousOffset = Number(offsets[offsetStart]);
    if (!Number.isSafeInteger(previousOffset) || previousOffset < 0) {
      issues.push({
        path: `${path}.offsets[0]`,
        message: 'Native list offset must be a non-negative integer.'
      });
    }
    for (let logicalIndex = 1; logicalIndex <= data.length; logicalIndex++) {
      const index = getDataBufferIndex(offsets.length, data.offset, logicalIndex, data.length);
      const currentOffset = Number(offsets[index]);
      if (!Number.isSafeInteger(currentOffset) || currentOffset < previousOffset) {
        issues.push({
          path: `${path}.offsets[${logicalIndex}]`,
          message: 'Native list offsets must be monotonic non-negative integers.'
        });
      }
      if (Number.isSafeInteger(currentOffset) && currentOffset > child.length) {
        issues.push({
          path: `${path}.offsets[${logicalIndex}]`,
          message: `Native list offset ${currentOffset} exceeds child length ${child.length}.`
        });
      }
      previousOffset = currentOffset;
    }
    validateNativeData(child, `${path}.child`, issues);
    return;
  }

  if (type instanceof arrow.FixedSizeList) {
    if (type.listSize < 2 || type.listSize > 4 || !data.children[0]) {
      issues.push({path, message: 'Native coordinate list must contain two to four values.'});
      return;
    }
    const child = data.children[0];
    if (!(child.type instanceof arrow.Float)) {
      issues.push({
        path: `${path}.child`,
        message: 'Native coordinates must use a floating-point child.'
      });
    }
    if (child.length < data.length * type.listSize) {
      issues.push({
        path: `${path}.child`,
        message: 'Native coordinate buffer is shorter than its list.'
      });
    }
    return;
  }

  if (type instanceof arrow.Struct) {
    const names = type.children.map(field => field.name);
    const coordinateNames = [
      ['x', 'y'],
      ['x', 'y', 'z'],
      ['x', 'y', 'm'],
      ['x', 'y', 'z', 'm']
    ];
    const boxNames = [
      ['xmin', 'ymin', 'xmax', 'ymax'],
      ['xmin', 'ymin', 'zmin', 'xmax', 'ymax', 'zmax'],
      ['xmin', 'ymin', 'mmin', 'xmax', 'ymax', 'mmax'],
      ['xmin', 'ymin', 'zmin', 'mmin', 'xmax', 'ymax', 'zmax', 'mmax']
    ];
    if (
      !coordinateNames.some(expected => sameNames(names, expected)) &&
      !boxNames.some(expected => sameNames(names, expected))
    ) {
      issues.push({path, message: 'Native struct has non-canonical GeoArrow child names.'});
      return;
    }
    for (const [childIndex, child] of data.children.entries()) {
      if (!(child.type instanceof arrow.Float)) {
        issues.push({
          path: `${path}.${names[childIndex]}`,
          message: 'Native struct children must be floating-point.'
        });
      }
      if (child.length < data.length) {
        issues.push({
          path: `${path}.${names[childIndex]}`,
          message: 'Native struct child is shorter than its parent.'
        });
      }
    }
    if (boxNames.some(expected => sameNames(names, expected))) {
      validateBoxData(data, names, path, issues);
    }
    return;
  }

  issues.push({path, message: `Unsupported native Arrow physical type ${type.toString()}.`});
}

/** Validates finite and ordered min/max pairs in a GeoArrow Box struct. */
function validateBoxData(
  data: arrow.Data,
  names: readonly string[],
  path: string,
  issues: GeoArrowValidationIssue[]
): void {
  const axisNames = names.filter(name => name.endsWith('min'));
  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    if (!isValidDataRow(data, rowIndex)) continue;
    for (const minimumName of axisNames) {
      const maximumName = `${minimumName.slice(0, -3)}max`;
      const minimumIndex = names.indexOf(minimumName);
      const maximumIndex = names.indexOf(maximumName);
      const minimum = readNativeValue(data.children[minimumIndex], rowIndex);
      const maximum = readNativeValue(data.children[maximumIndex], rowIndex);
      if (minimum === undefined || maximum === undefined) {
        issues.push({
          path: `${path}.row[${rowIndex}]`,
          message: `GeoArrow Box ${minimumName}/${maximumName} values must be finite.`
        });
      } else if (minimum > maximum) {
        issues.push({
          path: `${path}.row[${rowIndex}]`,
          message: `GeoArrow Box ${minimumName} must not exceed ${maximumName}.`
        });
      }
    }
  }
}

/** Tests one Arrow validity bitmap using a logical row index. */
function isValidDataRow(data: arrow.Data, rowIndex: number): boolean {
  if (data.nullCount === 0) return true;
  const nullBitmap = data.nullBitmap;
  const bitIndex = data.offset + rowIndex;
  return Boolean(
    nullBitmap && nullBitmap.length > 0 && (nullBitmap[bitIndex >> 3] & (1 << (bitIndex & 7))) !== 0
  );
}

/** Reads one scalar child while accounting for sliced Arrow data and nulls. */
function readNativeValue(data: arrow.Data | undefined, rowIndex: number): number | undefined {
  if (!data || !isValidDataRow(data, rowIndex) || !data.values) return undefined;
  const valueIndex = getDataBufferIndex(data.values.length, data.offset, rowIndex);
  const value = Number(data.values[valueIndex]);
  return Number.isFinite(value) ? value : undefined;
}

/** Validates dense-union IDs, offsets, and all recursively nested child data. */
function validateUnionData(
  data: arrow.Data,
  path: string,
  issues: GeoArrowValidationIssue[]
): void {
  const unionType = data.type as arrow.DenseUnion;
  if (!data.typeIds || !data.valueOffsets) {
    issues.push({path, message: 'Dense union is missing type IDs or value offsets.'});
    return;
  }
  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const useLogicalIndex = data.typeIds.length <= data.length;
    const typeIdIndex = getUnionBufferIndex(
      data.typeIds.length,
      data.offset,
      rowIndex,
      useLogicalIndex
    );
    const valueOffsetIndex = getUnionBufferIndex(
      data.valueOffsets.length,
      data.offset,
      rowIndex,
      useLogicalIndex
    );
    const typeId = data.typeIds[typeIdIndex];
    const childIndex = unionType.typeIds.indexOf(typeId);
    if (childIndex < 0) {
      issues.push({
        path: `${path}.row[${rowIndex}].typeId`,
        message: `Unknown dense union type id ${typeId}.`
      });
      continue;
    }
    const valueOffset = data.valueOffsets[valueOffsetIndex];
    const childLength = data.children[childIndex]?.length || 0;
    if (valueOffset < 0 || valueOffset >= childLength) {
      issues.push({
        path: `${path}.row[${rowIndex}].valueOffset`,
        message: `Dense union value offset ${valueOffset} is outside child ${childIndex}.`
      });
    }
  }
  for (const [childIndex, child] of data.children.entries()) {
    validateNativeData(child, `${path}.child[${childIndex}]`, issues);
  }
}

/** Returns whether two Arrow field-name sequences are identical. */
function sameNames(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((name, index) => name === right[index]);
}

/** Returns whether an encoding uses a concrete native or box layout. */
function isNativeEncoding(encoding: GeoArrowEncoding): boolean {
  return (
    encoding === 'geoarrow.point' ||
    encoding === 'geoarrow.linestring' ||
    encoding === 'geoarrow.polygon' ||
    encoding === 'geoarrow.multipoint' ||
    encoding === 'geoarrow.multilinestring' ||
    encoding === 'geoarrow.multipolygon' ||
    encoding === 'geoarrow.box'
  );
}

/** Validates WKB/WKT rows without changing the inspection-only hot path. */
function validateSerializedVector(
  column: arrow.Vector,
  encoding: 'geoarrow.wkb' | 'geoarrow.wkt',
  issues: GeoArrowValidationIssue[]
): void {
  for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
    const value = column.get(rowIndex);
    if (value == null) continue;
    try {
      if (encoding === 'geoarrow.wkb') {
        if (!(value instanceof Uint8Array)) {
          throw new Error('value is not a Uint8Array');
        }
        getWKBGeometryStatistics(value);
      } else if (typeof value !== 'string' || !convertWKTToGeometry(value)) {
        throw new Error('value is not valid WKT');
      }
    } catch (error) {
      issues.push({
        path: `row[${rowIndex}]`,
        message: error instanceof Error ? error.message : `Invalid ${encoding} value.`
      });
    }
  }
}

/** Resolves union buffer indexes for both full and already-sliced Arrow buffers. */
function getUnionBufferIndex(
  bufferLength: number,
  offset: number,
  rowIndex: number,
  useLogicalIndex: boolean
): number {
  if (useLogicalIndex) return rowIndex;
  return getDataBufferIndex(bufferLength, offset, rowIndex);
}

/** Resolves an Arrow buffer index for full backing buffers and shortened sliced views. */
function getDataBufferIndex(
  bufferLength: number,
  offset: number,
  logicalIndex: number,
  dataLength?: number
): number {
  if (dataLength !== undefined && bufferLength <= dataLength + 1) return logicalIndex;
  const physicalIndex = offset + logicalIndex;
  return physicalIndex < bufferLength ? physicalIndex : logicalIndex;
}

/** Selects an encoding that satisfies requirements, preferring zero-copy reuse. */
export function negotiateGeoArrowEncoding(
  field: arrow.Field,
  requirements: GeoArrowEncodingRequirements = {}
): GeoArrowEncoding | 'native' {
  const info = getGeoArrowFieldInfo(field);
  if (!info) {
    throw new Error(`Field "${field.name}" is not a recognized GeoArrow field.`);
  }
  if (requirements.encoding && requirements.encoding !== 'native') {
    if (info.encoding === requirements.encoding) {
      assertPhysicalRequirements(field, info, requirements);
      return requirements.encoding;
    }
    if (!requirements.allowConversion) {
      throw new Error(
        `Field "${field.name}" uses ${info.encoding || 'an unannotated encoding'}; ` +
          `${requirements.encoding} was requested without allowing conversion.`
      );
    }
    return requirements.encoding;
  }
  if (requirements.encoding === 'native') {
    if (info.encoding && info.encoding !== 'geoarrow.wkb' && info.encoding !== 'geoarrow.wkt') {
      assertPhysicalRequirements(field, info, requirements);
      return info.encoding;
    }
    return 'native';
  }
  if (info.encoding) {
    assertPhysicalRequirements(field, info, requirements);
    return info.encoding;
  }
  throw new Error(`Field "${field.name}" has no GeoArrow encoding metadata.`);
}

function getDimensionName(
  field: arrow.Field,
  dimension: number | null,
  geometryTypes?: readonly GeoParquetGeometryType[]
): GeoArrowDimension | null {
  if (dimension === null) {
    const metadataDimensions = new Set(
      (geometryTypes || []).map(geometryType => {
        if (geometryType.endsWith(' ZM')) return 'xyzm';
        if (geometryType.endsWith(' Z')) return 'xyz';
        if (geometryType.endsWith(' M')) return 'xym';
        return 'xy';
      })
    );
    return metadataDimensions.size === 1 ? [...metadataDimensions][0] : null;
  }
  const typeName = geometryTypes?.[0] || '';
  if (typeName.endsWith(' ZM')) return 'xyzm';
  if (typeName.endsWith(' Z')) return 'xyz';
  if (typeName.endsWith(' M')) return 'xym';
  const physicalDimension = getSeparatedDimensionName(field);
  if (physicalDimension) return physicalDimension;
  return dimension === 4 ? 'xyzm' : dimension === 3 ? 'xyz' : 'xy';
}

/** Infers Z versus M from canonical separated coordinate child names. */
function getSeparatedDimensionName(field: arrow.Field): GeoArrowDimension | null {
  const type = field.type;
  if (type instanceof arrow.Struct) {
    const childNames = new Set(type.children.map(child => child.name));
    if (childNames.has('xmin')) {
      if (childNames.has('zmin') && childNames.has('mmin')) return 'xyzm';
      if (childNames.has('zmin')) return 'xyz';
      if (childNames.has('mmin')) return 'xym';
      return 'xy';
    }
    if (childNames.has('z') && childNames.has('m')) return 'xyzm';
    if (childNames.has('z')) return 'xyz';
    if (childNames.has('m')) return 'xym';
    return null;
  }
  if (type instanceof arrow.List || type instanceof arrow.LargeList) {
    const child = type.children[0];
    return child ? getSeparatedDimensionName(child) : null;
  }
  return null;
}

function getOffsetType(type: arrow.DataType): GeoArrowOffsetType | null {
  if (
    type instanceof arrow.LargeList ||
    type instanceof arrow.LargeBinary ||
    type instanceof arrow.LargeUtf8
  ) {
    return 'int64';
  }
  if (type instanceof arrow.List || type instanceof arrow.Binary || type instanceof arrow.Utf8) {
    return 'int32';
  }
  if (
    type instanceof arrow.FixedSizeList ||
    type instanceof arrow.Struct ||
    type instanceof arrow.DenseUnion
  ) {
    for (const child of type.children) {
      const offsetType = getOffsetType(child.type);
      if (offsetType === 'int64') return offsetType;
    }
  }
  return null;
}

function assertPhysicalRequirements(
  field: arrow.Field,
  info: GeoArrowFieldInfo,
  requirements: GeoArrowEncodingRequirements
): void {
  if (
    requirements.coordinates &&
    info.coordinates &&
    requirements.coordinates !== info.coordinates
  ) {
    throw new Error(`Field "${field.name}" does not use ${requirements.coordinates} coordinates.`);
  }
  if (requirements.dimension && info.dimension && requirements.dimension !== info.dimension) {
    throw new Error(`Field "${field.name}" does not use ${requirements.dimension} coordinates.`);
  }
  if (requirements.offsetType && info.offsetType && requirements.offsetType !== info.offsetType) {
    throw new Error(`Field "${field.name}" does not use ${requirements.offsetType} offsets.`);
  }
}
