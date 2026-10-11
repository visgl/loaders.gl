// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  createTilesetSpatialReference,
  I3SSpatialTransformer,
  markTilesetSpatialReferenceTransformed,
  Tiles3DSpatialTransformer
} from '@loaders.gl/tiles';
import {Matrix4} from '@math.gl/core';
import type {
  CreateTilesetSpatialReferenceOptions,
  I3SSpatialBounds,
  I3STransformedPositions,
  I3STransformedGeometry,
  Tiles3DSpatialBoundingVolume,
  TilesetSpatialOptions,
  TilesetSpatialReference
} from '@loaders.gl/tiles';
import {TileConversionError} from './conversion-api.js';
import type {TileConversionDiagnostic} from './conversion-api.js';

/** Portable coordinate operations and output metadata for a 3D Tiles conversion. */
export interface Tiles3DConversionSpatialContext {
  /** Source and selected target CRS, height reference, units, and transformation state. */
  readonly spatialReference: TilesetSpatialReference;
  /** Transform packed absolute xyz positions using double precision output. */
  transformPositions(positions: ArrayLike<number>): Float64Array;
  /** Transform packed normals using the corresponding source positions. */
  transformNormals(normals: ArrayLike<number>, positions: ArrayLike<number>): Float32Array;
  /** Rebuild a conservative bound in the selected target coordinate frame. */
  transformBoundingVolume(
    volume: Tiles3DSpatialBoundingVolume,
    sourceTransform?: ArrayLike<number>
  ): Tiles3DSpatialBoundingVolume;
}

/** Portable coordinate operations and output metadata for an I3S conversion. */
export interface I3SConversionSpatialContext {
  /** Source and selected target CRS, height reference, units, and transformation state. */
  readonly spatialReference: TilesetSpatialReference;
  /** Transform absolute I3S positions after applying declared height units and placement. */
  transformPositions(
    positions: ArrayLike<number>,
    sourceOrigin: ArrayLike<number>
  ): I3STransformedPositions;
  /** Transform absolute conversion geometry without intermediate float32 rounding. */
  transformGeometryAsync(
    positions: ArrayLike<number>,
    normals?: ArrayLike<number>,
    normalReferenceFrame?: string
  ): Promise<I3STransformedGeometry>;
  /** Transform absolute I3S positions when terrain or scene sampling is asynchronous. */
  transformPositionsAsync(
    positions: ArrayLike<number>,
    sourceOrigin: ArrayLike<number>
  ): Promise<I3STransformedPositions>;
  /** Transform packed normals using the corresponding source positions. */
  transformNormals(
    normals: ArrayLike<number>,
    positions: ArrayLike<number>,
    normalReferenceFrame?: string
  ): Float32Array;
  /** Rebuild a conservative I3S bound in the selected target frame. */
  transformBoundingVolume(
    bounds: I3SSpatialBounds
  ): I3SSpatialBounds | {box?: number[]; region?: number[]};
  /** Rebuild a bound when terrain or scene sampling is asynchronous. */
  transformBoundingVolumeAsync(
    bounds: I3SSpatialBounds
  ): Promise<I3SSpatialBounds | {box?: number[]; region?: number[]}>;
}

/**
 * Creates the shared spatial operations used to write 3D Tiles in a selected CRS and height frame.
 *
 * Source discovery remains format-specific and should use `get3DTilesSpatialReference` or the
 * initialized source's spatial metadata. Target choices on a normalized, transformable reference
 * are retained unless overridden in `options`. Do not reuse a reference already marked
 * `transformed`; that would apply the operation twice. The returned reference is the metadata to
 * publish with transformed output; unresolved requests fail instead of guessing a CRS or height datum.
 *
 * @param discovered - Source CRS, units, coordinate epoch, and height metadata.
 * @param options - Target CRS, height reference, and explicitly supplied geoid resources.
 * @returns Shared position, normal, and bound operations with matching output metadata.
 */
