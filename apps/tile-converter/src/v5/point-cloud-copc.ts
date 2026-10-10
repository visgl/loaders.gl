// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {COPCWriter, type COPCWriterOptions} from '@loaders.gl/copc';
import type {Mesh, MeshArrowTable} from '@loaders.gl/schema';
import {TileConversionError, type TileConversionCodec} from '@loaders.gl/tile-converter/v5/core';
import {
  getPointCloudMesh,
  mapPointCloudAttributes,
  type PointCloudAttributeMapping
} from './point-cloud-attributes.js';

/** Bounded, explicitly placed COPC batch authoring. */
export interface EncodePointCloudCOPCOptions {
  /** All attribute aliases and semantic omissions must be explicit. */
  readonly mapping: PointCloudAttributeMapping;
  /** LAS axis scales; positions must already be absolute coordinates in the declared CRS. */
  readonly scale: readonly [number, number, number];
  /** LAS axis offsets used for signed int32 quantization. */
  readonly offset: readonly [number, number, number];
  /** Explicit OGC WKT CRS declaration; no inference or reprojection is performed. */
  readonly wkt: string;
  /** Maximum Euclidean quantization error in source units. */
  readonly maxPositionError: number;
  /** Maximum distinct retained source buffer bytes; default 64 MiB. */
  readonly maxInputBytes?: number;
  /** Maximum rows in one batch; default 1000000. */
  readonly maxPoints?: number;
  /** Maximum completed encoded bytes; default 128 MiB. Writer temporary memory is additional. */
  readonly maxOutputBytes?: number;
  /** Explicit LAS Extra Bytes names for custom typed attributes, including exact 64-bit IDs. */
  readonly extraBytes?: NonNullable<COPCWriterOptions['copc']>['extraBytes'];
  /** Optional octree organization forwarded to the owning COPC writer. */
  readonly organization?: Pick<
    NonNullable<COPCWriterOptions['copc']>,
    'nodePointLimit' | 'maximumDepth' | 'hierarchyPageDepth' | 'spacing'
  >;
  /** Cancellation before validation and before/after synchronous writer execution. */
  readonly signal?: AbortSignal;
}

/** A complete COPC file and its explicit precision/loss report. */
export interface EncodedPointCloudCOPC {
  /** Range-readable COPC 1.0 / LAZ 1.4 bytes. */
  readonly copc: ArrayBuffer;
  /** Exact encoded point count. */
  readonly pointCount: number;
  /** Maximum reconstructed Euclidean position error. */
  readonly maximumPositionError: number;
  /** Authorized attribute omissions and reasons. */
  readonly droppedAttributes: Readonly<Record<string, string>>;
}

/** Standard scalar attributes qualified for PDRF 6/7/8, with integer bounds. */
const SCALAR_RANGES: Readonly<Record<string, readonly [number, number]>> = {
  intensity: [0, 65535],
  classification: [0, 255],
  nir: [0, 65535],
  gpsTime: [-Infinity, Infinity],
  scanAngle: [-32768, 32767],
  userData: [0, 255],
  pointSourceId: [0, 65535],
  returnNumber: [1, 15],
  numberOfReturns: [1, 15],
  scannerChannel: [0, 3],
  scanDirectionFlag: [0, 1],
  edgeOfFlightLine: [0, 1],
  synthetic: [0, 1],
  keyPoint: [0, 1],
  withheld: [0, 1],
  overlap: [0, 1]
};

