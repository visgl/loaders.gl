// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {
  GeoArrowCoordinateLayout,
  GeoArrowDimension,
  GeoArrowOffsetType,
  GeoParquetGeometryType
} from '@loaders.gl/schema';
import {
  GeoArrowBuilder,
  type GeoArrowBuilderEncoding,
  type GeoArrowGeometryWriter
} from '../../geoarrow-builder';

type WKTGeometryKind =
  | 'Point'
  | 'LineString'
  | 'Polygon'
  | 'MultiPoint'
  | 'MultiLineString'
  | 'MultiPolygon'
  | 'GeometryCollection';

type WKTCoordinates = number[] | WKTCoordinates[];

type ParsedWKTGeometry = Readonly<{
  kind: WKTGeometryKind;
  dimension: GeoArrowDimension;
  coordinates?: WKTCoordinates;
  geometries?: readonly ParsedWKTGeometry[];
}>;

type WKTUnionChild = Readonly<{
  kind: WKTGeometryKind;
  dimension: GeoArrowDimension;
}>;

const UNION_GEOMETRY_KINDS: readonly Exclude<WKTGeometryKind, 'GeometryCollection'>[] = [
  'Point',
  'LineString',
  'Polygon',
  'MultiPoint',
  'MultiLineString',
  'MultiPolygon'
];

const GEOMETRY_KINDS: readonly WKTGeometryKind[] = [
  'Point',
  'LineString',
  'Polygon',
  'MultiPoint',
  'MultiLineString',
  'MultiPolygon',
  'GeometryCollection'
];

/**
 * Decodes homogeneous WKT rows directly into native GeoArrow buffers.
 *
 * The parser produces only numeric coordinate arrays and immediately feeds them to the
 * two-pass GeoArrow builder. It deliberately does not construct GeoJSON geometry objects.
 * Mixed WKT columns and geometry collections use the matching typed union kernels.
 *
 * @param column WKT Arrow vector.
 * @param targetEncoding Concrete native target encoding.
 * @param dimension Optional exact output dimension.
 * @param coordinates Output coordinate layout.
 * @param offsetType Output list offset width.
 * @param maxGeometryCollectionDepth Maximum nested collection depth.
 * @returns Native vector or `null` when the WKT column is not homogeneous and representable.
 */
export function decodeWKTNativeVector(
  column: arrow.Vector,
  targetEncoding: Exclude<GeoArrowBuilderEncoding, 'geoarrow.box'>,
  dimension?: GeoArrowDimension,
  coordinates: GeoArrowCoordinateLayout = 'interleaved',
  offsetType: GeoArrowOffsetType = 'int32',
  maxGeometryCollectionDepth = 64
): arrow.Vector | null {
  const parsedRows: (ParsedWKTGeometry | null)[] = [];
  let inferredDimension: GeoArrowDimension | undefined;

  for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
    const value = column.get(rowIndex);
    if (value == null) {
      parsedRows.push(null);
      continue;
    }
    if (typeof value !== 'string') return null;
    const parsed = parseWKT(value, maxGeometryCollectionDepth);
    if (!parsed || parsed.kind !== getGeometryKind(targetEncoding)) return null;
    if (!dimension) {
      if (inferredDimension && inferredDimension !== parsed.dimension) return null;
      inferredDimension = parsed.dimension;
    }
    parsedRows.push(parsed);
  }

  const outputDimension = dimension || inferredDimension || 'xy';
  const writers: GeoArrowGeometryWriter[] = parsedRows.map(parsed =>
    parsed ? builder => writeParsedGeometry(builder, parsed) : null
  );
  const geometryArray = GeoArrowBuilder.buildGeometryArray(writers, {
    encoding: targetEncoding,
    dimension: outputDimension,
    coordinateLayout: coordinates,
    offsetType
  });
  return arrow.makeVector(GeoArrowBuilder.makeGeometryData(geometryArray));
}

/**
 * Decodes mixed WKT rows directly into a dense GeoArrow union.
 *
 * Each union child is built from numeric parser output with the same incremental builder used
 * by homogeneous WKT conversion. Child order and type IDs are canonical and independent of row
 * order, which makes the result safe to concatenate across record batches.
 *
 * @param column WKT Arrow vector.
 * @param dimension Optional dimension forced on every union child.
 * @param coordinates Output coordinate layout.
 * @param offsetType Output list offset width inside union children.
 * @param geometryTypes Optional metadata used to seed stable absent children.
 * @param maxGeometryCollectionDepth Maximum nested collection depth.
 * @returns Dense union vector or `null` when a row cannot be represented.
 */
