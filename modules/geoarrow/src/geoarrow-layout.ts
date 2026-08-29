// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {
  GeoArrowCoordinateLayout,
  GeoArrowDimension,
  GeoArrowEncoding,
  GeoArrowOffsetType
} from '@loaders.gl/schema';
import {getGeometryMetadataForField} from './metadata/geoarrow-metadata';
import {
  getGeoArrowUnionDimension,
  getGeoArrowUnionGeometryKind,
  type GeoArrowUnionGeometryKind
} from './lib/kernels/geoarrow-union';

/** Physical layout category reported by the GeoArrow layout oracle. */
export type GeoArrowLayoutKind =
  | 'point'
  | 'linestring'
  | 'polygon'
  | 'multipoint'
  | 'multilinestring'
  | 'multipolygon'
  | 'list-geometry'
  | 'geometry-union'
  | 'geometrycollection'
  | 'box'
  | 'wkb'
  | 'wkt'
  | 'unknown';

/** Arrow storage family used by a GeoArrow field or one of its children. */
export type GeoArrowStorageKind =
  | 'fixed-size-list'
  | 'list'
  | 'large-list'
  | 'struct'
  | 'dense-union'
  | 'binary'
  | 'large-binary'
  | 'binary-view'
  | 'utf8'
  | 'large-utf8'
  | 'utf8-view'
  | 'scalar'
  | 'unknown';

/** Floating-point precision used by native coordinate children. */
export type GeoArrowCoordinatePrecision = 'float16' | 'float32' | 'float64' | null;

/** Stable diagnostic code emitted by the GeoArrow layout oracle. */
export type GeoArrowLayoutIssueCode =
  | 'missing-extension'
  | 'unsupported-type'
  | 'wrong-physical-type'
  | 'wrong-child-count'
  | 'wrong-child-name'
  | 'wrong-coordinate-dimension'
  | 'wrong-coordinate-precision'
  | 'wrong-offset-width'
  | 'mixed-offset-width'
  | 'invalid-union'
  | 'unknown-union-child';

/** One stable, value-independent physical-layout diagnostic. */
export type GeoArrowLayoutIssue = Readonly<{
  /** Machine-readable issue category. */
  code: GeoArrowLayoutIssueCode;
  /** Field or nested type path associated with the issue. */
  path: string;
  /** Human-readable diagnostic. */
  message: string;
}>;

/** Nullability of one nested Arrow child field. */
export type GeoArrowChildNullability = Readonly<{
  /** Stable nested child path. */
  path: string;
  /** Arrow field name as supplied by the producer. */
  name: string;
  /** Whether the child field permits null values. */
  nullable: boolean;
}>;

/** Semantic descriptor for one dense-union child. */
export type GeoArrowUnionChildLayout = Readonly<{
  /** Child field name, which may be a legal non-canonical name. */
  name: string;
  /** Dense-union type ID associated with the child. */
  typeId: number;
  /** Geometry family inferred from the child name or canonical type ID. */
  geometryType: GeoArrowUnionGeometryKind | null;
  /** Coordinate dimension inferred from the child type, name, or type ID. */
  dimension: GeoArrowDimension | null;
}>;

/** Value-independent physical and semantic facts about a GeoArrow field. */
export type GeoArrowLayoutInfo = Readonly<{
  /** Field name supplied by the Arrow schema. */
  fieldName: string;
  /** Extension encoding declared in Arrow field metadata, if present. */
  encoding: GeoArrowEncoding | null;
  /** Classified physical layout. */
  kind: GeoArrowLayoutKind;
  /** Arrow type string, useful in diagnostics and explain plans. */
  arrowType: string;
  /** Whether the root storage is fixed, regular, large, view, struct, or union storage. */
  storage: GeoArrowStorageKind;
  /** All storage families encountered in depth-first child order. */
  storageKinds: readonly GeoArrowStorageKind[];
  /** Common coordinate dimension, or null when children are mixed or unavailable. */
  dimension: GeoArrowDimension | null;
  /** Common native coordinate layout, or null when children are mixed or unavailable. */
  coordinates: GeoArrowCoordinateLayout | null;
  /** Common native coordinate precision, or null when unavailable or mixed. */
  coordinatePrecision: GeoArrowCoordinatePrecision;
  /** Offset widths encountered in nested lists or variable-width strings/binaries. */
  offsetTypes: readonly GeoArrowOffsetType[];
  /** Every nested Arrow child field in stable depth-first order. */
  childNullability: readonly GeoArrowChildNullability[];
  /** Child names in stable depth-first order. */
  childNames: readonly string[];
  /** Dense-union child descriptors, when the field contains a union. */
  unionChildren: readonly GeoArrowUnionChildLayout[];
  /** Dense-union type IDs in the physical schema order. */
  unionTypeIds: readonly number[];
}>;

