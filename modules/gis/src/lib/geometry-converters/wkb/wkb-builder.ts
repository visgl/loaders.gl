// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {WKBGeometryType} from './helpers/wkb-types';

const LITTLE_ENDIAN = true;

/** Function that writes one WKB geometry into a builder. */
export type WKBGeometryWriter = (builder: WKBBuilder) => void;

/** Geometry type names accepted by the generic WKB builder. */
export type WKBGeometryTypeName =
  | 'Point'
  | 'LineString'
  | 'Polygon'
  | 'MultiPoint'
  | 'MultiLineString'
  | 'MultiPolygon'
  | 'GeometryCollection';

/** Transforms one XY coordinate before it is written. */
export type WKBCoordinateTransform = (coordinate: number[]) => number[];

/** Options shared by WKB measuring and writing modes. */
export type WKBBuilderBaseOptions = {
  /** Writes Z ordinates. */
  hasZ?: boolean;
  /** Writes M ordinates. */
  hasM?: boolean;
  /** Optional XY transform applied as coordinates are written. */
  transform?: WKBCoordinateTransform;
};

/** Options for a WKB builder that only measures byte length. */
export type WKBBuilderMeasureOptions = WKBBuilderBaseOptions & {
  /** Selects byte-counting mode. */
  mode: 'measure';
};

/** Options for a WKB builder that writes into caller-owned storage. */
export type WKBBuilderWriteOptions = WKBBuilderBaseOptions & {
  /** Selects direct writing mode. */
  mode: 'write';
  /** Target storage that receives WKB bytes. */
  target: ArrayBuffer | ArrayBufferView | DataView;
  /** Starting byte offset in the target storage. */
  byteOffset?: number;
};

/** Constructor options for the incremental WKB builder. */
export type WKBBuilderOptions = WKBBuilderMeasureOptions | WKBBuilderWriteOptions;

/** Contiguous Arrow-style WKB geometry array buffers. */
export type WKBGeometryArray = {
  /** Offsets into `values`, one more than geometry count. */
  valueOffsets: Int32Array;
  /** Contiguous WKB bytes for all non-null geometries. */
  values: Uint8Array;
  /** Arrow validity bitmap, omitted when there are no null geometries. */
  nullBitmap?: Uint8Array;
  /** Number of null geometry entries. */
  nullCount: number;
};

/**
 * Incremental WKB writer that can run the same geometry calls in measure or write mode.
 */
export class WKBBuilder {
  readonly mode: 'measure' | 'write';
  readonly hasZ: boolean;
  readonly hasM: boolean;
  readonly transform?: WKBCoordinateTransform;

  private dataView: DataView | null;
  private startByteOffset: number;
  private endByteOffset: number;
  private byteOffset: number;

  constructor(options: WKBBuilderOptions) {
    this.mode = options.mode;
    this.hasZ = Boolean(options.hasZ);
    this.hasM = Boolean(options.hasM);
    this.transform = options.transform;
    const targetInfo =
      options.mode === 'write'
        ? makeDataView(options.target, options.byteOffset || 0)
        : {dataView: null, byteOffset: 0, endByteOffset: 0};
    this.startByteOffset = targetInfo.byteOffset;
    this.endByteOffset = targetInfo.endByteOffset;
    this.byteOffset = this.startByteOffset;
    this.dataView = targetInfo.dataView;
  }

  /** Begins a geometry by type, optionally writing its count field. */
  beginGeometry(type: WKBGeometryType | WKBGeometryTypeName, count?: number): void {
    switch (getWKBGeometryType(type)) {
      case WKBGeometryType.Point:
        this.beginPoint();
        break;
      case WKBGeometryType.LineString:
        this.beginLineString(count || 0);
        break;
      case WKBGeometryType.Polygon:
        this.beginPolygon(count || 0);
        break;
      case WKBGeometryType.MultiPoint:
        this.beginMultiPoint(count || 0);
        break;
      case WKBGeometryType.MultiLineString:
        this.beginMultiLineString(count || 0);
        break;
      case WKBGeometryType.MultiPolygon:
        this.beginMultiPolygon(count || 0);
        break;
      case WKBGeometryType.GeometryCollection:
        this.writeHeader(WKBGeometryType.GeometryCollection);
        this.writeUInt32(count || 0);
        break;
      default:
        throw new Error(`Unsupported WKB geometry type: ${type}`);
    }
  }