export function createTiles3DConversionSpatialContext(
  discovered: CreateTilesetSpatialReferenceOptions | TilesetSpatialReference,
  options: TilesetSpatialOptions = {}
): Tiles3DConversionSpatialContext {
  const spatialReference = createConversionSpatialReference(discovered, options);
  if (spatialReference.status === 'unresolved') {
    throw createSpatialConversionError(spatialReference);
  }

  if (spatialReference.status !== 'native' && spatialReference.coordinateEpoch !== undefined) {
    throw new TileConversionError(
      'SPATIAL_EPOCH_UNSUPPORTED',
      'Epoch-tagged coordinates require an epoch-aware datum operation before conversion'
    );
  }

  const transformer =
    spatialReference.status === 'native'
      ? undefined
      : createSpatialTransformer(
          spatialReference,
          () => new Tiles3DSpatialTransformer(spatialReference, options)
        );
  const outputSpatialReference = transformer
    ? markTilesetSpatialReferenceTransformed(spatialReference)
    : spatialReference;

  return {
    spatialReference: outputSpatialReference,
    transformPositions: positions =>
      transformer ? transformer.transformPositions(positions) : copyNativePositions(positions),
    transformNormals: (normals, positions) =>
      transformer
        ? transformer.transformNormals(normals, positions)
        : copyNativeNormals(normals, positions),
    transformBoundingVolume: (volume, sourceTransform) =>
      transformer
        ? transformer.transformBoundingVolume(volume, sourceTransform)
        : cloneBoundingVolume(volume)
  };
}

/**
 * Creates the shared spatial operations used to write I3S in a selected CRS and height frame.
 *
 * I3S height units, vertical datum, elevation placement, and bounds use the same transformer as
 * the source-backed tile runtime. Terrain or scene elevation providers are explicit application
 * inputs and may make position and bound operations asynchronous.
 *
 * @param discovered - Source CRS, vertical units, height reference, and elevation mode.
 * @param options - Target CRS, height reference, geoid, or explicit elevation providers.
 * @returns Shared position, normal, bound, and output-metadata operations.
 */
export function createI3SConversionSpatialContext(
  discovered: CreateTilesetSpatialReferenceOptions | TilesetSpatialReference,
  options: TilesetSpatialOptions = {}
): I3SConversionSpatialContext {
  const spatialReference = createConversionSpatialReference(discovered, options);
  if (spatialReference.status === 'unresolved') {
    throw createSpatialConversionError(spatialReference);
  }

  if (spatialReference.status !== 'native' && spatialReference.coordinateEpoch !== undefined) {
    throw new TileConversionError(
      'SPATIAL_EPOCH_UNSUPPORTED',
      'Epoch-tagged coordinates require an epoch-aware datum operation before conversion'
    );
  }

  const transformer =
    spatialReference.status === 'native'
      ? undefined
      : createSpatialTransformer(
          spatialReference,
          () => new I3SSpatialTransformer(spatialReference, options)
        );
  const outputSpatialReference = transformer ? transformer.spatialReference : spatialReference;
  // I3S vector bases can differ from the coordinate basis even when positions retain their CRS.
  let nativeNormalTransformer: I3SSpatialTransformer | undefined;
  /** Maps native I3S vectors into the writer basis without reprojecting its positions. */
  const transformNativeNormals = (
    normals: ArrayLike<number>,
    positions: ArrayLike<number>,
    normalReferenceFrame?: string
  ): Float32Array => {
    validateNormalReferenceFrame(normalReferenceFrame);
    const targetNormals = copyNativeNormals(normals, positions);
    if (
      !spatialReference.sourceCrs ||
      ['local', 'cartesian'].includes(spatialReference.coordinateFrame)
    ) {
      return targetNormals;
    }
    nativeNormalTransformer ||= createSpatialTransformer(
      spatialReference,
      () =>
        new I3SSpatialTransformer(
          {
            ...spatialReference,
            status: 'transformable',
            targetCrs: spatialReference.sourceCrs
          },
          options
        )
    );
    return nativeNormalTransformer.transformNormals(targetNormals, positions, normalReferenceFrame);
  };

  return {
    spatialReference: outputSpatialReference,
    transformPositions: (positions, sourceOrigin) =>
      transformer
        ? transformer.transformPositions(positions, sourceOrigin)
        : createNativeI3SPositions(positions, sourceOrigin, spatialReference),
    transformGeometryAsync: async (positions, normals, normalReferenceFrame) => {
      if (transformer)
        return transformer.transformGeometryAsync(positions, normals, normalReferenceFrame);
      const targetPositions = Float64Array.from(positions);
      if (
        targetPositions.length % 3 ||
        targetPositions.some(value => !Number.isFinite(value)) ||
        (normals &&
          (normals.length !== positions.length ||
            Array.from(normals).some(value => !Number.isFinite(value)))) ||
        (normalReferenceFrame !== undefined &&
          !['earth-centered', 'vertex-reference-frame'].includes(normalReferenceFrame))
      ) {
        throw new TileConversionError(
          'SPATIAL_INPUT_INVALID',
          'Conversion geometry requires finite matching xyz arrays and a supported I3S vector frame'
        );
      }
      return {
        positions: targetPositions,
        normals: normals
          ? transformNativeNormals(normals, positions, normalReferenceFrame)
          : undefined
      };
    },
    transformPositionsAsync: (positions, sourceOrigin) =>
      transformer
        ? transformer.transformPositionsAsync(positions, sourceOrigin)
        : Promise.resolve(createNativeI3SPositions(positions, sourceOrigin, spatialReference)),
    transformNormals: (normals, positions, normalReferenceFrame) =>
      transformer
        ? transformer.transformNormals(normals, positions, normalReferenceFrame)
        : transformNativeNormals(normals, positions, normalReferenceFrame),
    transformBoundingVolume: bounds =>
      transformer ? transformer.transformBoundingVolume(bounds) : cloneI3SBounds(bounds),
    transformBoundingVolumeAsync: bounds =>
      transformer
        ? transformer.transformBoundingVolumeAsync(bounds)
        : Promise.resolve(cloneI3SBounds(bounds))
  };
}