/** Result of inspecting one field without reading any array values. */
export type GeoArrowLayoutInspection = Readonly<{
  /** Whether the physical layout and declared extension are compatible. */
  valid: boolean;
  /** Structured layout facts. */
  layout: GeoArrowLayoutInfo;
  /** Stable diagnostics, ordered by schema traversal. */
  issues: readonly GeoArrowLayoutIssue[];
}>;

type LayoutState = {
  kind: GeoArrowLayoutKind;
  storageKinds: GeoArrowStorageKind[];
  dimensions: GeoArrowDimension[];
  coordinates: GeoArrowCoordinateLayout[];
  precisions: GeoArrowCoordinatePrecision[];
  offsetTypes: GeoArrowOffsetType[];
  childNullability: GeoArrowChildNullability[];
  childNames: string[];
  unionChildren: GeoArrowUnionChildLayout[];
  unionTypeIds: number[];
};

type GeoArrowNativeLayoutKind = keyof typeof NATIVE_LAYOUTS;

const NATIVE_LAYOUTS: Readonly<
  Record<
    Exclude<
      GeoArrowLayoutKind,
      'list-geometry' | 'geometry-union' | 'geometrycollection' | 'box' | 'wkb' | 'wkt' | 'unknown'
    >,
    {depth: number; encoding: GeoArrowEncoding}
  >
> = {
  point: {depth: 0, encoding: 'geoarrow.point'},
  linestring: {depth: 1, encoding: 'geoarrow.linestring'},
  multipoint: {depth: 1, encoding: 'geoarrow.multipoint'},
  polygon: {depth: 2, encoding: 'geoarrow.polygon'},
  multilinestring: {depth: 2, encoding: 'geoarrow.multilinestring'},
  multipolygon: {depth: 3, encoding: 'geoarrow.multipolygon'}
};

/**
 * Inspects a GeoArrow field from its Arrow type and extension metadata.
 *
 * This function never calls `get()` on a vector and never examines coordinate or serialized
 * values. It is suitable for schema validation, capability negotiation, and query planning.
 * Legal dense-union child names are retained as supplied; semantic child families are resolved
 * from names when possible and otherwise from the canonical GeoArrow type-ID bands.
 *
 * @param field Arrow field to inspect.
 * @returns A deterministic layout report and value-independent diagnostics.
 */
export function inspectGeoArrowLayout(field: arrow.Field): GeoArrowLayoutInspection {
  const metadata = getGeometryMetadataForField(field.metadata || new Map());
  const encoding = metadata?.encoding || null;
  const issues: GeoArrowLayoutIssue[] = [];
  const state: LayoutState = {
    kind: 'unknown',
    storageKinds: [],
    dimensions: [],
    coordinates: [],
    precisions: [],
    offsetTypes: [],
    childNullability: [],
    childNames: [],
    unionChildren: [],
    unionTypeIds: []
  };

  visitType(field.type, field.name, state);
  state.kind = classifyField(field.type, encoding, field.name, state, issues);

  if (!encoding) {
    issues.push({
      code: 'missing-extension',
      path: field.name,
      message: 'GeoArrow extension name is missing.'
    });
  } else {
    validateDeclaredEncoding(field.type, encoding, field.name, state, issues);
  }

  if (state.offsetTypes.length > 1 && new Set(state.offsetTypes).size > 1) {
    issues.push({
      code: 'mixed-offset-width',
      path: `${field.name}.offsets`,
      message: 'GeoArrow layout mixes 32-bit and 64-bit offsets.'
    });
  }

  const layout: GeoArrowLayoutInfo = {
    fieldName: field.name,
    encoding,
    kind: state.kind,
    arrowType: field.type.toString(),
    storage: state.storageKinds[0] || 'unknown',
    storageKinds: state.storageKinds,
    dimension: getCommonValue(state.dimensions),
    coordinates: getCommonValue(state.coordinates),
    coordinatePrecision: getCommonValue(state.precisions),
    offsetTypes: state.offsetTypes,
    childNullability: state.childNullability,
    childNames: state.childNames,
    unionChildren: state.unionChildren,
    unionTypeIds: state.unionTypeIds
  };
  return {valid: issues.length === 0, layout, issues};
}

