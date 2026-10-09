// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import {getSpatialCoordinateFrame, createTilesetSpatialReference} from '@loaders.gl/tiles';
import {convertTableToMesh, makeMeshArrowTable} from '@loaders.gl/schema-utils';
import {TileConversionError} from '@loaders.gl/tile-converter/v5/core';
import type {
  I3SConversionSpatialContext,
  PointCloudSourceTile
} from '@loaders.gl/tile-converter/v5/core';
import {decodePointCloudPositions} from './point-cloud.js';

/** Explicit spatial preparation for source point positions before PNTS encoding. */
export interface PointCloudSpatialOptions {
  /** Context for the decoded content's source CRS, units and elevation placement. */
  readonly spatialContext: I3SConversionSpatialContext;
  /** Required for point normals; prevents guessing their I3S vector basis. */
  readonly normalReferenceFrame?: 'earth-centered' | 'vertex-reference-frame';
  /** Cancellation checked before and after application-owned elevation sampling. */
  readonly signal?: AbortSignal;
}

/**
 * Resolves renderer placement and transforms one point batch to absolute target coordinates.
 * Cartesian affine placement and longitude/latitude offsets are applied before the shared CRS
 * operation. Ambiguous default/meter-offset representations and repeated source transforms fail
 * explicitly. The caller declares source metadata through the context; metadata on content must
 * agree. Source arrays and traversal headers remain unchanged. Output bounds describe decoded
 * points, not the source LOD volume; archive sinks rebuild their bounds from encoded points.
 * @param sourceTile - A decoded source tile with packed Arrow positions.
 * @param options - Source spatial policy, optional normal frame and cancellation.
 * @returns Prepared target-frame point content, or the unchanged empty tile.
 */
