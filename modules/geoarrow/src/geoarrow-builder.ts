// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';

/** GeoArrow nested geometry encodings supported by the incremental builder. */
export type GeoArrowBuilderEncoding =
  | 'geoarrow.point'
  | 'geoarrow.linestring'
  | 'geoarrow.polygon'
  | 'geoarrow.multipoint'
  | 'geoarrow.multilinestring'
  | 'geoarrow.multipolygon'
  | 'geoarrow.box';

/** Coordinate transform applied while writing coordinate values. */
export type GeoArrowCoordinateTransform = (coordinate: number[]) => number[];

/** Coordinate dimensions supported by the incremental builder. */
export type GeoArrowBuilderDimension = 'xy' | 'xyz' | 'xym' | 'xyzm';

/** Coordinate buffer containing one typed array per named ordinate. */
export type GeoArrowSeparatedCoordinateBuffers = {
  /** X ordinate values. */
  x: Float64Array;
  /** Y ordinate values. */
  y: Float64Array;
  /** Optional Z ordinate values. */
  z?: Float64Array;
  /** Optional M ordinate values. */
  m?: Float64Array;
};

/** Box buffers containing one typed array per canonical bound ordinate. */
export type GeoArrowSeparatedBoxBuffers = {
  /** Minimum x values. */
  xmin: Float64Array;
  /** Minimum y values. */
  ymin: Float64Array;
  /** Optional minimum z values. */
  zmin?: Float64Array;
  /** Optional minimum m values. */
  mmin?: Float64Array;
  /** Maximum x values. */
  xmax: Float64Array;
  /** Maximum y values. */
  ymax: Float64Array;
  /** Optional maximum z values. */
  zmax?: Float64Array;
  /** Optional maximum m values. */
  mmax?: Float64Array;
};

/** Coordinate buffers emitted by the builder. */
export type GeoArrowBuilderCoordinates =
  | Float64Array
  | GeoArrowSeparatedCoordinateBuffers
  | GeoArrowSeparatedBoxBuffers;

/** Offset buffers emitted by the builder. */
export type GeoArrowBuilderOffsets = Int32Array | BigInt64Array;

/** Builder target buffers supplied for write mode. */
export type GeoArrowBuilderTarget = {
  /** Validity bitmap for top-level geometry rows. */
  nullBitmap: Uint8Array;
  /** Coordinate values stored in the selected interleaved or separated layout. */
  coordinates: GeoArrowBuilderCoordinates;
  /** Top-level geometry offsets for variable-size encodings. */
  geometryOffsets?: GeoArrowBuilderOffsets;
  /** Part offsets for nested encodings. */
  partOffsets?: GeoArrowBuilderOffsets;
  /** Ring offsets for multipolygon encodings. */
  ringOffsets?: GeoArrowBuilderOffsets;
};

/** Measured or written GeoArrow geometry array buffers. */
export type GeoArrowGeometryArray = GeoArrowBuilderTarget & {
  /** Number of top-level geometry rows. */
  length: number;
  /** Number of null geometry rows. */
  nullCount: number;
  /** GeoArrow extension encoding. */
  encoding: GeoArrowBuilderEncoding;
  /** Coordinate tuple size. */
  coordinateSize: number;
  /** Semantic coordinate dimension. */
  dimension: GeoArrowBuilderDimension;
  /** Coordinate memory layout. */
  coordinateLayout: 'interleaved' | 'separated';
  /** Offset buffer width. */
  offsetType: 'int32' | 'int64';
};

/** Common options for all builder modes. */
export type GeoArrowBuilderBaseOptions = {
  /** GeoArrow geometry encoding to build. */
  encoding: GeoArrowBuilderEncoding;
  /** Exact coordinate dimension. Takes precedence over the legacy flags. */
  dimension?: GeoArrowBuilderDimension;
  /** Whether coordinate tuples include Z when `dimension` is omitted. */
  hasZ?: boolean;
  /** Whether coordinate tuples include M when `dimension` is omitted. */
  hasM?: boolean;
  /** Optional coordinate transform applied during write mode. */
  transform?: GeoArrowCoordinateTransform;
  /** Coordinate memory layout. Defaults to interleaved. */
  coordinateLayout?: 'interleaved' | 'separated';
  /** Offset buffer width. Defaults to int32. */
  offsetType?: 'int32' | 'int64';
};