export function decodeWKTUnionVector(
  column: arrow.Vector,
  dimension?: GeoArrowDimension,
  coordinates: GeoArrowCoordinateLayout = 'interleaved',
  offsetType: GeoArrowOffsetType = 'int32',
  geometryTypes?: readonly GeoParquetGeometryType[],
  maxGeometryCollectionDepth = 64
): arrow.Vector | null {
  const parsedRows: (ParsedWKTGeometry | null)[] = [];
  for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
    const value = column.get(rowIndex);
    if (value == null) {
      parsedRows.push(null);
      continue;
    }
    if (typeof value !== 'string') return null;
    const parsed = parseWKT(value, maxGeometryCollectionDepth);
    if (!parsed) return null;
    parsedRows.push(parsed);
  }
  return makeWKTUnionVector(parsedRows, dimension, coordinates, offsetType, geometryTypes, true);
}

/**
 * Decodes WKT GeometryCollection rows into a list of dense-union children.
 *
 * @param column WKT Arrow vector.
 * @param dimension Optional dimension forced on every union child.
 * @param coordinates Output coordinate layout.
 * @param offsetType Output list offset width inside union children and the collection list.
 * @param geometryTypes Optional metadata used to seed stable absent children.
 * @param maxGeometryCollectionDepth Maximum nested collection depth.
 * @returns Geometry collection vector or `null` when a row cannot be represented.
 */
export function decodeWKTGeometryCollectionVector(
  column: arrow.Vector,
  dimension?: GeoArrowDimension,
  coordinates: GeoArrowCoordinateLayout = 'interleaved',
  offsetType: GeoArrowOffsetType = 'int32',
  geometryTypes?: readonly GeoParquetGeometryType[],
  maxGeometryCollectionDepth = 64
): arrow.Vector | null {
  const parsedCollections: (ParsedWKTGeometry | null)[] = [];

  for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
    const value = column.get(rowIndex);
    if (value == null) {
      parsedCollections.push(null);
      continue;
    }
    if (typeof value !== 'string') return null;
    const parsed = parseWKT(value, maxGeometryCollectionDepth);
    if (!parsed || parsed.kind !== 'GeometryCollection') return null;
    parsedCollections.push(parsed);
  }
  return makeWKTCollectionVector(
    parsedCollections,
    dimension,
    coordinates,
    offsetType,
    geometryTypes
  );
}

function makeWKTUnionVector(
  parsedRows: readonly (ParsedWKTGeometry | null)[],
  dimension: GeoArrowDimension | undefined,
  coordinates: GeoArrowCoordinateLayout,
  offsetType: GeoArrowOffsetType,
  geometryTypes?: readonly GeoParquetGeometryType[],
  allowGeometryCollection = true
): arrow.Vector | null {
  const children = new Map<string, WKTUnionChild>();
  for (const geometryType of geometryTypes || []) {
    const child = getWKTUnionChild(geometryType, dimension);
    if (child) children.set(getWKTUnionChildKey(child), child);
  }
  for (const parsed of parsedRows) {
    if (!parsed) continue;
    if (!allowGeometryCollection && parsed.kind === 'GeometryCollection') return null;
    const child = {
      kind: parsed.kind as WKTUnionChild['kind'],
      dimension: dimension || parsed.dimension
    };
    children.set(getWKTUnionChildKey(child), child);
  }

  const firstChild: WKTUnionChild = children.values().next().value || {
    kind: 'Point',
    dimension: 'xy'
  };
  children.set(getWKTUnionChildKey(firstChild), firstChild);
  const orderedChildren = [...children.values()].sort(
    (left, right) => getWKTUnionTypeId(left) - getWKTUnionTypeId(right)
  );
  const childRows = new Map<string, (ParsedWKTGeometry | null)[]>();
  const typeIds = new Int8Array(parsedRows.length);
  const valueOffsets = new Int32Array(parsedRows.length);

  for (let rowIndex = 0; rowIndex < parsedRows.length; rowIndex++) {
    const parsed = parsedRows[rowIndex];
    const child = parsed
      ? {kind: parsed.kind as WKTUnionChild['kind'], dimension: dimension || parsed.dimension}
      : firstChild;
    const key = getWKTUnionChildKey(child);
    const values = childRows.get(key) || [];
    valueOffsets[rowIndex] = values.length;
    values.push(parsed);
    childRows.set(key, values);
    typeIds[rowIndex] = getWKTUnionTypeId(child);
  }

  const fields: arrow.Field[] = [];
  const childData: arrow.Data[] = [];
  for (const child of orderedChildren) {
    const rows = childRows.get(getWKTUnionChildKey(child)) || [];
    if (child.kind === 'GeometryCollection') {
      const collectionVector = makeWKTCollectionVector(
        rows,
        dimension,
        coordinates,
        offsetType,
        geometryTypes
      );
      if (!collectionVector) return null;
      fields.push(new arrow.Field(getWKTUnionFieldName(child), collectionVector.type, true));
      childData.push(collectionVector.data[0]);
      continue;
    }
    const writers: GeoArrowGeometryWriter[] = rows.map(parsed =>
      parsed ? builder => writeParsedGeometry(builder, parsed) : null
    );
    const geometryArray = GeoArrowBuilder.buildGeometryArray(writers, {
      encoding: getBuilderEncoding(child.kind),
      dimension: child.dimension,
      coordinateLayout: coordinates,
      offsetType
    });
    const childVector = arrow.makeVector(GeoArrowBuilder.makeGeometryData(geometryArray));
    fields.push(new arrow.Field(getWKTUnionFieldName(child), childVector.type, true));
    childData.push(childVector.data[0]);
  }

  const unionType = new arrow.DenseUnion(orderedChildren.map(getWKTUnionTypeId), fields);
  return arrow.makeVector(
    arrow.makeData({
      type: unionType,
      length: parsedRows.length,
      nullCount: 0,
      typeIds,
      valueOffsets,
      children: childData
    } as any)
  );
}