  /** Begins a point geometry. */
  beginPoint(): void {
    this.writeHeader(WKBGeometryType.Point);
  }

  /** Begins a linestring geometry. */
  beginLineString(pointCount: number): void {
    this.writeHeader(WKBGeometryType.LineString);
    this.writeUInt32(pointCount);
  }

  /** Begins a polygon geometry. */
  beginPolygon(ringCount: number): void {
    this.writeHeader(WKBGeometryType.Polygon);
    this.writeUInt32(ringCount);
  }

  /** Begins one linear ring inside a polygon. */
  beginLinearRing(pointCount: number): void {
    this.writeUInt32(pointCount);
  }

  /** Begins a multipoint geometry. */
  beginMultiPoint(pointCount: number): void {
    this.writeHeader(WKBGeometryType.MultiPoint);
    this.writeUInt32(pointCount);
  }

  /** Begins a multilinestring geometry. */
  beginMultiLineString(lineCount: number): void {
    this.writeHeader(WKBGeometryType.MultiLineString);
    this.writeUInt32(lineCount);
  }

  /** Begins a multipolygon geometry. */
  beginMultiPolygon(polygonCount: number): void {
    this.writeHeader(WKBGeometryType.MultiPolygon);
    this.writeUInt32(polygonCount);
  }

  /** Writes one coordinate using the builder's dimensional options. */
  writeCoordinate(x: number, y: number, z?: number, m?: number): void {
    if (this.transform) {
      const transformedCoordinate = this.transform([x, y]);
      x = transformedCoordinate[0];
      y = transformedCoordinate[1];
    }

    this.writeFloat64(x);
    this.writeFloat64(y);
    if (this.hasZ) {
      this.writeFloat64(z ?? NaN);
    }
    if (this.hasM) {
      this.writeFloat64(m ?? NaN);
    }
  }

  /** Finishes the current geometry and returns its byte length. */
  finishGeometry(): number {
    return this.getByteLength();
  }

  /** Returns the number of bytes measured or written by this builder. */
  getByteLength(): number {
    return this.byteOffset - this.startByteOffset;
  }

  /** Measures geometry writer callbacks and returns Arrow Binary offsets. */
  static measureGeometryArray(
    geometryWriters: (WKBGeometryWriter | null)[],
    options: WKBBuilderBaseOptions = {}
  ): Int32Array {
    const valueOffsets = new Int32Array(geometryWriters.length + 1);
    for (let geometryIndex = 0; geometryIndex < geometryWriters.length; geometryIndex++) {
      const geometryWriter = geometryWriters[geometryIndex];
      if (geometryWriter) {
        const builder = new WKBBuilder({mode: 'measure', ...options});
        geometryWriter(builder);
        valueOffsets[geometryIndex + 1] = valueOffsets[geometryIndex] + builder.finishGeometry();
      } else {
        valueOffsets[geometryIndex + 1] = valueOffsets[geometryIndex];
      }
    }
    return valueOffsets;
  }

  /** Writes geometry writer callbacks into an existing contiguous values buffer. */
  static writeGeometryArray(
    geometryWriters: (WKBGeometryWriter | null)[],
    valueOffsets: Int32Array,
    values: Uint8Array,
    options: WKBBuilderBaseOptions = {}
  ): Uint8Array {
    for (let geometryIndex = 0; geometryIndex < geometryWriters.length; geometryIndex++) {
      const geometryWriter = geometryWriters[geometryIndex];
      if (!geometryWriter) {
        continue;
      }
      const builder = new WKBBuilder({
        mode: 'write',
        target: values,
        byteOffset: valueOffsets[geometryIndex],
        ...options
      });
      geometryWriter(builder);
      builder.finishGeometry();
    }
    return values;
  }