/** Options for measuring a GeoArrow geometry array. */
export type GeoArrowBuilderMeasureOptions = GeoArrowBuilderBaseOptions & {
  /** Measure mode computes buffer sizes and offsets without allocating value buffers. */
  mode: 'measure';
};

/** Options for writing a GeoArrow geometry array. */
export type GeoArrowBuilderWriteOptions = GeoArrowBuilderBaseOptions & {
  /** Write mode fills caller-provided buffers. */
  mode: 'write';
  /** Target buffers to write into. */
  target: GeoArrowBuilderTarget;
};

/** Options for constructing a GeoArrow builder. */
export type GeoArrowBuilderOptions = GeoArrowBuilderMeasureOptions | GeoArrowBuilderWriteOptions;

/** Callback that emits one geometry, or null for one null geometry row. */
export type GeoArrowGeometryWriter = ((builder: GeoArrowBuilder) => void) | null | undefined;

type GeoArrowBuilderMode = 'measure' | 'write';
type GeoArrowOffsetName = 'geometryOffsets' | 'partOffsets' | 'ringOffsets';

type GeoArrowBuilderState = {
  mode: GeoArrowBuilderMode;
  encoding: GeoArrowBuilderEncoding;
  coordinateSize: number;
  coordinateLayout: 'interleaved' | 'separated';
  offsetType: 'int32' | 'int64';
  transform?: GeoArrowCoordinateTransform;
  length: number;
  nullCount: number;
  coordinateCount: number;
  geometryChildCount: number;
  partChildCount: number;
  geometryOffsetCount: number;
  partOffsetCount: number;
  ringOffsetCount: number;
  target?: GeoArrowBuilderTarget;
};

/**
 * Incremental two-pass writer for fixed-type GeoArrow geometry columns.
 *
 * The same geometry event sequence can be sent to a measure-mode builder and then
 * to a write-mode builder. Measure mode returns exact buffer sizes; write mode
 * fills caller-provided typed arrays directly.
 */
export class GeoArrowBuilder {
  /** GeoArrow extension encoding emitted by this builder. */
  readonly encoding: GeoArrowBuilderEncoding;
  /** Whether coordinate tuples include Z. */
  readonly hasZ: boolean;
  /** Whether coordinate tuples include M. */
  readonly hasM: boolean;
  /** Exact coordinate dimension emitted by this builder. */
  readonly dimension: GeoArrowBuilderDimension;
  private state: GeoArrowBuilderState;

  /** Creates a GeoArrow builder in measure or write mode. */
  constructor(options: GeoArrowBuilderOptions) {
    this.encoding = options.encoding;
    this.dimension =
      options.dimension ||
      (options.hasZ && options.hasM ? 'xyzm' : options.hasZ ? 'xyz' : options.hasM ? 'xym' : 'xy');
    this.hasZ = this.dimension === 'xyz' || this.dimension === 'xyzm';
    this.hasM = this.dimension === 'xym' || this.dimension === 'xyzm';
    const coordinateLayout = options.coordinateLayout || 'interleaved';
    const offsetType = options.offsetType || 'int32';
    this.state = {
      mode: options.mode,
      encoding: options.encoding,
      coordinateSize: getCoordinateSize(this.dimension),
      coordinateLayout,
      offsetType,
      transform: options.transform,
      length: 0,
      nullCount: 0,
      coordinateCount: 0,
      geometryChildCount: 0,
      partChildCount: 0,
      geometryOffsetCount: 1,
      partOffsetCount: 1,
      ringOffsetCount: 1,
      target: options.mode === 'write' ? options.target : undefined
    };
    this.initializeOffsets();
  }

  /** Emits one null geometry row. */
  writeNullGeometry(): void {
    this.state.length++;
    this.state.nullCount++;
    if (this.encoding !== 'geoarrow.point' && this.encoding !== 'geoarrow.box') {
      this.writeGeometryOffset();
    }
    if (this.encoding === 'geoarrow.point') this.state.coordinateCount++;
  }

  /** Begins one top-level geometry. */
  beginGeometry(_type?: string, _count?: number): void {
    this.setValid(this.state.length);
    this.state.length++;
  }

  /** Begins one point geometry or nested point. */
  beginPoint(): void {
    if (this.encoding === 'geoarrow.point') this.beginGeometry();
  }