export async function transformPointCloudSourceTile(
  sourceTile: PointCloudSourceTile,
  options: PointCloudSpatialOptions
): Promise<PointCloudSourceTile> {
  options.signal?.throwIfAborted();
  const {content} = sourceTile;
  if (!content) return sourceTile;
  const reference = options.spatialContext.spatialReference;
  const contentReference = content.spatialReference;
  // Already transformed ECEF sources can still expose renderer-relative positions. A native
  // context for their effective frame resolves placement without repeating the source operation.
  const retainTransformedEcef =
    contentReference?.status === 'transformed' &&
    (contentReference.targetCrs || contentReference.sourceCrs) === 'EPSG:4978' &&
    reference.status === 'native' &&
    reference.sourceCrs === 'EPSG:4978' &&
    reference.verticalUnitScale === 1 &&
    (reference.units?.every(unit => unit === 'meter') ?? true);
  const sourceReference = retainTransformedEcef
    ? createTilesetSpatialReference({
        sourceCrs: 'EPSG:4978',
        coordinateFrame: 'geocentric',
        axisOrder: 'xyz',
        units: reference.units,
        coordinateEpoch: contentReference.coordinateEpoch,
        heightReference:
          contentReference.targetHeightReference === 'native'
            ? contentReference.heightReference
            : contentReference.targetHeightReference
      })
    : contentReference;
  if (
    sourceReference &&
    (sourceReference.status === 'transformed' ||
      sourceReference.status === 'unresolved' ||
      JSON.stringify(sourceReference.sourceCrs) !== JSON.stringify(reference.sourceCrs) ||
      sourceReference.heightReference !== reference.heightReference ||
      sourceReference.verticalUnitScale !== reference.verticalUnitScale ||
      sourceReference.coordinateEpoch !== reference.coordinateEpoch ||
      JSON.stringify(sourceReference.units) !== JSON.stringify(reference.units) ||
      sourceReference.elevationMode !== reference.elevationMode ||
      sourceReference.elevationOffset !== reference.elevationOffset ||
      sourceReference.elevationUnitScale !== reference.elevationUnitScale)
  ) {
    throw new TileConversionError(
      'POINT_CLOUD_SPATIAL_REFERENCE_MISMATCH',
      'Point content and context must agree on the input CRS, units, height reference and epoch'
    );
  }
  const sourceFrame =
    reference.coordinateFrame === 'unknown' && reference.sourceCrs
      ? getSpatialCoordinateFrame(reference.sourceCrs)
      : reference.coordinateFrame;
  const geographic = sourceFrame === 'geographic';
  if (
    !['xy', 'xyz', 'unknown'].includes(reference.axisOrder) ||
    (geographic
      ? !['lnglat', 'lnglat-offsets'].includes(content.coordinateSystem)
      : content.coordinateSystem !== 'cartesian' ||
        !['projected', 'geocentric', 'cartesian', 'local'].includes(sourceFrame))
  ) {
    throw new TileConversionError(
      'POINT_CLOUD_SOURCE_FRAME_UNSUPPORTED',
      'Spatial preparation requires explicit Cartesian or longitude/latitude positions in source xyz order'
    );
  }
  if (
    content.cartographicOrigin.length !== 3 ||
    content.cartographicOrigin.some(value => !Number.isFinite(value)) ||
    (content.coordinateSystem !== 'lnglat-offsets' &&
      content.cartographicOrigin.some(value => value !== 0))
  ) {
    throw new TileConversionError(
      'POINT_CLOUD_SOURCE_ORIGIN_INVALID',
      'Only longitude/latitude offsets use a nonzero cartographic origin'
    );
  }
  if (
    content.modelMatrix &&
    (content.modelMatrix.length !== 16 ||
      Array.from(content.modelMatrix).some(value => !Number.isFinite(value)))
  ) {
    throw new TileConversionError(
      'POINT_CLOUD_SOURCE_PLACEMENT_UNSUPPORTED',
      'Point placement must contain sixteen finite matrix values'
    );
  }
  const matrix = new Matrix4(content.modelMatrix ? Array.from(content.modelMatrix) : undefined);
  const determinant = matrix.determinant();
  if (
    matrix[3] !== 0 ||
    matrix[7] !== 0 ||
    matrix[11] !== 0 ||
    matrix[15] !== 1 ||
    !Number.isFinite(determinant) ||
    determinant === 0 ||
    (geographic && !matrix.equals(new Matrix4()))
  ) {
    throw new TileConversionError(
      'POINT_CLOUD_SOURCE_PLACEMENT_UNSUPPORTED',
      'Cartesian placement must be finite, affine and invertible; geographic placement must be identity'
    );
  }
  const mesh = convertTableToMesh(content.data);
  const positionAttribute = mesh.attributes.POSITION;
  const declaredTransform = mesh.schema?.fields.find(field => field.name === 'POSITION')
    ?.metadata?.['loaders.gl.transform'];
  if (declaredTransform && !positionAttribute?.transform) {
    throw new TileConversionError(
      'POINT_CLOUD_POSITION_TRANSFORM_INVALID',
      'Arrow position transform metadata is unsupported or invalid'
    );
  }
  const sourcePositions = decodePointCloudPositions(positionAttribute);
  if (sourcePositions.some(value => !Number.isFinite(value))) {
    throw new TileConversionError(
      'POINT_CLOUD_POSITION_INVALID',
      'Decoded point positions must be finite'
    );
  }
  const translationOnly = Array.from(matrix).every(
    (value, index) => (index >= 12 && index <= 14) || value === (index % 5 === 0 ? 1 : 0)
  );
  for (let index = 0; index < sourcePositions.length; index += 3) {
    if (geographic || translationOnly) {
      for (let axis = 0; axis < 3; axis++) {
        sourcePositions[index + axis] += geographic
          ? content.cartographicOrigin[axis]
          : matrix[12 + axis];
      }
    } else {
      sourcePositions.set(
        matrix.transformAsPoint(Array.from(sourcePositions.subarray(index, index + 3))),
        index
      );
    }
  }
  const normalAttribute = mesh.attributes.NORMAL;
  let normals: Float32Array | undefined;
  if (normalAttribute) {
    if (
      !options.normalReferenceFrame ||
      normalAttribute.size !== 3 ||
      normalAttribute.value.length !== sourcePositions.length ||
      normalAttribute.transform ||
      normalAttribute.normalized ||
      normalAttribute.byteOffset ||
      normalAttribute.byteStride ||
      normalAttribute.componentType ||
      !translationOnly
    ) {
      throw new TileConversionError(
        'POINT_CLOUD_NORMAL_FRAME_REQUIRED',
        'Spatial point normals require a declared vector frame and packed xyz values'
      );
    }
    normals = new Float32Array(normalAttribute.value.length);
    for (let index = 0; index < normals.length; index += 3) {
      const normal = Array.from(normalAttribute.value.slice(index, index + 3));
      const length = Math.hypot(...normal);
      if (!Number.isFinite(length) || length === 0) {
        throw new TileConversionError(
          'POINT_CLOUD_NORMAL_INVALID',
          'Spatial point normals must be finite and nonzero'
        );
      }
      normals.set(
        normal.map(value => value / length),
        index
      );
    }
  }
  const transformed = await options.spatialContext.transformGeometryAsync(
    sourcePositions,
    normals,
    options.normalReferenceFrame
  );
  options.signal?.throwIfAborted();
  if (transformed.positions.length !== sourcePositions.length) {
    throw new TileConversionError(
      'POINT_CLOUD_POSITION_INVALID',
      'Spatial conversion must return one xyz triple per point'
    );
  }
  const minimum = [Infinity, Infinity, Infinity];
  const maximum = [-Infinity, -Infinity, -Infinity];
  for (let index = 0; index < transformed.positions.length; index++) {
    const value = transformed.positions[index];
    if (!Number.isFinite(value)) {
      throw new TileConversionError(
        'POINT_CLOUD_POSITION_INVALID',
        'Transformed point positions must be finite'
      );
    }
    const axis = index % 3;
    minimum[axis] = Math.min(minimum[axis], value);
    maximum[axis] = Math.max(maximum[axis], value);
  }
  const center = minimum.map((value, axis) => value / 2 + maximum[axis] / 2);
  const targetFrame =
    reference.status === 'native'
      ? sourceFrame
      : getSpatialCoordinateFrame(reference.targetCrs || reference.sourceCrs!);
  const targetIsGeographic = targetFrame === 'geographic';
  const attributes = {
    ...mesh.attributes,
    POSITION: {value: transformed.positions, size: 3},
    ...(transformed.normals ? {NORMAL: {value: transformed.normals, size: 3}} : {})
  };
  return {
    header: sourceTile.header,
    content: {
      ...content,
      data: makeMeshArrowTable(attributes, {
        topology: 'point-list',
        boundingBox: [minimum, maximum],
        schema: mesh.schema
          ? {
              ...mesh.schema,
              metadata: {
                ...mesh.schema.metadata,
                topology: 'point-list',
                boundingBox: JSON.stringify([minimum, maximum])
              },
              fields: mesh.schema.fields.map(field =>
                field.name === 'POSITION' || (transformed.normals && field.name === 'NORMAL')
                  ? {...field, metadata: {}}
                  : field
              )
            }
          : undefined
      }),
      coordinateSystem: targetIsGeographic ? 'lnglat' : 'cartesian',
      cartographicOrigin: [0, 0, 0],
      modelMatrix: undefined,
      spatialReference: reference,
      spatialBoundingVolume: {
        cartographicBounds: [minimum, maximum],
        coordinateFrame: targetIsGeographic ? 'geographic' : 'cartesian',
        center,
        radius: Math.hypot(...maximum.map((value, axis) => value - center[axis]))
      }
    }
  };
}