/** Encodes one decoded point batch as COPC with explicit mappings, CRS and precision gates. */
export async function encodePointCloudCOPC(
  input: Mesh | MeshArrowTable,
  options: EncodePointCloudCOPCOptions
): Promise<EncodedPointCloudCOPC> {
  const maxInputBytes = options.maxInputBytes ?? 64 * 1024 * 1024;
  const maxPoints = options.maxPoints ?? 1000000;
  const maxOutputBytes = options.maxOutputBytes ?? 128 * 1024 * 1024;
  if (
    [maxInputBytes, maxPoints, maxOutputBytes].some(
      value => !Number.isSafeInteger(value) || value < 1
    ) ||
    options.scale.length !== 3 ||
    options.scale.some(value => !Number.isFinite(value) || value <= 0) ||
    options.offset.length !== 3 ||
    options.offset.some(value => !Number.isFinite(value)) ||
    typeof options.wkt !== 'string' ||
    !options.wkt.trim() ||
    !Number.isFinite(options.maxPositionError) ||
    options.maxPositionError < 0
  )
    throw new TileConversionError(
      'POINT_CLOUD_COPC_OPTIONS_INVALID',
      'COPC requires explicit finite scale, offset, CRS, precision and positive budgets'
    );
  options.signal?.throwIfAborted();
  const source = getPointCloudMesh(input, maxInputBytes);
  const {mesh, droppedAttributes} = mapPointCloudAttributes(source, options.mapping);
  const position = mesh.attributes.POSITION;
  const pointCount = mesh.header?.vertexCount ?? position.value.length / 3;
  if (!Number.isSafeInteger(pointCount) || pointCount < 1 || pointCount > maxPoints)
    throw new TileConversionError(
      'POINT_CLOUD_POINT_BUDGET',
      'COPC requires a nonempty batch within the point limit'
    );
  if (
    !(position.value instanceof Float32Array || position.value instanceof Float64Array) ||
    position.size !== 3 ||
    position.normalized
  )
    throw new TileConversionError(
      'POINT_CLOUD_POSITION_INVALID',
      'COPC requires decoded floating XYZ'
    );
  const extraNames = new Set(options.extraBytes?.map(field => field.attribute) || []);
  const descriptorNames = new Set(
    options.extraBytes?.map(field => field.name || field.attribute) || []
  );
  if (
    extraNames.size !== (options.extraBytes?.length || 0) ||
    descriptorNames.size !== extraNames.size ||
    options.extraBytes?.some(
      field =>
        !mesh.attributes[field.attribute] ||
        !field.attribute ||
        !new TextEncoder().encode(field.name || field.attribute).length ||
        new TextEncoder().encode(field.name || field.attribute).length > 32 ||
        new TextEncoder().encode(field.description || '').length > 32
    )
  )
    throw new TileConversionError(
      'POINT_CLOUD_EXTRA_BYTES_INVALID',
      'Extra Bytes descriptors require unique mapped attributes and names/descriptions within 32 UTF-8 bytes'
    );
  for (const name of extraNames)
    if (name === 'POSITION' || name === 'COLOR_0' || Object.hasOwn(SCALAR_RANGES, name))
      throw new TileConversionError(
        'POINT_CLOUD_EXTRA_BYTES_INVALID',
        'Map standard attributes directly instead of duplicating them as Extra Bytes'
      );
  for (const [name, attribute] of Object.entries(mesh.attributes)) {
    const color = name === 'COLOR_0';
    const extra = extraNames.has(name);
    if (name !== 'POSITION' && !color && !extra && !Object.hasOwn(SCALAR_RANGES, name))
      throw new TileConversionError(
        'POINT_CLOUD_ATTRIBUTE_UNSUPPORTED',
        `COPC cannot preserve ${name}; supply an explicit supported mapping or drop reason`
      );
    if (
      attribute.transform ||
      attribute.byteOffset ||
      attribute.byteStride ||
      attribute.componentType === 'float16' ||
      attribute.value.length !== pointCount * attribute.size ||
      (!color && attribute.normalized) ||
      (name !== 'POSITION' &&
        !color &&
        (extra ? ![1, 3].includes(attribute.size) : attribute.size !== 1))
    )
      throw new TileConversionError(
        'POINT_CLOUD_ATTRIBUTE_INVALID',
        `COPC requires packed decoded attributes: ${name}`
      );
    if (color) {
      if (
        attribute.size !== 3 ||
        !(attribute.value instanceof Uint8Array || attribute.value instanceof Uint16Array)
      )
        throw new TileConversionError(
          'POINT_CLOUD_COLOR_INVALID',
          'COPC requires explicitly mapped uint8/uint16 RGB'
        );
    } else if (extra) {
      for (const value of attribute.value)
        if (typeof value !== 'bigint' && !Number.isFinite(value))
          throw new TileConversionError(
            'POINT_CLOUD_ATTRIBUTE_RANGE',
            `Nonfinite Extra Bytes value: ${name}`
          );
    } else if (name !== 'POSITION') {
      const [minimum, maximum] = SCALAR_RANGES[name];
      for (const value of attribute.value) {
        if (
          typeof value !== 'number' ||
          !Number.isFinite(value) ||
          value < minimum ||
          value > maximum ||
          (name !== 'gpsTime' && !Number.isInteger(value))
        )
          throw new TileConversionError(
            'POINT_CLOUD_ATTRIBUTE_RANGE',
            `COPC value outside the qualified range: ${name}`
          );
      }
    }
  }
  let maximumPositionError = 0;
  const minimum = [Infinity, Infinity, Infinity];
  const maximum = [-Infinity, -Infinity, -Infinity];
  for (let row = 0; row < pointCount; row++) {
    const errors = [0, 0, 0];
    for (let axis = 0; axis < 3; axis++) {
      const value = position.value[row * 3 + axis];
      const encoded = Math.round((value - options.offset[axis]) / options.scale[axis]);
      if (
        !Number.isFinite(value) ||
        !Number.isSafeInteger(encoded) ||
        encoded < -2147483648 ||
        encoded > 2147483647
      )
        throw new TileConversionError(
          'POINT_CLOUD_POSITION_RANGE',
          'COPC position exceeds signed int32 quantization'
        );
      minimum[axis] = Math.min(minimum[axis], value);
      maximum[axis] = Math.max(maximum[axis], value);
      errors[axis] = encoded * options.scale[axis] + options.offset[axis] - value;
    }
    maximumPositionError = Math.max(maximumPositionError, Math.hypot(...errors));
    if (maximumPositionError > options.maxPositionError)
      throw new TileConversionError(
        'POINT_CLOUD_PRECISION_EXCEEDED',
        'COPC position rounding exceeds the declared error gate'
      );
    if (row % 16384 === 0) {
      await new Promise<void>(resolve => setTimeout(resolve, 0));
      options.signal?.throwIfAborted();
    }
  }
  const width = Math.max(...maximum.map((value, axis) => value - minimum[axis]), ...options.scale);
  const radius = width / 2;
  if (
    !Number.isFinite(Math.hypot(radius, radius, radius)) ||
    minimum.some((value, axis) => {
      const center = value + (maximum[axis] - value) / 2;
      return (
        !Number.isFinite(value + maximum[axis]) ||
        !Number.isFinite(center - radius) ||
        !Number.isFinite(center + radius)
      );
    })
  )
    throw new TileConversionError('POINT_CLOUD_BOUNDS_INVALID', 'COPC coordinate extent overflow');
  // The owning writer executes synchronously; cancellation cannot interrupt its compression call.
  options.signal?.throwIfAborted();
  const color = mesh.attributes.COLOR_0;
  const copc = COPCWriter.encodeSync(mesh, {
    copc: {
      ...options.organization,
      scale: [...options.scale],
      offset: [...options.offset],
      wkt: options.wkt,
      pointDataRecordFormat: mesh.attributes.nir ? 8 : color ? 7 : 6,
      colorDepth: color?.value instanceof Uint16Array ? 16 : 8,
      extraBytes: options.extraBytes
    }
  });
  options.signal?.throwIfAborted();
  if (copc.byteLength > maxOutputBytes)
    throw new TileConversionError(
      'POINT_CLOUD_OUTPUT_BUDGET',
      'Completed COPC output exceeds the byte budget'
    );
  return {copc, pointCount, maximumPositionError, droppedAttributes};
}

/** Creates a v5 codec for one independently authored COPC file per decoded input batch. */
export function createCOPCConversionCodec(
  options: EncodePointCloudCOPCOptions
): TileConversionCodec<unknown, Mesh | MeshArrowTable, EncodedPointCloudCOPC> {
  return {
    async *convert(input, _inspection, signal) {
      const combinedSignal =
        options.signal && signal
          ? AbortSignal.any([options.signal, signal])
          : options.signal || signal;
      yield await encodePointCloudCOPC(input, {...options, signal: combinedSignal});
    }
  };
}