  /** Begins one axis-aligned GeoArrow box row. */
  beginBox(): void {
    if (this.encoding !== 'geoarrow.box') {
      throw new Error(`Cannot write Box into ${this.encoding}`);
    }
    this.beginGeometry();
  }

  /** Writes one axis-aligned box in canonical minimum-then-maximum ordinate order. */
  writeBox(
    xmin: number,
    ymin: number,
    xmax: number,
    ymax: number,
    zmin?: number,
    zmax?: number,
    mmin?: number,
    mmax?: number
  ): void {
    if (this.encoding !== 'geoarrow.box') {
      throw new Error(`Cannot write Box into ${this.encoding}`);
    }
    const coordinateIndex = this.state.coordinateCount;
    const values = getBoxValues(this.dimension, xmin, ymin, xmax, ymax, zmin, zmax, mmin, mmax);
    if (this.state.mode === 'write') {
      this.writeBoxValues(this.getTarget().coordinates, coordinateIndex, values);
    }
    this.state.coordinateCount++;
  }

  /** Begins one line string geometry or nested line string. */
  beginLineString(pointCount: number): void {
    if (this.encoding === 'geoarrow.linestring') {
      this.beginGeometry();
      this.writeGeometryOffset(pointCount);
      return;
    }
    if (this.encoding === 'geoarrow.multilinestring') {
      this.writePartOffset(pointCount);
      return;
    }
    throw new Error(`Cannot write LineString into ${this.encoding}`);
  }

  /** Begins one polygon geometry or nested polygon. */
  beginPolygon(ringCount: number): void {
    if (this.encoding === 'geoarrow.polygon') {
      this.beginGeometry();
      this.writeGeometryOffset(ringCount);
      return;
    }
    if (this.encoding === 'geoarrow.multipolygon') {
      this.writePartOffset(ringCount);
      return;
    }
    throw new Error(`Cannot write Polygon into ${this.encoding}`);
  }

  /** Begins one polygon linear ring. */
  beginLinearRing(pointCount: number): void {
    if (this.encoding === 'geoarrow.polygon') {
      this.writePartOffset(pointCount);
      return;
    }
    if (this.encoding === 'geoarrow.multipolygon') {
      this.writeRingOffset(pointCount);
      return;
    }
    throw new Error(`Cannot write LinearRing into ${this.encoding}`);
  }

  /** Begins one multipoint geometry. */
  beginMultiPoint(pointCount: number): void {
    if (this.encoding !== 'geoarrow.multipoint') {
      throw new Error(`Cannot write MultiPoint into ${this.encoding}`);
    }
    this.beginGeometry();
    this.writeGeometryOffset(pointCount);
  }

  /** Begins one multilinestring geometry. */
  beginMultiLineString(lineCount: number): void {
    if (this.encoding !== 'geoarrow.multilinestring') {
      throw new Error(`Cannot write MultiLineString into ${this.encoding}`);
    }
    this.beginGeometry();
    this.writeGeometryOffset(lineCount);
  }

  /** Begins one multipolygon geometry. */
  beginMultiPolygon(polygonCount: number): void {
    if (this.encoding !== 'geoarrow.multipolygon') {
      throw new Error(`Cannot write MultiPolygon into ${this.encoding}`);
    }
    this.beginGeometry();
    this.writeGeometryOffset(polygonCount);
  }

  /** Writes one coordinate tuple. The third ordinate is M for an XYM builder. */
  writeCoordinate(x: number, y: number, z?: number, m?: number): void {
    const coordinateIndex = this.state.coordinateCount;
    if (this.state.mode === 'write') {
      const target = this.getTarget();
      const coordinate = this.getCoordinateValuesForWrite(x, y, z, m);
      const transformedCoordinate = this.state.transform
        ? this.state.transform(coordinate)
        : coordinate;
      this.writeCoordinateValues(
        target.coordinates,
        coordinateIndex,
        transformedCoordinate,
        coordinate
      );
    }
    this.state.coordinateCount++;
  }

  /** Completes the current geometry array and returns its row count. */
  finishGeometry(): number {
    return this.state.length;
  }