/** Records storage and child-field facts without looking at vector values. */
function visitType(type: arrow.DataType, path: string, state: LayoutState): void {
  const storage = getStorageKind(type);
  state.storageKinds.push(storage);
  if (type instanceof arrow.List || type instanceof arrow.LargeList) {
    state.offsetTypes.push(type instanceof arrow.LargeList ? 'int64' : 'int32');
  } else if (type instanceof arrow.Binary || type instanceof arrow.LargeBinary) {
    state.offsetTypes.push(type instanceof arrow.LargeBinary ? 'int64' : 'int32');
  } else if (type instanceof arrow.DenseUnion) {
    state.unionTypeIds.push(...Array.from(type.typeIds));
    for (let childIndex = 0; childIndex < type.children.length; childIndex++) {
      const child = type.children[childIndex];
      state.childNames.push(child.name);
      state.childNullability.push({
        path: `${path}.child[${childIndex}]`,
        name: child.name,
        nullable: child.nullable
      });
      const typeId = type.typeIds[childIndex];
      state.unionChildren.push({
        name: child.name,
        typeId,
        geometryType: getGeoArrowUnionGeometryKind(child.name, typeId),
        dimension: getGeoArrowUnionDimension(child.name, child.type, typeId)
      });
      visitType(child.type, `${path}.child[${childIndex}]`, state);
    }
    return;
  }
  const children = type.children || [];
  for (let childIndex = 0; childIndex < children.length; childIndex++) {
    const child = children[childIndex];
    state.childNames.push(child.name);
    state.childNullability.push({
      path: `${path}.child[${childIndex}]`,
      name: child.name,
      nullable: child.nullable
    });
    visitType(child.type, `${path}.child[${childIndex}]`, state);
  }
}

/** Classifies physical Arrow types and validates their intrinsic structure. */
function classifyField(
  type: arrow.DataType,
  encoding: GeoArrowEncoding | null,
  path: string,
  state: LayoutState,
  issues: GeoArrowLayoutIssue[]
): GeoArrowLayoutKind {
  if (
    type instanceof arrow.Binary ||
    type instanceof arrow.LargeBinary ||
    type instanceof arrow.BinaryView
  ) {
    return 'wkb';
  }
  if (
    type instanceof arrow.Utf8 ||
    type instanceof arrow.LargeUtf8 ||
    type instanceof arrow.Utf8View
  ) {
    return 'wkt';
  }
  if (isBoxType(type)) {
    state.kind = 'box';
    validateBoxType(type, path, issues);
    recordCoordinateSemantics(type, state, 'separated');
    return 'box';
  }
  if (type instanceof arrow.DenseUnion) {
    validateUnionType(type, path, state, issues);
    if (encoding === 'geoarrow.geometrycollection') {
      issues.push({
        code: 'wrong-physical-type',
        path,
        message: 'geoarrow.geometrycollection requires a list containing a dense union.'
      });
    }
    validateUnionChildren(type, path, issues);
    return 'geometry-union';
  }
  if (
    (type instanceof arrow.List || type instanceof arrow.LargeList) &&
    type.children[0]?.type instanceof arrow.DenseUnion
  ) {
    validateUnionType(type.children[0].type, `${path}.child[0]`, state, issues);
    validateUnionChildren(type.children[0].type, `${path}.child[0]`, issues);
    return 'geometrycollection';
  }

  const nativeKind = getNativeKind(type, encoding);
  if (nativeKind) {
    const definition = NATIVE_LAYOUTS[nativeKind];
    validateNativeType(type, definition.depth, path, state, issues);
    return nativeKind;
  }
  if (isPotentialNativeType(type)) {
    const depth = getListDepth(type);
    validateNativeType(type, depth, path, state, issues);
    return depth === 0 ? 'point' : 'list-geometry';
  }
  if (encoding === 'geoarrow.box') {
    issues.push({
      code: 'wrong-physical-type',
      path,
      message: 'geoarrow.box requires a Struct with canonical min/max floating-point children.'
    });
  } else if (encoding && encoding !== 'geoarrow.wkb' && encoding !== 'geoarrow.wkt') {
    issues.push({
      code: 'unsupported-type',
      path,
      message: `GeoArrow encoding ${encoding} has no recognized physical Arrow layout.`
    });
  }
  return 'unknown';
}