function makeWKTCollectionVector(
  parsedRows: readonly (ParsedWKTGeometry | null)[],
  dimension: GeoArrowDimension | undefined,
  coordinates: GeoArrowCoordinateLayout,
  offsetType: GeoArrowOffsetType,
  geometryTypes?: readonly GeoParquetGeometryType[]
): arrow.Vector | null {
  const flattenedChildren: ParsedWKTGeometry[] = [];
  const collectionOffsets = [0];
  const nullBitmap = new Uint8Array(Math.ceil(parsedRows.length / 8));
  let nullCount = 0;

  for (let rowIndex = 0; rowIndex < parsedRows.length; rowIndex++) {
    const parsed = parsedRows[rowIndex];
    if (!parsed) {
      nullCount++;
      collectionOffsets.push(flattenedChildren.length);
      continue;
    }
    if (parsed.kind !== 'GeometryCollection') return null;
    for (const child of parsed.geometries || []) flattenedChildren.push(child);
    nullBitmap[rowIndex >> 3] |= 1 << (rowIndex & 7);
    collectionOffsets.push(flattenedChildren.length);
  }

  const unionVector = makeWKTUnionVector(
    flattenedChildren,
    dimension,
    coordinates,
    offsetType,
    geometryTypes?.filter(
      geometryType => !geometryType.toLowerCase().startsWith('geometrycollection')
    ),
    false
  );
  if (!unionVector) return null;
  const listField = new arrow.Field('geometries', unionVector.type, true);
  const listType =
    offsetType === 'int64' ? new arrow.LargeList(listField) : new arrow.List(listField);
  return arrow.makeVector(
    arrow.makeData({
      type: listType,
      length: parsedRows.length,
      nullCount,
      valueOffsets: createWKTOffsets(collectionOffsets, offsetType),
      nullBitmap: nullCount > 0 ? nullBitmap : undefined,
      child: unionVector.data[0]
    } as any)
  );
}

function getBuilderEncoding(
  geometryKind: Exclude<WKTGeometryKind, 'GeometryCollection'>
): GeoArrowBuilderEncoding {
  return `geoarrow.${geometryKind.toLowerCase()}` as GeoArrowBuilderEncoding;
}

function getWKTUnionChildKey(child: WKTUnionChild): string {
  return `${child.kind}:${child.dimension}`;
}

function getWKTUnionTypeId(child: WKTUnionChild): number {
  const baseTypeId =
    child.kind === 'GeometryCollection' ? 7 : UNION_GEOMETRY_KINDS.indexOf(child.kind) + 1;
  switch (child.dimension) {
    case 'xy':
      return baseTypeId;
    case 'xyz':
      return baseTypeId + 10;
    case 'xym':
      return baseTypeId + 20;
    case 'xyzm':
      return baseTypeId + 30;
  }
}