  /** Returns current measured or written array metadata. */
  getGeometryArray(): GeoArrowGeometryArray {
    return {
      encoding: this.encoding,
      coordinateSize: this.state.coordinateSize,
      dimension: this.dimension,
      coordinateLayout: this.state.coordinateLayout,
      offsetType: this.state.offsetType,
      length: this.state.length,
      nullCount: this.state.nullCount,
      nullBitmap: this.getNullBitmap(),
      coordinates: this.getCoordinateValues(),
      geometryOffsets: this.getGeometryOffsets(),
      partOffsets: this.getPartOffsets(),
      ringOffsets: this.getRingOffsets()
    };
  }

  /** Measures geometry callbacks and returns allocated offsets. */
  static measureGeometryArray(
    writers: GeoArrowGeometryWriter[],
    options: GeoArrowBuilderBaseOptions
  ): GeoArrowGeometryArray {
    const builder = new GeoArrowBuilder({mode: 'measure', ...options});
    for (const writer of writers) writer ? writer(builder) : builder.writeNullGeometry();
    builder.finishGeometry();
    return builder.getGeometryArray();
  }

  /** Writes geometry callbacks into a measured target. */
  static writeGeometryArray(
    writers: GeoArrowGeometryWriter[],
    measured: GeoArrowGeometryArray,
    options: GeoArrowBuilderBaseOptions
  ): GeoArrowGeometryArray {
    const builder = new GeoArrowBuilder({mode: 'write', target: measured, ...options});
    for (const writer of writers) writer ? writer(builder) : builder.writeNullGeometry();
    builder.finishGeometry();
    return builder.getGeometryArray();
  }

  /** Builds GeoArrow buffers from callbacks in two passes. */
  static buildGeometryArray(
    writers: GeoArrowGeometryWriter[],
    options: GeoArrowBuilderBaseOptions
  ): GeoArrowGeometryArray {
    const measured = GeoArrowBuilder.measureGeometryArray(writers, options);
    return GeoArrowBuilder.writeGeometryArray(writers, measured, options);
  }

  /** Wraps GeoArrow buffers in an Apache Arrow Data instance. */
  static makeGeometryData(geometryArray: GeoArrowGeometryArray): arrow.Data {
    if (geometryArray.encoding === 'geoarrow.box') {
      return withNulls(
        makeBoxData(geometryArray.coordinates, geometryArray.dimension),
        geometryArray
      );
    }
    const coordinateData = makeCoordinateData(
      geometryArray.coordinates,
      geometryArray.dimension,
      geometryArray.coordinateLayout
    );
    let data: arrow.Data = coordinateData;
    switch (geometryArray.encoding) {
      case 'geoarrow.point':
        return withNulls(data, geometryArray);
      case 'geoarrow.linestring':
      case 'geoarrow.multipoint':
        data = makeListData(
          coordinateData,
          geometryArray.geometryOffsets!,
          'vertices',
          geometryArray.offsetType
        );
        return withNulls(data, geometryArray);
      case 'geoarrow.polygon':
      case 'geoarrow.multilinestring':
        data = makeListData(
          coordinateData,
          geometryArray.partOffsets!,
          'vertices',
          geometryArray.offsetType
        );
        data = makeListData(
          data,
          geometryArray.geometryOffsets!,
          'rings',
          geometryArray.offsetType
        );
        return withNulls(data, geometryArray);
      case 'geoarrow.multipolygon':
        data = makeListData(
          coordinateData,
          geometryArray.ringOffsets!,
          'vertices',
          geometryArray.offsetType
        );
        data = makeListData(data, geometryArray.partOffsets!, 'rings', geometryArray.offsetType);
        data = makeListData(
          data,
          geometryArray.geometryOffsets!,
          'polygons',
          geometryArray.offsetType
        );
        return withNulls(data, geometryArray);
      default:
        throw new Error(`Unsupported GeoArrow encoding ${geometryArray.encoding}`);
    }
  }

  private initializeOffsets(): void {
    if (this.state.mode !== 'measure') return;
    const target: GeoArrowBuilderTarget = {
      nullBitmap: new Uint8Array(0),
      coordinates: makeCoordinateBuffers(0, this.dimension, this.state.coordinateLayout)
    };
    if (this.encoding !== 'geoarrow.point' && this.encoding !== 'geoarrow.box') {
      target.geometryOffsets = this.makeOffsets(1);
    }
    if (
      this.encoding === 'geoarrow.polygon' ||
      this.encoding === 'geoarrow.multilinestring' ||
      this.encoding === 'geoarrow.multipolygon'
    ) {
      target.partOffsets = this.makeOffsets(1);
    }
    if (this.encoding === 'geoarrow.multipolygon') target.ringOffsets = this.makeOffsets(1);
    this.state.target = target;
  }