/** Validates that the declared extension agrees with the classified physical layout. */
function validateDeclaredEncoding(
  type: arrow.DataType,
  encoding: GeoArrowEncoding,
  path: string,
  state: LayoutState,
  issues: GeoArrowLayoutIssue[]
): void {
  const expectedKind = encodingToKind(encoding);
  const actualKind = state.kind;
  if (encoding === 'geoarrow.wkb' && actualKind !== 'wkb') {
    addWrongPhysicalType(path, encoding, issues);
  } else if (encoding === 'geoarrow.wkt' && actualKind !== 'wkt') {
    addWrongPhysicalType(path, encoding, issues);
  } else if (encoding === 'geoarrow.geometry' && actualKind !== 'geometry-union') {
    addWrongPhysicalType(path, encoding, issues);
  } else if (encoding === 'geoarrow.geometrycollection' && actualKind !== 'geometrycollection') {
    addWrongPhysicalType(path, encoding, issues);
  } else if (encoding === 'geoarrow.box' && actualKind !== 'box') {
    addWrongPhysicalType(path, encoding, issues);
  } else if (expectedKind && actualKind !== expectedKind) {
    addWrongPhysicalType(path, encoding, issues);
  }
  if (expectedKind && NATIVE_LAYOUTS[expectedKind]) {
    const expectedDepth = NATIVE_LAYOUTS[expectedKind].depth;
    const actualDepth = getListDepth(type);
    if (actualDepth !== expectedDepth) {
      issues.push({
        code: 'wrong-child-count',
        path,
        message: `${encoding} requires ${expectedDepth} list level${expectedDepth === 1 ? '' : 's'} before coordinates; found ${actualDepth}.`
      });
    }
  }
  if (encoding === 'geoarrow.geometrycollection' && type instanceof arrow.List) {
    // The LargeList case is intentionally handled below as well; this branch only keeps the
    // diagnostic path stable for the common 32-bit representation.
    if (!(type.children[0]?.type instanceof arrow.DenseUnion)) {
      addWrongPhysicalType(path, encoding, issues);
    }
  }
}

/** Validates one concrete native layout and records coordinate semantics. */
function validateNativeType(
  type: arrow.DataType,
  expectedDepth: number,
  path: string,
  state: LayoutState,
  issues: GeoArrowLayoutIssue[]
): void {
  let current = type;
  for (let depth = 0; depth < expectedDepth; depth++) {
    if (!(current instanceof arrow.List || current instanceof arrow.LargeList)) {
      issues.push({
        code: 'wrong-child-count',
        path,
        message: `Expected list level ${depth + 1} before the coordinate type.`
      });
      return;
    }
    if (current.children.length !== 1 || !current.children[0]) {
      issues.push({
        code: 'wrong-child-count',
        path,
        message: 'GeoArrow list layouts must contain exactly one child field.'
      });
      return;
    }
    current = current.children[0].type;
  }
  validateCoordinateType(current, path, state, issues);
}