/** Raises a typed error and preserves discovery warnings for unresolved spatial operations. */
function createSpatialConversionError(
  spatialReference: TilesetSpatialReference,
  cause?: unknown
): TileConversionError {
  const diagnostics: TileConversionDiagnostic[] = spatialReference.warnings.map(message => ({
    code: 'SPATIAL_REFERENCE_WARNING',
    message,
    severity: 'warning' as const
  }));
  const causeMessage = cause instanceof Error ? `: ${cause.message}` : '';
  const message = causeMessage
    ? `Spatial conversion could not be initialized${causeMessage}`
    : 'The requested spatial conversion cannot be resolved from the available metadata';
  diagnostics.push({
    code: 'SPATIAL_REFERENCE_UNRESOLVED',
    message,
    severity: 'error'
  });
  return new TileConversionError('SPATIAL_REFERENCE_UNRESOLVED', message, diagnostics);
}

/** Creates a conversion reference while retaining target choices from normalized source metadata. */
function createConversionSpatialReference(
  discovered: CreateTilesetSpatialReferenceOptions | TilesetSpatialReference,
  options: TilesetSpatialOptions
): TilesetSpatialReference {
  if (!('status' in discovered)) {
    return createTilesetSpatialReference(discovered, options);
  }
  if (discovered.status === 'transformed') {
    throw createSpatialConversionError(
      discovered,
      new Error('coordinates are already transformed')
    );
  }

  const sourceMetadata: CreateTilesetSpatialReferenceOptions = {
    sourceCrs: discovered.sourceCrs,
    sourceCrsState: discovered.crs.state,
    sourceCrsRepresentation:
      discovered.crs.state === 'explicit' || discovered.crs.state === 'default'
        ? discovered.crs.representation
        : undefined,
    sourceCrsAlternatives:
      discovered.crs.state === 'explicit' || discovered.crs.state === 'default'
        ? discovered.crs.alternatives
        : undefined,
    verticalCrs: discovered.verticalCrs,
    units: discovered.units,
    verticalUnitScale: discovered.verticalUnitScale,
    coordinateEpoch: discovered.coordinateEpoch,
    heightReference: discovered.heightReference,
    elevationMode: discovered.elevationMode,
    elevationOffset: discovered.elevationOffset,
    elevationUnit: discovered.elevationUnit,
    elevationUnitScale: discovered.elevationUnitScale,
    coordinateFrame: discovered.coordinateFrame,
    axisOrder: discovered.axisOrder,
    provenance: discovered.provenance,
    warnings: discovered.warnings
  };
  const retainedOptions: TilesetSpatialOptions = {
    ...options,
    targetCrs: options.targetCrs ?? discovered.targetCrs,
    targetHeightReference: options.targetHeightReference ?? discovered.targetHeightReference,
    outputCoordinates: options.outputCoordinates ?? discovered.outputCoordinates
  };
  return createTilesetSpatialReference(sourceMetadata, retainedOptions);
}

/** Converts transformer initialization failures into the public typed diagnostic contract. */
function createSpatialTransformer<T>(
  spatialReference: TilesetSpatialReference,
  createTransformer: () => T
): T {
  try {
    return createTransformer();
  } catch (error) {
    throw createSpatialConversionError(spatialReference, error);
  }
}

/** Clones bounds for native-coordinate output without changing caller-owned arrays. */
function cloneBoundingVolume(volume: Tiles3DSpatialBoundingVolume): Tiles3DSpatialBoundingVolume {
  return {
    ...volume,
    box: volume.box ? [...volume.box] : undefined,
    sphere: volume.sphere ? [...volume.sphere] : undefined,
    region: volume.region ? [...volume.region] : undefined
  };
}