  private getCoordinateValuesForWrite(x: number, y: number, z?: number, m?: number): number[] {
    if (this.dimension === 'xy') return [x, y];
    if (this.dimension === 'xyz') return [x, y, z ?? Number.NaN];
    if (this.dimension === 'xym') return [x, y, m ?? z ?? Number.NaN];
    return [x, y, z ?? Number.NaN, m ?? Number.NaN];
  }

  private writeGeometryOffset(childCount = 0): void {
    if (this.encoding === 'geoarrow.point') return;
    this.state.geometryChildCount += childCount;
    this.appendOffset('geometryOffsets', this.state.geometryChildCount);
  }

  private writePartOffset(childCount = 0): void {
    this.state.partChildCount += childCount;
    this.appendOffset('partOffsets', this.state.partChildCount);
  }

  private writeRingOffset(childCount = 0): void {
    this.appendOffset('ringOffsets', this.state.coordinateCount + childCount);
  }

  private appendOffset(name: GeoArrowOffsetName, value: number): void {
    const target = this.getTarget();
    const offsets = target[name];
    if (!offsets) return;
    if (this.state.mode === 'measure') {
      this.incrementOffsetCount(name);
      return;
    }
    const index = this.getOffsetCount(name);
    if (index >= offsets.length) throw new Error(`GeoArrowBuilder target ${name} overflow`);
    offsets[index] = offsets instanceof BigInt64Array ? BigInt(value) : value;
    this.incrementOffsetCount(name);
  }

  private getOffsetCount(name: GeoArrowOffsetName): number {
    switch (name) {
      case 'geometryOffsets':
        return this.state.geometryOffsetCount;
      case 'partOffsets':
        return this.state.partOffsetCount;
      case 'ringOffsets':
        return this.state.ringOffsetCount;
      default:
        throw new Error(`Unexpected offset buffer ${name}`);
    }
  }

  private incrementOffsetCount(name: GeoArrowOffsetName): void {
    switch (name) {
      case 'geometryOffsets':
        this.state.geometryOffsetCount++;
        return;
      case 'partOffsets':
        this.state.partOffsetCount++;
        return;
      case 'ringOffsets':
        this.state.ringOffsetCount++;
        return;
      default:
        throw new Error(`Unexpected offset buffer ${name}`);
    }
  }

  private setValid(rowIndex: number): void {
    if (this.state.mode !== 'write') return;
    const bitmap = this.getTarget().nullBitmap;
    bitmap[rowIndex >> 3] |= 1 << (rowIndex & 7);
  }

  private getTarget(): GeoArrowBuilderTarget {
    if (!this.state.target) throw new Error('GeoArrowBuilder target is not initialized');
    return this.state.target;
  }

  private getNullBitmap(): Uint8Array {
    return this.state.mode === 'measure'
      ? new Uint8Array(Math.ceil(this.state.length / 8))
      : this.getTarget().nullBitmap;
  }

  private getCoordinateValues(): GeoArrowBuilderCoordinates {
    return this.state.mode === 'measure'
      ? this.encoding === 'geoarrow.box'
        ? makeBoxBuffers(this.state.coordinateCount, this.dimension, this.state.coordinateLayout)
        : makeCoordinateBuffers(
            this.state.coordinateCount,
            this.dimension,
            this.state.coordinateLayout
          )
      : this.getTarget().coordinates;
  }

  private getGeometryOffsets(): GeoArrowBuilderOffsets | undefined {
    return this.state.mode === 'measure' &&
      this.encoding !== 'geoarrow.point' &&
      this.encoding !== 'geoarrow.box'
      ? this.makeOffsets(this.state.geometryOffsetCount)
      : this.getTarget().geometryOffsets;
  }

  private getPartOffsets(): GeoArrowBuilderOffsets | undefined {
    return this.state.mode === 'measure' &&
      (this.encoding === 'geoarrow.polygon' ||
        this.encoding === 'geoarrow.multilinestring' ||
        this.encoding === 'geoarrow.multipolygon')
      ? this.makeOffsets(this.state.partOffsetCount)
      : this.getTarget().partOffsets;
  }