/** Validates a coordinate leaf and preserves exact Z/M semantics from separated names. */
function validateCoordinateType(
  type: arrow.DataType,
  path: string,
  state: LayoutState,
  issues: GeoArrowLayoutIssue[]
): void {
  if (type instanceof arrow.FixedSizeList) {
    if (type.children.length !== 1 || !type.children[0]) {
      issues.push({
        code: 'wrong-child-count',
        path,
        message: 'Interleaved GeoArrow coordinates must contain exactly one child field.'
      });
      return;
    }
    if (type.listSize < 2 || type.listSize > 4) {
      issues.push({
        code: 'wrong-coordinate-dimension',
        path,
        message: 'GeoArrow coordinates must contain two, three, or four values.'
      });
    } else {
      state.dimensions.push(dimensionFromSize(type.listSize)!);
      state.coordinates.push('interleaved');
    }
    recordFloatPrecision(type.children[0].type, `${path}.child[0]`, state, issues);
    return;
  }
  if (type instanceof arrow.Struct) {
    const names = type.children.map(child => child.name);
    const dimension = getSeparatedDimension(names);
    if (!dimension) {
      issues.push({
        code: 'wrong-child-name',
        path,
        message: `Separated GeoArrow coordinates must use canonical x/y[/z|m] child order; found ${names.join(', ')}.`
      });
    } else {
      state.dimensions.push(dimension);
      state.coordinates.push('separated');
    }
    if (type.children.length < 2 || type.children.length > 4) {
      issues.push({
        code: 'wrong-coordinate-dimension',
        path,
        message: 'Separated GeoArrow coordinates must contain two, three, or four children.'
      });
    }
    for (let childIndex = 0; childIndex < type.children.length; childIndex++) {
      recordFloatPrecision(
        type.children[childIndex].type,
        `${path}.child[${childIndex}]`,
        state,
        issues
      );
    }
    return;
  }
  issues.push({
    code: 'wrong-physical-type',
    path,
    message: `Expected a GeoArrow coordinate type, found ${type.toString()}.`
  });
}

/** Records floating precision and rejects unsupported coordinate scalar types. */
function recordFloatPrecision(
  type: arrow.DataType,
  path: string,
  state: LayoutState,
  issues: GeoArrowLayoutIssue[]
): void {
  if (!(type instanceof arrow.Float)) {
    issues.push({
      code: 'wrong-coordinate-precision',
      path,
      message: 'GeoArrow coordinate children must be floating-point values.'
    });
    return;
  }
  const precision =
    type.precision === arrow.Precision.HALF
      ? 'float16'
      : type.precision === arrow.Precision.SINGLE
        ? 'float32'
        : 'float64';
  state.precisions.push(precision);
  if (precision === 'float16') {
    issues.push({
      code: 'wrong-coordinate-precision',
      path,
      message: 'GeoArrow coordinates support float32 or float64, not float16.'
    });
  }
}

/** Validates a canonical GeoArrow Box struct without inspecting any row values. */
function validateBoxType(type: arrow.DataType, path: string, issues: GeoArrowLayoutIssue[]): void {
  if (!(type instanceof arrow.Struct)) return;
  const names = type.children.map(child => child.name);
  if (!getBoxDimension(names)) {
    issues.push({
      code: 'wrong-child-name',
      path,
      message: `GeoArrow Box children must use canonical min/max order; found ${names.join(', ')}.`
    });
  }
  for (let childIndex = 0; childIndex < type.children.length; childIndex++) {
    if (!(type.children[childIndex].type instanceof arrow.Float)) {
      issues.push({
        code: 'wrong-coordinate-precision',
        path: `${path}.child[${childIndex}]`,
        message: 'GeoArrow Box children must be floating-point values.'
      });
    }
  }
}

/** Validates dense-union schema IDs without inspecting row type-ID buffers. */
function validateUnionType(
  type: arrow.DenseUnion,
  path: string,
  state: LayoutState,
  issues: GeoArrowLayoutIssue[]
): void {
  if (type.typeIds.length !== type.children.length || type.children.length === 0) {
    issues.push({
      code: 'invalid-union',
      path,
      message: 'Dense union must contain one non-empty type ID for every child field.'
    });
  }
  const seen = new Set<number>();
  for (let childIndex = 0; childIndex < type.typeIds.length; childIndex++) {
    const typeId = type.typeIds[childIndex];
    if (!Number.isInteger(typeId) || typeId < -128 || typeId > 127 || seen.has(typeId)) {
      issues.push({
        code: 'invalid-union',
        path: `${path}.typeIds[${childIndex}]`,
        message: `Dense union type ID ${typeId} must be a unique signed 8-bit integer.`
      });
    }
    seen.add(typeId);
  }
  state.unionTypeIds = Array.from(type.typeIds);
}

