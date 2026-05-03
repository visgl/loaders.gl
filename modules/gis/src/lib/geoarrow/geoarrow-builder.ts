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
  | 'geoarrow.multipolygon';

/** Coordinate transform applied while writing coordinate values. */
export type GeoArrowCoordinateTransform = (coordinate: number[]) => number[];

/** Builder target buffers supplied for write mode. */
export type GeoArrowBuilderTarget = {
  /** Validity bitmap for top-level geometry rows. */
  nullBitmap: Uint8Array;
  /** Coordinate values stored as interleaved x/y(/z). */
  coordinates: Float64Array;
  /** Top-level geometry offsets for variable-size encodings. */
  geometryOffsets?: Int32Array;
  /** Part offsets for nested encodings. */
  partOffsets?: Int32Array;
  /** Ring offsets for multipolygon encodings. */
  ringOffsets?: Int32Array;
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
};

/** Common options for all builder modes. */
export type GeoArrowBuilderBaseOptions = {
  /** GeoArrow geometry encoding to build. */
  encoding: GeoArrowBuilderEncoding;
  /** Whether coordinate tuples include Z. */
  hasZ?: boolean;
  /** Optional coordinate transform applied during write mode. */
  transform?: GeoArrowCoordinateTransform;
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

type GeoArrowBuilderState = {
  mode: GeoArrowBuilderMode;
  encoding: GeoArrowBuilderEncoding;
  coordinateSize: number;
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
  private state: GeoArrowBuilderState;

  /** Creates a GeoArrow builder in measure or write mode. */
  constructor(options: GeoArrowBuilderOptions) {
    this.encoding = options.encoding;
    this.hasZ = Boolean(options.hasZ);
    this.state = {
      mode: options.mode,
      encoding: options.encoding,
      coordinateSize: this.hasZ ? 3 : 2,
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
    this.writeGeometryOffset();
    if (this.encoding === 'geoarrow.point') {
      this.state.coordinateCount++;
    }
  }

  /** Begins one top-level geometry. */
  beginGeometry(_type?: string, _count?: number): void {
    this.setValid(this.state.length);
    this.state.length++;
  }

  /** Begins one point geometry or nested point. */
  beginPoint(): void {
    if (this.encoding === 'geoarrow.point') {
      this.beginGeometry();
    }
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

  /** Writes one coordinate tuple. */
  writeCoordinate(x: number, y: number, z?: number): void {
    const coordinateIndex = this.state.coordinateCount;
    if (this.state.mode === 'write') {
      const target = this.getTarget();
      if (coordinateIndex >= target.coordinates.length / this.state.coordinateSize) {
        throw new Error('GeoArrowBuilder target coordinate buffer overflow');
      }
      const valueOffset = coordinateIndex * this.state.coordinateSize;
      if (this.state.transform) {
        const coordinate = this.state.transform([x, y, z ?? 0]);
        target.coordinates[valueOffset] = coordinate[0] ?? x;
        target.coordinates[valueOffset + 1] = coordinate[1] ?? y;
        if (this.hasZ) {
          target.coordinates[valueOffset + 2] = coordinate[2] ?? z ?? Number.NaN;
        }
        this.state.coordinateCount++;
        return;
      }
      target.coordinates[valueOffset] = x;
      target.coordinates[valueOffset + 1] = y;
      if (this.hasZ) {
        target.coordinates[valueOffset + 2] = z ?? Number.NaN;
      }
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
    for (const writer of writers) {
      if (writer) {
        writer(builder);
      } else {
        builder.writeNullGeometry();
      }
    }
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
    for (const writer of writers) {
      if (writer) {
        writer(builder);
      } else {
        builder.writeNullGeometry();
      }
    }
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
    const coordinateData = makeCoordinateData(
      geometryArray.coordinates,
      geometryArray.coordinateSize
    );
    let data: arrow.Data = coordinateData;

    switch (geometryArray.encoding) {
      case 'geoarrow.point':
        return withNulls(data, geometryArray);
      case 'geoarrow.linestring':
      case 'geoarrow.multipoint':
        data = makeListData(coordinateData, geometryArray.geometryOffsets!, 'vertices');
        return withNulls(data, geometryArray);
      case 'geoarrow.polygon':
      case 'geoarrow.multilinestring':
        data = makeListData(coordinateData, geometryArray.partOffsets!, 'vertices');
        data = makeListData(data, geometryArray.geometryOffsets!, 'rings');
        return withNulls(data, geometryArray);
      case 'geoarrow.multipolygon':
        data = makeListData(coordinateData, geometryArray.ringOffsets!, 'vertices');
        data = makeListData(data, geometryArray.partOffsets!, 'rings');
        data = makeListData(data, geometryArray.geometryOffsets!, 'polygons');
        return withNulls(data, geometryArray);
      default:
        throw new Error(`Unsupported GeoArrow encoding ${geometryArray.encoding}`);
    }
  }

  private initializeOffsets(): void {
    if (this.state.mode !== 'measure') {
      return;
    }
    const target: GeoArrowBuilderTarget = {
      nullBitmap: new Uint8Array(0),
      coordinates: new Float64Array(0)
    };
    if (this.encoding !== 'geoarrow.point') {
      target.geometryOffsets = new Int32Array([0]);
    }
    if (
      this.encoding === 'geoarrow.polygon' ||
      this.encoding === 'geoarrow.multilinestring' ||
      this.encoding === 'geoarrow.multipolygon'
    ) {
      target.partOffsets = new Int32Array([0]);
    }
    if (this.encoding === 'geoarrow.multipolygon') {
      target.ringOffsets = new Int32Array([0]);
    }
    this.state.target = target;
  }

  private writeGeometryOffset(childCount = 0): void {
    if (this.encoding === 'geoarrow.point') {
      return;
    }
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

  private appendOffset(name: 'geometryOffsets' | 'partOffsets' | 'ringOffsets', value: number) {
    const target = this.getTarget();
    const offsets = target[name];
    if (!offsets) {
      return;
    }
    if (this.state.mode === 'measure') {
      this.incrementOffsetCount(name);
      return;
    }
    const index = this.getOffsetCount(name);
    if (index >= offsets.length) {
      throw new Error(`GeoArrowBuilder target ${name} overflow`);
    }
    offsets[index] = value;
    this.incrementOffsetCount(name);
  }

  private getOffsetCount(name: 'geometryOffsets' | 'partOffsets' | 'ringOffsets'): number {
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

  private incrementOffsetCount(name: 'geometryOffsets' | 'partOffsets' | 'ringOffsets'): void {
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
    if (this.state.mode !== 'write') {
      return;
    }
    const bitmap = this.getTarget().nullBitmap;
    bitmap[rowIndex >> 3] |= 1 << (rowIndex & 7);
  }

  private getTarget(): GeoArrowBuilderTarget {
    if (!this.state.target) {
      throw new Error('GeoArrowBuilder target is not initialized');
    }
    return this.state.target;
  }

  private getNullBitmap(): Uint8Array {
    if (this.state.mode === 'measure') {
      return new Uint8Array(Math.ceil(this.state.length / 8));
    }
    return this.getTarget().nullBitmap;
  }

  private getCoordinateValues(): Float64Array {
    if (this.state.mode === 'measure') {
      return new Float64Array(this.state.coordinateCount * this.state.coordinateSize);
    }
    return this.getTarget().coordinates;
  }

  private getGeometryOffsets(): Int32Array | undefined {
    if (this.state.mode === 'measure' && this.encoding !== 'geoarrow.point') {
      return new Int32Array(this.state.geometryOffsetCount);
    }
    return this.getTarget().geometryOffsets;
  }

  private getPartOffsets(): Int32Array | undefined {
    if (
      this.state.mode === 'measure' &&
      (this.encoding === 'geoarrow.polygon' ||
        this.encoding === 'geoarrow.multilinestring' ||
        this.encoding === 'geoarrow.multipolygon')
    ) {
      return new Int32Array(this.state.partOffsetCount);
    }
    return this.getTarget().partOffsets;
  }

  private getRingOffsets(): Int32Array | undefined {
    if (this.state.mode === 'measure' && this.encoding === 'geoarrow.multipolygon') {
      return new Int32Array(this.state.ringOffsetCount);
    }
    return this.getTarget().ringOffsets;
  }
}

function makePrimitiveData(values: Float64Array): arrow.Data {
  return arrow.makeData({type: new arrow.Float64(), data: values} as any);
}

function makeCoordinateData(values: Float64Array, coordinateSize: number): arrow.Data {
  return arrow.makeData({
    type: new arrow.FixedSizeList(
      coordinateSize,
      new arrow.Field('xy', new arrow.Float64(), false)
    ),
    child: makePrimitiveData(values)
  } as any);
}

function makeListData(child: arrow.Data, offsets: Int32Array, fieldName: string): arrow.Data {
  return arrow.makeData({
    type: new arrow.List(new arrow.Field(fieldName, child.type, false)),
    valueOffsets: offsets,
    child
  } as any);
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