  private getRingOffsets(): GeoArrowBuilderOffsets | undefined {
    return this.state.mode === 'measure' && this.encoding === 'geoarrow.multipolygon'
      ? this.makeOffsets(this.state.ringOffsetCount)
      : this.getTarget().ringOffsets;
  }

  private makeOffsets(length: number): GeoArrowBuilderOffsets {
    return this.state.offsetType === 'int64' ? new BigInt64Array(length) : new Int32Array(length);
  }

  private writeCoordinateValues(
    coordinates: GeoArrowBuilderCoordinates,
    coordinateIndex: number,
    transformedCoordinate: number[],
    originalCoordinate: number[]
  ): void {
    if (coordinates instanceof Float64Array) {
      if (coordinateIndex >= coordinates.length / this.state.coordinateSize) {
        throw new Error('GeoArrowBuilder target coordinate buffer overflow');
      }
      const valueOffset = coordinateIndex * this.state.coordinateSize;
      for (let dimensionIndex = 0; dimensionIndex < this.state.coordinateSize; dimensionIndex++) {
        coordinates[valueOffset + dimensionIndex] =
          transformedCoordinate[dimensionIndex] ?? originalCoordinate[dimensionIndex] ?? Number.NaN;
      }
      return;
    }

    const coordinateNames = getCoordinateNames(this.dimension);
    for (let dimensionIndex = 0; dimensionIndex < coordinateNames.length; dimensionIndex++) {
      const coordinateValues = coordinates[coordinateNames[dimensionIndex]];
      if (!coordinateValues || coordinateIndex >= coordinateValues.length) {
        throw new Error('GeoArrowBuilder target coordinate buffer overflow');
      }
      coordinateValues[coordinateIndex] =
        transformedCoordinate[dimensionIndex] ?? originalCoordinate[dimensionIndex] ?? Number.NaN;
    }
  }

  private writeBoxValues(
    coordinates: GeoArrowBuilderCoordinates,
    coordinateIndex: number,
    values: number[]
  ): void {
    if (coordinates instanceof Float64Array) {
      const valueOffset = coordinateIndex * values.length;
      if (valueOffset + values.length > coordinates.length) {
        throw new Error('GeoArrowBuilder target box buffer overflow');
      }
      coordinates.set(values, valueOffset);
      return;
    }

    const boxCoordinates = coordinates as GeoArrowSeparatedBoxBuffers;
    const names = getBoxFieldNames(this.dimension);
    for (let index = 0; index < names.length; index++) {
      const valuesBuffer = boxCoordinates[names[index] as keyof GeoArrowSeparatedBoxBuffers];
      if (!(valuesBuffer instanceof Float64Array) || coordinateIndex >= valuesBuffer.length) {
        throw new Error('GeoArrowBuilder target box buffer overflow');
      }
      valuesBuffer[coordinateIndex] = values[index];
    }
  }
}

function makePrimitiveData(values: Float64Array): arrow.Data {
  return arrow.makeData({type: new arrow.Float64(), data: values} as any);
}