function getWKTUnionFieldName(child: WKTUnionChild): string {
  switch (child.dimension) {
    case 'xy':
      return child.kind;
    case 'xyz':
      return `${child.kind} Z`;
    case 'xym':
      return `${child.kind} M`;
    case 'xyzm':
      return `${child.kind} ZM`;
  }
}

function getWKTUnionChild(
  geometryType: GeoParquetGeometryType,
  requestedDimension?: GeoArrowDimension
): WKTUnionChild | null {
  const dimension = requestedDimension || getWKTDimension(geometryType);
  const geometryKind = geometryType.replace(/ (?:ZM|Z|M)$/, '') as WKTGeometryKind;
  if (
    geometryKind !== 'GeometryCollection' &&
    !UNION_GEOMETRY_KINDS.includes(geometryKind as Exclude<WKTGeometryKind, 'GeometryCollection'>)
  ) {
    return null;
  }
  return {kind: geometryKind, dimension};
}

function getWKTDimension(geometryType: GeoParquetGeometryType): GeoArrowDimension {
  if (geometryType.endsWith(' ZM')) return 'xyzm';
  if (geometryType.endsWith(' Z')) return 'xyz';
  if (geometryType.endsWith(' M')) return 'xym';
  return 'xy';
}

function createWKTOffsets(
  offsets: readonly number[],
  offsetType: GeoArrowOffsetType
): Int32Array | BigInt64Array {
  return offsetType === 'int64'
    ? BigInt64Array.from(offsets, offset => BigInt(offset))
    : Int32Array.from(offsets);
}

function getGeometryKind(
  encoding: Exclude<GeoArrowBuilderEncoding, 'geoarrow.box'>
): WKTGeometryKind {
  const geometryKindByEncoding: Record<
    Exclude<GeoArrowBuilderEncoding, 'geoarrow.box'>,
    WKTGeometryKind
  > = {
    'geoarrow.point': 'Point',
    'geoarrow.linestring': 'LineString',
    'geoarrow.polygon': 'Polygon',
    'geoarrow.multipoint': 'MultiPoint',
    'geoarrow.multilinestring': 'MultiLineString',
    'geoarrow.multipolygon': 'MultiPolygon'
  };
  return geometryKindByEncoding[encoding];
}

function writeParsedGeometry(builder: GeoArrowBuilder, geometry: ParsedWKTGeometry): void {
  const coordinates = geometry.coordinates;
  switch (geometry.kind) {
    case 'Point':
      builder.beginPoint();
      writeCoordinate(builder, (coordinates as number[] | undefined) || []);
      return;
    case 'LineString':
      writeLineString(builder, (coordinates as number[][] | undefined) || []);
      return;
    case 'MultiPoint':
      writeMultiPoint(builder, (coordinates as number[][] | undefined) || []);
      return;
    case 'Polygon':
      writePolygon(builder, (coordinates as number[][][] | undefined) || []);
      return;
    case 'MultiLineString':
      writeMultiLineString(builder, (coordinates as number[][][] | undefined) || []);
      return;
    case 'MultiPolygon':
      writeMultiPolygon(builder, (coordinates as number[][][][] | undefined) || []);
      return;
    case 'GeometryCollection':
      throw new Error('GeometryCollection WKT requires the geometry union kernel.');
  }
}

function writeCoordinate(builder: GeoArrowBuilder, coordinate: number[]): void {
  builder.writeCoordinate(
    coordinate[0] ?? Number.NaN,
    coordinate[1] ?? Number.NaN,
    coordinate[2],
    coordinate[3]
  );
}

function writeLineString(builder: GeoArrowBuilder, coordinates: number[][]): void {
  builder.beginLineString(coordinates.length);
  for (const coordinate of coordinates) writeCoordinate(builder, coordinate);
}

function writeMultiPoint(builder: GeoArrowBuilder, coordinates: number[][]): void {
  builder.beginMultiPoint(coordinates.length);
  for (const coordinate of coordinates) {
    builder.beginPoint();
    writeCoordinate(builder, coordinate);
  }
}

function writePolygon(builder: GeoArrowBuilder, coordinates: number[][][]): void {
  builder.beginPolygon(coordinates.length);
  for (const ring of coordinates) {
    builder.beginLinearRing(ring.length);
    for (const coordinate of ring) writeCoordinate(builder, coordinate);
  }
}