  /** Builds Arrow-style offsets, values and validity buffers from geometry writer callbacks. */
  static buildGeometryArray(
    geometryWriters: (WKBGeometryWriter | null)[],
    options: WKBBuilderBaseOptions = {}
  ): WKBGeometryArray {
    const valueOffsets = WKBBuilder.measureGeometryArray(geometryWriters, options);
    const values = new Uint8Array(valueOffsets[valueOffsets.length - 1]);
    WKBBuilder.writeGeometryArray(geometryWriters, valueOffsets, values, options);

    const nullBitmap = makeNullBitmap(geometryWriters);
    return {
      valueOffsets,
      values,
      nullBitmap: nullBitmap.nullCount > 0 ? nullBitmap.nullBitmap : undefined,
      nullCount: nullBitmap.nullCount
    };
  }

  private writeHeader(geometryType: WKBGeometryType): void {
    this.writeUInt8(1);
    this.writeUInt32(getWKBTypeCode(geometryType, this.hasZ, this.hasM));
  }

  private writeUInt8(value: number): void {
    this.ensureSize(1);
    this.dataView?.setUint8(this.byteOffset, value);
    this.byteOffset += 1;
  }

  private writeUInt32(value: number): void {
    this.ensureSize(4);
    this.dataView?.setUint32(this.byteOffset, value, LITTLE_ENDIAN);
    this.byteOffset += 4;
  }

  private writeFloat64(value: number): void {
    this.ensureSize(8);
    this.dataView?.setFloat64(this.byteOffset, value, LITTLE_ENDIAN);
    this.byteOffset += 8;
  }

  private ensureSize(byteLength: number): void {
    if (this.dataView && this.byteOffset + byteLength > this.endByteOffset) {
      throw new Error('WKBBuilder overflow');
    }
  }
}

function makeDataView(
  target: ArrayBuffer | ArrayBufferView | DataView,
  byteOffset: number
): {
  dataView: DataView | null;
  byteOffset: number;
  endByteOffset: number;
} {
  if (target instanceof DataView) {
    return {
      dataView: new DataView(target.buffer),
      byteOffset: target.byteOffset + byteOffset,
      endByteOffset: target.byteOffset + target.byteLength
    };
  }
  if (ArrayBuffer.isView(target)) {
    return {
      dataView: new DataView(target.buffer),
      byteOffset: target.byteOffset + byteOffset,
      endByteOffset: target.byteOffset + target.byteLength
    };
  }
  return {dataView: new DataView(target), byteOffset, endByteOffset: target.byteLength};
}

function getWKBTypeCode(geometryType: WKBGeometryType, hasZ: boolean, hasM: boolean): number {
  let dimensionType = 0;
  if (hasZ && hasM) {
    dimensionType = 3000;
  } else if (hasZ) {
    dimensionType = 1000;
  } else if (hasM) {
    dimensionType = 2000;
  }
  return dimensionType + geometryType;
}

function getWKBGeometryType(type: WKBGeometryType | WKBGeometryTypeName): WKBGeometryType {
  if (typeof type === 'number') {
    return type;
  }
  return WKBGeometryType[type];
}

function makeNullBitmap(geometryWriters: (WKBGeometryWriter | null)[]): {
  nullBitmap: Uint8Array;
  nullCount: number;
} {
  const nullBitmap = new Uint8Array(Math.ceil(geometryWriters.length / 8));
  let nullCount = 0;
  for (let geometryIndex = 0; geometryIndex < geometryWriters.length; geometryIndex++) {
    if (geometryWriters[geometryIndex]) {
      nullBitmap[geometryIndex >> 3] |= 1 << (geometryIndex & 7);
    } else {
      nullCount++;
    }
  }
  return {nullBitmap, nullCount};
}