/** Validates semantic union children and recursively checks their physical native layout. */
function validateUnionChildren(
  type: arrow.DenseUnion,
  path: string,
  issues: GeoArrowLayoutIssue[]
): void {
  for (let childIndex = 0; childIndex < type.children.length; childIndex++) {
    const child = type.children[childIndex];
    const typeId = type.typeIds[childIndex];
    const geometryType = getGeoArrowUnionGeometryKind(child.name, typeId);
    if (!geometryType) {
      issues.push({
        code: 'unknown-union-child',
        path: `${path}.child[${childIndex}]`,
        message: `Dense union child ${child.name || childIndex} does not identify a supported geometry family.`
      });
      continue;
    }
    const childPath = `${path}.child[${childIndex}]`;
    if (geometryType === 'GeometryCollection') {
      if (
        !(child.type instanceof arrow.List || child.type instanceof arrow.LargeList) ||
        !(child.type.children[0]?.type instanceof arrow.DenseUnion)
      ) {
        issues.push({
          code: 'wrong-physical-type',
          path: childPath,
          message: 'GeometryCollection union children require a list of dense union children.'
        });
      }
      continue;
    }
    const kind = geometryTypeToLayoutKind(geometryType);
    if (kind) {
      validateNativeType(
        child.type,
        NATIVE_LAYOUTS[kind].depth,
        childPath,
        {
          kind: 'unknown',
          storageKinds: [],
          dimensions: [],
          coordinates: [],
          precisions: [],
          offsetTypes: [],
          childNullability: [],
          childNames: [],
          unionChildren: [],
          unionTypeIds: []
        },
        issues
      );
    }
  }
}

/** Records the coordinate semantics of a Box struct. */
function recordCoordinateSemantics(
  type: arrow.DataType,
  state: LayoutState,
  coordinates: GeoArrowCoordinateLayout
): void {
  if (!(type instanceof arrow.Struct)) return;
  const dimension = getBoxDimension(type.children.map(child => child.name));
  if (dimension) {
    state.dimensions.push(dimension);
    state.coordinates.push(coordinates);
    for (const child of type.children) {
      if (child.type instanceof arrow.Float) {
        state.precisions.push(
          child.type.precision === arrow.Precision.SINGLE ? 'float32' : 'float64'
        );
      }
    }
  }
}

/** Returns whether a type is structurally capable of being a native geometry. */
function isPotentialNativeType(type: arrow.DataType): boolean {
  return (
    type instanceof arrow.FixedSizeList ||
    type instanceof arrow.Struct ||
    type instanceof arrow.List ||
    type instanceof arrow.LargeList
  );
}

/** Returns the number of list levels before a coordinate candidate. */
function getListDepth(type: arrow.DataType): number {
  let depth = 0;
  let current = type;
  while (current instanceof arrow.List || current instanceof arrow.LargeList) {
    depth++;
    current = current.children[0]?.type;
    if (!current) break;
  }
  return depth;
}

/** Resolves a concrete native kind from metadata or an unambiguous physical shape. */
function getNativeKind(
  type: arrow.DataType,
  encoding: GeoArrowEncoding | null
): GeoArrowNativeLayoutKind | null {
  const encodingKind = encoding ? encodingToKind(encoding) : null;
  if (isNativeLayoutKind(encodingKind)) return encodingKind;
  if (type instanceof arrow.FixedSizeList || isCoordinateStruct(type)) return 'point';
  return null;
}

/** Maps a union geometry family to the corresponding concrete layout kind. */
function geometryTypeToLayoutKind(
  geometryType: Exclude<GeoArrowUnionGeometryKind, 'GeometryCollection'>
): GeoArrowNativeLayoutKind | null {
  const kind = geometryType.toLowerCase() as GeoArrowLayoutKind;
  return isNativeLayoutKind(kind) ? kind : null;
}

/** Narrows a classified layout to one of the six concrete native geometry families. */
function isNativeLayoutKind(kind: GeoArrowLayoutKind | null): kind is GeoArrowNativeLayoutKind {
  return Boolean(kind && Object.prototype.hasOwnProperty.call(NATIVE_LAYOUTS, kind));
}