/** Clones I3S bounds for native-coordinate output without changing caller-owned arrays. */
function cloneI3SBounds(bounds: I3SSpatialBounds): I3SSpatialBounds {
  return {
    ...bounds,
    mbs: bounds.mbs ? Array.from(bounds.mbs) : undefined,
    obb: bounds.obb
      ? {
          center: Array.from(bounds.obb.center),
          halfSize: Array.from(bounds.obb.halfSize),
          quaternion: Array.from(bounds.obb.quaternion)
        }
      : undefined
  };
}

/** Build stable local offsets for native I3S coordinates without changing their frame. */
function createNativeI3SPositions(
  sourcePositions: ArrayLike<number>,
  sourceOrigin: ArrayLike<number>,
  spatialReference: TilesetSpatialReference
): I3STransformedPositions {
  const sourcePositions64 = copyNativePositions(sourcePositions);
  if (
    sourceOrigin.length !== 3 ||
    Array.from(sourceOrigin).some(value => !Number.isFinite(value))
  ) {
    throw new TileConversionError(
      'SPATIAL_INPUT_INVALID',
      'I3S origins require three finite coordinates'
    );
  }
  const origin: [number, number, number] = [
    Number(sourceOrigin[0]),
    Number(sourceOrigin[1]),
    Number(sourceOrigin[2])
  ];
  const positions = new Float32Array(sourcePositions.length);
  for (let index = 0; index < sourcePositions.length; index += 3) {
    positions[index] = Number(sourcePositions[index]) - origin[0];
    positions[index + 1] = Number(sourcePositions[index + 1]) - origin[1];
    positions[index + 2] = Number(sourcePositions[index + 2]) - origin[2];
  }
  if (positions.some(value => !Number.isFinite(value))) {
    throw new TileConversionError(
      'SPATIAL_INPUT_INVALID',
      'Native I3S offsets exceed float32 range'
    );
  }
  const isGeographic = spatialReference.coordinateFrame === 'geographic';
  const modelMatrix = isGeographic ? new Matrix4() : new Matrix4().translate(origin);
  return {
    positions,
    sourcePositions: sourcePositions64,
    origin,
    cartographicOrigin: isGeographic ? origin : [0, 0, 0],
    coordinateSystem: isGeographic ? 'lnglat-offsets' : 'cartesian',
    modelMatrix
  };
}

/** Validates and copies native xyz coordinates without invoking a CRS transformer. */
function copyNativePositions(positions: ArrayLike<number>): Float64Array {
  validateNativePositions(positions);
  return Float64Array.from(positions);
}

/** Checks native coordinates without allocating an additional position buffer. */
function validateNativePositions(positions: ArrayLike<number>): void {
  if (positions.length % 3) {
    throw new TileConversionError(
      'SPATIAL_INPUT_INVALID',
      'Positions require complete finite xyz coordinates'
    );
  }
  for (let index = 0; index < positions.length; index++) {
    if (!Number.isFinite(positions[index])) {
      throw new TileConversionError(
        'SPATIAL_INPUT_INVALID',
        'Positions require complete finite xyz coordinates'
      );
    }
  }
}

/** Validates matching native normals and normalizes them without changing their basis. */
function copyNativeNormals(normals: ArrayLike<number>, positions: ArrayLike<number>): Float32Array {
  validateNativePositions(positions);
  if (normals.length !== positions.length) {
    throw new TileConversionError(
      'SPATIAL_INPUT_INVALID',
      'Normals require finite xyz values matching positions'
    );
  }
  const output = new Float32Array(normals.length);
  for (let index = 0; index < normals.length; index += 3) {
    const scale = Math.max(
      Math.abs(normals[index]),
      Math.abs(normals[index + 1]),
      Math.abs(normals[index + 2])
    );
    if (!Number.isFinite(scale)) {
      throw new TileConversionError(
        'SPATIAL_INPUT_INVALID',
        'Normals require finite xyz values matching positions'
      );
    }
    const length = scale
      ? Math.hypot(normals[index] / scale, normals[index + 1] / scale, normals[index + 2] / scale)
      : 0;
    for (let axis = 0; axis < 3; axis++)
      output[index + axis] = length ? normals[index + axis] / scale / length : 0;
  }
  return output;
}

/** Rejects unknown I3S vector frames even when no position reprojection is requested. */
function validateNormalReferenceFrame(frame?: string): void {
  if (frame !== undefined && !['earth-centered', 'vertex-reference-frame'].includes(frame)) {
    throw new TileConversionError(
      'SPATIAL_INPUT_INVALID',
      'Unsupported I3S normal reference frame'
    );
  }
}