function writeMultiLineString(builder: GeoArrowBuilder, coordinates: number[][][]): void {
  builder.beginMultiLineString(coordinates.length);
  for (const line of coordinates) writeLineString(builder, line);
}

function writeMultiPolygon(builder: GeoArrowBuilder, coordinates: number[][][][]): void {
  builder.beginMultiPolygon(coordinates.length);
  for (const polygon of coordinates) writePolygon(builder, polygon);
}

class WKTParser {
  private index = 0;
  private geometryCollectionDepth = 0;

  /** Creates a parser for one WKT value. */
  constructor(
    private readonly input: string,
    private readonly maxGeometryCollectionDepth: number
  ) {}

  /** Parses one WKT value, including an optional SRID prefix. */
  parse(): ParsedWKTGeometry | null {
    this.skipWhitespace();
    if (this.readLiteral('SRID')) {
      this.skipWhitespace();
      if (!this.readCharacter('=')) return null;
      if (this.readNumber() === null) return null;
      this.skipWhitespace();
      if (!this.readCharacter(';')) return null;
    }
    const geometry = this.parseGeometry();
    this.skipWhitespace();
    return geometry && this.index === this.input.length ? geometry : null;
  }

  private parseGeometry(): ParsedWKTGeometry | null {
    this.skipWhitespace();
    const kind = this.readGeometryKind();
    if (!kind) return null;
    this.skipWhitespace();
    const dimensionToken = this.readDimensionToken();
    this.skipWhitespace();
    if (this.readLiteral('EMPTY')) {
      return {kind, dimension: dimensionToken || 'xy', coordinates: getEmptyCoordinates(kind)};
    }
    if (!this.readCharacter('(')) return null;

    let coordinates: WKTCoordinates | null | undefined;
    let geometries: ParsedWKTGeometry[] | null | undefined;
    switch (kind) {
      case 'Point':
        coordinates = this.parseCoordinate();
        break;
      case 'LineString':
        coordinates = this.parseCoordinateList();
        break;
      case 'Polygon':
        coordinates = this.parseNestedCoordinates(1);
        break;
      case 'MultiPoint':
        coordinates = this.parseMultiPointCoordinates();
        break;
      case 'MultiLineString':
        coordinates = this.parseNestedCoordinates(1);
        break;
      case 'MultiPolygon':
        coordinates = this.parseNestedCoordinates(2);
        break;
      case 'GeometryCollection':
        this.geometryCollectionDepth++;
        if (this.geometryCollectionDepth > this.maxGeometryCollectionDepth) return null;
        geometries = this.parseGeometryList();
        this.geometryCollectionDepth--;
        break;
    }
    if (coordinates === null || (coordinates === undefined && geometries === undefined))
      return null;
    if (!this.readCharacter(')')) return null;

    const parsedCoordinates = coordinates || undefined;
    const parsedGeometries = geometries || undefined;
    const inferredDimension = dimensionToken || inferDimension(parsedCoordinates, parsedGeometries);
    if (
      kind !== 'GeometryCollection' &&
      !hasValidArity(parsedCoordinates, undefined, inferredDimension)
    ) {
      return null;
    }
    return {
      kind,
      dimension: inferredDimension,
      coordinates: parsedCoordinates,
      geometries: parsedGeometries
    };
  }

  private parseCoordinateList(): number[][] | null {
    const coordinates: number[][] = [];
    while (true) {
      const coordinate = this.parseCoordinate();
      if (!coordinate) return null;
      coordinates.push(coordinate);
      this.skipWhitespace();
      if (!this.readCharacter(',')) return coordinates;
    }
  }

  private parseNestedCoordinates(depth: number): WKTCoordinates | null {
    const values: WKTCoordinates[] = [];
    while (true) {
      if (!this.readCharacter('(')) return null;
      const value =
        depth === 1 ? this.parseCoordinateList() : this.parseNestedCoordinates(depth - 1);
      if (!value || !this.readCharacter(')')) return null;
      values.push(value);
      this.skipWhitespace();
      if (!this.readCharacter(',')) return values;
    }
  }

  private parseMultiPointCoordinates(): number[][] | null {
    this.skipWhitespace();
    if (this.peekCharacter('(')) {
      const coordinates: number[][] = [];
      while (true) {
        if (!this.readCharacter('(')) return null;
        const coordinate = this.parseCoordinate();
        if (!coordinate || !this.readCharacter(')')) return null;
        coordinates.push(coordinate);
        this.skipWhitespace();
        if (!this.readCharacter(',')) return coordinates;
      }
    }
    return this.parseCoordinateList();
  }