/** Returns the canonical child names for one GeoArrow box dimension. */
function getBoxFieldNames(dimension: GeoArrowBuilderDimension): string[] {
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

/** Returns the number of ordinates in one coordinate tuple. */
function getCoordinateSize(dimension: GeoArrowBuilderDimension): 2 | 3 | 4 {
  return dimension === 'xy' ? 2 : dimension === 'xyzm' ? 4 : 3;
}

function makeCoordinateData(
  values: GeoArrowBuilderCoordinates,
  dimension: GeoArrowBuilderDimension,
  coordinateLayout: 'interleaved' | 'separated'
): arrow.Data {
  if (coordinateLayout === 'separated') {
    const coordinateBuffers = values as GeoArrowSeparatedCoordinateBuffers;
    const coordinateNames = getCoordinateNames(dimension);
    return arrow.makeData({
      type: new arrow.Struct(
        coordinateNames.map(name => new arrow.Field(name, new arrow.Float64(), false))
      ),
      children: coordinateNames.map(name => makePrimitiveData(coordinateBuffers[name]!))
    } as any);
  }
  return arrow.makeData({
    type: new arrow.FixedSizeList(
      getCoordinateSize(dimension),
      new arrow.Field('xy', new arrow.Float64(), false)
    ),
    child: makePrimitiveData(values as Float64Array)
  } as any);
}

/** Creates Arrow struct data from interleaved or separated box buffers. */
function makeBoxData(
  values: GeoArrowBuilderCoordinates,
  dimension: GeoArrowBuilderDimension
): arrow.Data {
  const names = getBoxFieldNames(dimension);
  const children = names.map((name, index) => {
    if (values instanceof Float64Array) {
      const boxSize = names.length;
      return makePrimitiveData(
        Float64Array.from(
          {length: values.length / boxSize},
          (_, rowIndex) => values[rowIndex * boxSize + index]
        )
      );
    }
    return makePrimitiveData((values as GeoArrowSeparatedBoxBuffers)[name]!);
  });
  return arrow.makeData({
    type: new arrow.Struct(names.map(name => new arrow.Field(name, new arrow.Float64(), false))),
    children
  } as any);
}

function makeListData(
  child: arrow.Data,
  offsets: GeoArrowBuilderOffsets,
  fieldName: string,
  offsetType: 'int32' | 'int64'
): arrow.Data {
  return arrow.makeData({
    type:
      offsetType === 'int64'
        ? new arrow.LargeList(new arrow.Field(fieldName, child.type, false))
        : new arrow.List(new arrow.Field(fieldName, child.type, false)),
    valueOffsets: offsets,
    child
  } as any);
}

function makeCoordinateBuffers(
  coordinateCount: number,
  dimension: GeoArrowBuilderDimension,
  coordinateLayout: 'interleaved' | 'separated'
): GeoArrowBuilderCoordinates {
  if (coordinateLayout === 'interleaved') {
    return new Float64Array(coordinateCount * getCoordinateSize(dimension));
  }
  const coordinateNames = getCoordinateNames(dimension);
  const buffers: GeoArrowSeparatedCoordinateBuffers = {
    x: new Float64Array(coordinateCount),
    y: new Float64Array(coordinateCount)
  };
  for (const name of coordinateNames.slice(2)) buffers[name] = new Float64Array(coordinateCount);
  return buffers;
}

/** Allocates box buffers in the requested layout. */
function makeBoxBuffers(
  boxCount: number,
  dimension: GeoArrowBuilderDimension,
  coordinateLayout: 'interleaved' | 'separated'
): GeoArrowBuilderCoordinates {
  const names = getBoxFieldNames(dimension);
  if (coordinateLayout === 'interleaved') {
    return new Float64Array(boxCount * names.length);
  }
  const buffers = {} as GeoArrowSeparatedBoxBuffers;
  for (const name of names) {
    (buffers as Record<string, Float64Array>)[name] = new Float64Array(boxCount);
  }
  return buffers;
}

/** Packs box bounds in canonical minimum-then-maximum order. */
function getBoxValues(
  dimension: GeoArrowBuilderDimension,
  xmin: number,
  ymin: number,
  xmax: number,
  ymax: number,
  zmin?: number,
  zmax?: number,
  mmin?: number,
  mmax?: number
): number[] {
  switch (dimension) {
    case 'xy':
      return [xmin, ymin, xmax, ymax];
    case 'xyz':
      return [xmin, ymin, zmin ?? Number.NaN, xmax, ymax, zmax ?? Number.NaN];
    case 'xym':
      return [xmin, ymin, mmin ?? Number.NaN, xmax, ymax, mmax ?? Number.NaN];
    case 'xyzm':
      return [
        xmin,
        ymin,
        zmin ?? Number.NaN,
        mmin ?? Number.NaN,
        xmax,
        ymax,
        zmax ?? Number.NaN,
        mmax ?? Number.NaN
      ];
  }
}

function getCoordinateNames(
  dimension: GeoArrowBuilderDimension
): readonly ('x' | 'y' | 'z' | 'm')[] {
  switch (dimension) {
    case 'xy':
      return ['x', 'y'];
    case 'xyz':
      return ['x', 'y', 'z'];
    case 'xym':
      return ['x', 'y', 'm'];
    case 'xyzm':
      return ['x', 'y', 'z', 'm'];
  }
}

function withNulls(data: arrow.Data, geometryArray: GeoArrowGeometryArray): arrow.Data {
  return new arrow.Data(
    data.type,
    0,
    geometryArray.length,
    geometryArray.nullCount,
    [
      data.valueOffsets,
      data.values,
      geometryArray.nullCount > 0 ? geometryArray.nullBitmap : undefined
    ],
    data.children
  );
}
