// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {WKBBuilder as MathWKBBuilder} from '@math.gl/wkb';
import type {WellKnownDimension, WKBGeometryType as MathWKBGeometryType} from '@math.gl/wkb';
import {WKBGeometryType} from './helpers/wkb-types';

/** Function that writes one WKB geometry into a builder. */
export type WKBGeometryWriter = (builder: WKBBuilder) => void;

/** Geometry type names accepted by the generic WKB builder. */
export type WKBGeometryTypeName = MathWKBGeometryType;

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
export type WKBBuilderMeasureOptions = WKBBuilderBaseOptions & {mode: 'measure'};

/** Options for a WKB builder that writes into caller-owned storage. */
export type WKBBuilderWriteOptions = WKBBuilderBaseOptions & {
  mode: 'write';
  target: ArrayBufferLike | ArrayBufferView;
  byteOffset?: number;
};

/** Constructor options for the incremental WKB builder. */
export type WKBBuilderOptions = WKBBuilderMeasureOptions | WKBBuilderWriteOptions;

/** Contiguous Arrow-style WKB geometry array buffers. */
export type WKBGeometryArray = {
  valueOffsets: Int32Array;
  values: Uint8Array;
  nullBitmap?: Uint8Array;
  nullCount: number;
};

/**
 * Compatibility facade over the Arrow-independent `@math.gl/wkb` builder.
 *
 * The loaders.gl API retains its legacy `hasZ` and `hasM` options while math.gl owns byte
 * measurement, bounds checking, endian handling, and WKB emission.
 */
export class WKBBuilder {
  readonly mode: 'measure' | 'write';
  readonly hasZ: boolean;
  readonly hasM: boolean;
  readonly transform?: WKBCoordinateTransform;
  private readonly builder: MathWKBBuilder;

  constructor(options: WKBBuilderOptions) {
    this.mode = options.mode;
    this.hasZ = Boolean(options.hasZ);
    this.hasM = Boolean(options.hasM);
    this.transform = options.transform;
    const dimension = getDimension(this.hasZ, this.hasM);
    const transform = options.transform
      ? (coordinate: readonly number[]): readonly number[] => {
          const transformed = options.transform!([coordinate[0], coordinate[1]]);
          return [transformed[0], transformed[1], ...coordinate.slice(2)];
        }
      : undefined;
    this.builder =
      options.mode === 'write'
        ? new MathWKBBuilder({
            mode: 'write',
            target: options.target,
            byteOffset: options.byteOffset,
            dimension,
            transform
          })
        : new MathWKBBuilder({mode: 'measure', dimension, transform});
  }

  /** Begins a geometry by type, optionally writing its count field. */
  beginGeometry(type: WKBGeometryType | WKBGeometryTypeName, count?: number): void {
    this.builder.beginGeometry(getGeometryTypeName(type), count);
  }

  /** Begins one point geometry. */
  beginPoint(): void {
    this.builder.beginPoint();
  }

  /** Begins one linestring geometry. */
  beginLineString(pointCount: number): void {
    this.builder.beginLineString(pointCount);
  }

  /** Begins one polygon geometry. */
  beginPolygon(ringCount: number): void {
    this.builder.beginPolygon(ringCount);
  }

  /** Begins one linear ring inside a polygon. */
  beginLinearRing(pointCount: number): void {
    this.builder.beginLinearRing(pointCount);
  }

  /** Begins one multipoint geometry. */
  beginMultiPoint(pointCount: number): void {
    this.builder.beginMultiPoint(pointCount);
  }

  /** Begins one multilinestring geometry. */
  beginMultiLineString(lineCount: number): void {
    this.builder.beginMultiLineString(lineCount);
  }

  /** Begins one multipolygon geometry. */
  beginMultiPolygon(polygonCount: number): void {
    this.builder.beginMultiPolygon(polygonCount);
  }

  /** Writes one coordinate using the builder's dimensional options. */
  writeCoordinate(x: number, y: number, z?: number, m?: number): void {
    this.builder.writeCoordinate(x, y, z, m);
  }

  /** Finishes the current geometry and returns its byte length. */
  finishGeometry(): number {
    return this.builder.finishGeometry();
  }

  /** Returns the number of bytes measured or written by this builder. */
  getByteLength(): number {
    return this.builder.finishGeometry();
  }

  /** Measures geometry writer callbacks and returns Arrow Binary offsets. */
  static measureGeometryArray(
    geometryWriters: readonly (WKBGeometryWriter | null | undefined)[],
    options: WKBBuilderBaseOptions = {}
  ): Int32Array {
    const valueOffsets = new Int32Array(geometryWriters.length + 1);
    for (let index = 0; index < geometryWriters.length; index++) {
      const writer = geometryWriters[index];
      if (writer) {
        const builder = new WKBBuilder({mode: 'measure', ...options});
        writer(builder);
        valueOffsets[index + 1] = valueOffsets[index] + builder.finishGeometry();
      } else {
        valueOffsets[index + 1] = valueOffsets[index];
      }
    }
    return valueOffsets;
  }

  /** Writes geometry writer callbacks into an existing contiguous values buffer. */
  static writeGeometryArray(
    geometryWriters: readonly (WKBGeometryWriter | null | undefined)[],
    valueOffsets: Int32Array,
    values: Uint8Array,
    options: WKBBuilderBaseOptions = {}
  ): Uint8Array {
    for (let index = 0; index < geometryWriters.length; index++) {
      const writer = geometryWriters[index];
      if (writer) {
        const builder = new WKBBuilder({
          mode: 'write',
          target: values,
          byteOffset: valueOffsets[index],
          ...options
        });
        writer(builder);
        builder.finishGeometry();
      }
    }
    return values;
  }

  /** Builds Arrow-style offsets, values, and validity buffers in two passes. */
  static buildGeometryArray(
    geometryWriters: readonly (WKBGeometryWriter | null | undefined)[],
    options: WKBBuilderBaseOptions = {}
  ): WKBGeometryArray {
    const valueOffsets = WKBBuilder.measureGeometryArray(geometryWriters, options);
    const values = new Uint8Array(valueOffsets[valueOffsets.length - 1]);
    WKBBuilder.writeGeometryArray(geometryWriters, valueOffsets, values, options);
    const nullBitmap = new Uint8Array(Math.ceil(geometryWriters.length / 8));
    let nullCount = 0;
    for (let index = 0; index < geometryWriters.length; index++) {
      if (geometryWriters[index]) nullBitmap[index >> 3] |= 1 << (index & 7);
      else nullCount++;
    }
    return {valueOffsets, values, nullBitmap: nullCount ? nullBitmap : undefined, nullCount};
  }
}

function getDimension(hasZ: boolean, hasM: boolean): WellKnownDimension {
  return hasZ && hasM ? 'xyzm' : hasZ ? 'xyz' : hasM ? 'xym' : 'xy';
}

function getGeometryTypeName(type: WKBGeometryType | WKBGeometryTypeName): WKBGeometryTypeName {
  return typeof type === 'number' ? (WKBGeometryType[type] as WKBGeometryTypeName) : type;
}