  private parseGeometryList(): ParsedWKTGeometry[] | null {
    const geometries: ParsedWKTGeometry[] = [];
    while (true) {
      const geometry = this.parseGeometry();
      if (!geometry) return null;
      geometries.push(geometry);
      this.skipWhitespace();
      if (!this.readCharacter(',')) return geometries;
    }
  }

  private parseCoordinate(): number[] | null {
    const coordinate: number[] = [];
    while (true) {
      this.skipWhitespace();
      const value = this.readNumber();
      if (value === null) break;
      coordinate.push(value);
    }
    return coordinate.length >= 2 ? coordinate : null;
  }

  private readGeometryKind(): WKTGeometryKind | null {
    const word = this.readWord()?.toUpperCase();
    const kind = GEOMETRY_KINDS.find(value => value.toUpperCase() === word);
    return kind || null;
  }

  private readDimensionToken(): GeoArrowDimension | null {
    const position = this.index;
    const word = this.readWord()?.toUpperCase();
    if (word === 'Z') return 'xyz';
    if (word === 'M') return 'xym';
    if (word === 'ZM') return 'xyzm';
    this.index = position;
    return null;
  }

  private readWord(): string | null {
    const match = this.input.slice(this.index).match(/^[A-Za-z]+/);
    if (!match) return null;
    this.index += match[0].length;
    return match[0];
  }

  private readNumber(): number | null {
    const match = this.input
      .slice(this.index)
      .match(/^[+-]?(?:(?:\d+\.\d*|\.\d+|\d+)(?:[eE][+-]?\d+)?)/);
    if (!match) return null;
    this.index += match[0].length;
    const value = Number(match[0]);
    return Number.isFinite(value) ? value : null;
  }

  private readLiteral(literal: string): boolean {
    const position = this.index;
    const word = this.readWord();
    if (word?.toUpperCase() === literal) return true;
    this.index = position;
    return false;
  }

  private readCharacter(character: string): boolean {
    if (this.input[this.index] !== character) return false;
    this.index++;
    this.skipWhitespace();
    return true;
  }

  private peekCharacter(character: string): boolean {
    return this.input[this.index] === character;
  }

  private skipWhitespace(): void {
    while (/\s/.test(this.input[this.index] || '')) this.index++;
  }
}

function parseWKT(input: string, maxGeometryCollectionDepth = 64): ParsedWKTGeometry | null {
  return new WKTParser(input, maxGeometryCollectionDepth).parse();
}

function getEmptyCoordinates(kind: WKTGeometryKind): WKTCoordinates {
  return kind === 'Point' ? [] : [];
}

function inferDimension(
  coordinates: WKTCoordinates | undefined,
  geometries: readonly ParsedWKTGeometry[] | undefined
): GeoArrowDimension {
  const coordinateSize = findCoordinateSize(coordinates);
  if (coordinateSize) return dimensionFromSize(coordinateSize);
  for (const geometry of geometries || []) return geometry.dimension;
  return 'xy';
}

function findCoordinateSize(coordinates: WKTCoordinates | undefined): number | null {
  if (!coordinates) return null;
  if (coordinates.length === 0) return null;
  if (isCoordinate(coordinates)) return coordinates.length;
  for (const value of coordinates) {
    const size = findCoordinateSize(value as WKTCoordinates);
    if (size) return size;
  }
  return null;
}

function dimensionFromSize(size: number): GeoArrowDimension {
  return size === 4 ? 'xyzm' : size === 3 ? 'xyz' : 'xy';
}

function hasValidArity(
  coordinates: WKTCoordinates | undefined,
  geometries: readonly ParsedWKTGeometry[] | undefined,
  dimension: GeoArrowDimension
): boolean {
  const expectedSize = dimension === 'xy' ? 2 : dimension === 'xyzm' ? 4 : 3;
  if (coordinates && !hasCoordinateArity(coordinates, expectedSize)) return false;
  return (geometries || []).every(
    geometry => geometry.dimension === dimension || geometry.kind === 'GeometryCollection'
  );
}

function hasCoordinateArity(value: WKTCoordinates, expectedSize: number): boolean {
  if (value.length === 0) return true;
  if (isCoordinate(value)) return value.length === expectedSize;
  return value.every(child => hasCoordinateArity(child, expectedSize));
}

function isCoordinate(value: WKTCoordinates): value is number[] {
  return typeof value[0] === 'number';
}
