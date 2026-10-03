// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getSpatialCoordinateFrame} from '@loaders.gl/tiles';
import type {TilesetSpatialReference} from '@loaders.gl/tiles';
import type {MeshGeometry} from '@loaders.gl/schema';
import {TileConversionError} from './conversion-api.js';
import type {TileConversionCodec} from './conversion-api.js';
import type {Tiles3DConversionSpatialContext} from './spatial-conversion.js';
import {encodeMeshTile, validateMeshGeometry} from './mesh.js';
import type {MeshTileMaterial} from './mesh.js';

/** Explicitly selected geometry, with positions already in the spatial context's source frame. */
export interface MeshConversionInput {
  /** Caller-owned resource identifier, forwarded to the output sink. */
  readonly id: string;
  /** Triangle geometry with absolute packed Float32 or Float64 source positions. */
  readonly mesh: MeshGeometry;
  /** Optional single material with an embedded base-color image, mapped explicitly by the source adapter. */
  readonly material?: MeshTileMaterial;
  /** Finite xyz origin in the target frame, subtracted before float32 encoding. */
  readonly origin: readonly [number, number, number];
}

/** A completed GLB resource and the metadata needed to place its local geometry. */
export interface EncodedMeshConversionResource {
  /** Caller-owned resource identifier. */
  readonly id: string;
  /** Self-contained GLB with local positions and transformed normals. */
  readonly glb: ArrayBuffer;
  /** Target-frame translation to add to the encoded positions. */
  readonly origin: readonly [number, number, number];
  /** Target-frame bounds of the reconstructed encoded vertices, including float32 rounding. */
  readonly boundingBox: readonly [readonly number[], readonly number[]];
  /** Metadata describing the output coordinate operation and height reference. */
  readonly spatialReference: TilesetSpatialReference;
  /** Largest measured Euclidean reconstruction error in target coordinate units. */
  readonly maximumPositionError: number;
}

/** Spatial policy used by the concrete mesh conversion codec. */
export interface MeshConversionCodecOptions {
  /** Shared context that accepts absolute source positions and returns absolute target positions. */
  readonly spatialContext: Tiles3DConversionSpatialContext;
  /** Maximum Euclidean reconstruction error per vertex, in target coordinate units. */
  readonly maxPositionError: number;
}

/**
 * Creates a concrete mesh codec for `convertTileset`.
 *
 * Source adapters must select geometry and apply source placement before supplying absolute
 * positions and matching normals. This codec applies the supplied spatial context once, rebases
 * around each input's target origin, and rejects rounding above the explicit error budget.
 * Geographic and unknown output frames are rejected. The returned origin/bounds/reference are
 * external placement metadata; applications own axis conventions, hierarchy, and packaging.
 * Input arrays are not mutated. Core input/output byte gates, cancellation, awaited writes, and
 * destination finalize/abort handling apply when used through `convertTileset`.
 *
 * @param options - Resolved spatial context and finite nonnegative target-unit precision budget.
 * @returns One GLB and matching metadata per input geometry.
 */
export function createMeshConversionCodec<TInspection = unknown>(
  options: MeshConversionCodecOptions
): TileConversionCodec<TInspection, MeshConversionInput, EncodedMeshConversionResource> {
  const {spatialContext, maxPositionError} = options;
  if (!Number.isFinite(maxPositionError) || maxPositionError < 0) {
    throw new TileConversionError(
      'MESH_PRECISION_LIMIT_INVALID',
      'maxPositionError must be finite and nonnegative'
    );
  }
  const spatialReference = spatialContext.spatialReference;
  const outputCrs = spatialReference.targetCrs || spatialReference.sourceCrs;
  const outputFrame =
    spatialReference.status === 'native'
      ? spatialReference.coordinateFrame
      : outputCrs
        ? getSpatialCoordinateFrame(outputCrs)
        : 'unknown';
  if (
    !['native', 'transformed'].includes(spatialReference.status) ||
    !['projected', 'geocentric', 'local', 'cartesian'].includes(outputFrame)
  ) {
    throw new TileConversionError(
      'MESH_OUTPUT_FRAME_UNSUPPORTED',
      'Mesh output requires a resolved Cartesian coordinate frame'
    );
  }
  return {
    /** Prepares and encodes one geometry while honoring cancellation. */
    async *convert(resource, _inspection, signal) {
      signal?.throwIfAborted();
      const geometry = validateMeshGeometry(resource.mesh, true);
      const sourcePositions = geometry.attributes.POSITION.value;
      const origin: [number, number, number] = [...resource.origin];
      if (origin.length !== 3 || origin.some(value => !Number.isFinite(value))) {
        throw new TileConversionError(
          'MESH_ORIGIN_INVALID',
          'Target origin must contain three finite coordinates'
        );
      }
      const targetPositions = spatialContext.transformPositions(sourcePositions);
      if (
        targetPositions.length !== sourcePositions.length ||
        targetPositions.some(value => !Number.isFinite(value))
      ) {
        throw new TileConversionError(
          'MESH_TRANSFORM_INVALID',
          'Spatial transformation must return one finite xyz position per vertex'
        );
      }
      const localPositions = new Float32Array(targetPositions.length);
      const minimum = [Infinity, Infinity, Infinity];
      const maximum = [-Infinity, -Infinity, -Infinity];
      let maximumPositionError = 0;
      for (let index = 0; index < targetPositions.length; index += 3) {
        for (let axis = 0; axis < 3; axis++) {
          localPositions[index + axis] = targetPositions[index + axis] - origin[axis];
          const reconstructed = localPositions[index + axis] + origin[axis];
          minimum[axis] = Math.min(minimum[axis], reconstructed);
          maximum[axis] = Math.max(maximum[axis], reconstructed);
        }
        const positionError = Math.hypot(
          localPositions[index] + origin[0] - targetPositions[index],
          localPositions[index + 1] + origin[1] - targetPositions[index + 1],
          localPositions[index + 2] + origin[2] - targetPositions[index + 2]
        );
        if (!Number.isFinite(positionError) || positionError > maxPositionError) {
          throw new TileConversionError(
            'MESH_POSITION_PRECISION_EXCEEDED',
            'Float32 mesh positions exceed the configured reconstruction error budget'
          );
        }
        maximumPositionError = Math.max(maximumPositionError, positionError);
      }
      geometry.attributes.POSITION = {value: localPositions, size: 3};
      if (geometry.attributes.NORMAL) {
        geometry.attributes.NORMAL = {
          value: spatialContext.transformNormals(geometry.attributes.NORMAL.value, sourcePositions),
          size: 3
        };
      }
      const glb = encodeMeshTile(geometry, {material: resource.material});
      signal?.throwIfAborted();
      yield {
        id: resource.id,
        glb,
        origin,
        boundingBox: [minimum, maximum],
        spatialReference,
        maximumPositionError
      };
    },
    /** Reports position rounding authorized by the configured precision budget. */
    async validateOutput(resource) {
      return resource.maximumPositionError > 0
        ? [
            {
              code: 'MESH_POSITION_ROUNDING',
              message: `Encoded positions have up to ${resource.maximumPositionError} target-unit reconstruction error`,
              severity: 'info' as const,
              resourceId: resource.id
            }
          ]
        : [];
    }
  };
}