/** Maps an extension encoding to its physical layout kind when concrete. */
function encodingToKind(encoding: GeoArrowEncoding): GeoArrowLayoutKind | null {
  switch (encoding) {
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
    case 'geoarrow.geometry':
      return 'geometry-union';
    case 'geoarrow.geometrycollection':
      return 'geometrycollection';
    case 'geoarrow.box':
      return 'box';
    case 'geoarrow.wkb':
      return 'wkb';
    case 'geoarrow.wkt':
      return 'wkt';
  }
}

/** Adds a consistent physical-type mismatch diagnostic. */
function addWrongPhysicalType(
  path: string,
  encoding: GeoArrowEncoding,
  issues: GeoArrowLayoutIssue[]
): void {
  issues.push({
    code: 'wrong-physical-type',
    path,
    message: `Encoding ${encoding} is incompatible with the Arrow physical layout.`
  });
}

/** Returns the root storage family for one Arrow type. */
function getStorageKind(type: arrow.DataType): GeoArrowStorageKind {
  if (type instanceof arrow.FixedSizeList) return 'fixed-size-list';
  if (type instanceof arrow.List) return 'list';
  if (type instanceof arrow.LargeList) return 'large-list';
  if (type instanceof arrow.Struct) return 'struct';
  if (type instanceof arrow.DenseUnion) return 'dense-union';
  if (type instanceof arrow.Binary) return 'binary';
  if (type instanceof arrow.LargeBinary) return 'large-binary';
  if (type instanceof arrow.BinaryView) return 'binary-view';
  if (type instanceof arrow.Utf8) return 'utf8';
  if (type instanceof arrow.LargeUtf8) return 'large-utf8';
  if (type instanceof arrow.Utf8View) return 'utf8-view';
  if (type instanceof arrow.Float || type instanceof arrow.Int) return 'scalar';
  return 'unknown';
}

/** Returns true for a coordinate struct rather than a Box struct. */
function isCoordinateStruct(type: arrow.DataType): boolean {
  return (
    type instanceof arrow.Struct &&
    getSeparatedDimension(type.children.map(child => child.name)) !== null
  );
}

/** Resolves canonical separated coordinate names to exact dimensions. */
function getSeparatedDimension(names: readonly string[]): GeoArrowDimension | null {
  if (sameNames(names, ['x', 'y'])) return 'xy';
  if (sameNames(names, ['x', 'y', 'z'])) return 'xyz';
  if (sameNames(names, ['x', 'y', 'm'])) return 'xym';
  if (sameNames(names, ['x', 'y', 'z', 'm'])) return 'xyzm';
  return null;
}

/** Resolves canonical Box names to exact dimensions. */
function getBoxDimension(names: readonly string[]): GeoArrowDimension | null {
  if (sameNames(names, ['xmin', 'ymin', 'xmax', 'ymax'])) return 'xy';
  if (sameNames(names, ['xmin', 'ymin', 'zmin', 'xmax', 'ymax', 'zmax'])) return 'xyz';
  if (sameNames(names, ['xmin', 'ymin', 'mmin', 'xmax', 'ymax', 'mmax'])) return 'xym';
  if (sameNames(names, ['xmin', 'ymin', 'zmin', 'mmin', 'xmax', 'ymax', 'zmax', 'mmax'])) {
    return 'xyzm';
  }
  return null;
}

/** Returns true for a valid canonical Box shape, including floating children. */
function isBoxType(type: arrow.DataType): boolean {
  return (
    type instanceof arrow.Struct &&
    getBoxDimension(type.children.map(child => child.name)) !== null &&
    type.children.every(child => child.type instanceof arrow.Float)
  );
}

/** Returns a value when all values agree, or null for mixed or empty values. */
function getCommonValue<T>(values: readonly T[]): T | null {
  const firstValue = values[0];
  return firstValue !== undefined && values.every(value => value === firstValue)
    ? firstValue
    : null;
}

/** Returns whether two ordered child-name sequences are equal. */
function sameNames(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((name, index) => name === right[index]);
}

/** Converts a fixed-size coordinate width into an exact semantic dimension. */
function dimensionFromSize(size: number): GeoArrowDimension | null {
  return size === 2 ? 'xy' : size === 3 ? 'xyz' : size === 4 ? 'xyzm' : null;
}
