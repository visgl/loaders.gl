// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

/* eslint-disable */
import {Vector3, Matrix3, Matrix4} from '@math.gl/core';
import {assert} from '@loaders.gl/loader-utils';
import * as mat4 from 'gl-matrix/mat4';

const scratchVector = new Vector3();
const transformScratchVectorU = new Vector3();
const transformScratchVectorV = new Vector3();
const transformScratchVectorW = new Vector3();

/**
 * Applies a 4x4 affine transformation matrix to a bounding sphere.
 *
 * @param obj The bounding sphere to apply the transformation to.
 * @param transform The transformation matrix to apply to the bounding sphere.
 * @returns itself, i.e. the modified BoundingSphere.
 */
function transformBoundingSphere(obj, transform) {
  obj.center.transform(transform);
  const scale = mat4.getScaling(scratchVector, transform);
  obj.radius = Math.max(scale[0], Math.max(scale[1], scale[2])) * obj.radius;

  return obj;
}

/**
 * Applies a 4x4 affine transformation matrix to a oriented bounding box.
 *
 * @param obj The bounding sphere to apply the transformation to.
 * @param transform The transformation matrix to apply to the bounding sphere.
 * @returns itself, i.e. the modified OrientedBoundingBox.
 */
function transformOrientedBoundingBox(obj, transformation) {
  obj.center.transformAsPoint(transformation);
  const xAxis = obj.halfAxes.getColumn(0, transformScratchVectorU);
  xAxis.transformAsVector(transformation);

  const yAxis = obj.halfAxes.getColumn(1, transformScratchVectorV);
  yAxis.transformAsVector(transformation);

  const zAxis = obj.halfAxes.getColumn(2, transformScratchVectorW);
  zAxis.transformAsVector(transformation);
  obj.halfAxes = new Matrix3([...xAxis, ...yAxis, ...zAxis]);

  return obj;
}

/**
 * Create a bounding volume from the tile's bounding volume header.
 * @param {Object} boundingVolumeHeader The tile's bounding volume header.
 * @param {Matrix4} transform The transform to apply to the bounding volume.
 * @param [result] The object onto which to store the result.
 * @returns The modified result parameter or a new TileBoundingVolume instance if none was provided.
 */
export function transformBoundingVolume(boundingVolumeHeader, transform, result) {
  assert(boundingVolumeHeader, '3D Tile: boundingVolume must be defined');

  const {box, region, sphere} = boundingVolumeHeader;
  // boundingVolume schema:
  // https://github.com/AnalyticalGraphicsInc/3d-tiles/blob/master/specification/schema/boundingVolume.schema.json

  switch (true) {
    case box != void 0:
      return transformOrientedBoundingBox(box.clone(), transform);
    //return box.clone().transform(transform);

    case region != void 0:
      return transformBoundingSphere(region.clone(), new Matrix4());
    //return region.clone().transform(new Matrix4());

    case sphere != void 0:
      return transformBoundingSphere(sphere.clone(), transform);
    //return sphere.clone().transform(transform);

    default:
      new Error('3D Tile: boundingVolume must contain a sphere, region, or box');
      break;
  }
}

/*
function createBoxFromTransformedRegion(region, transform, initialTransform, result) {
  const rectangle = Rectangle.unpack(region, 0, scratchRectangle);
  const minimumHeight = region[4];
  const maximumHeight = region[5];

  const orientedBoundingBox = OrientedBoundingBox.fromRectangle(
    rectangle,
    minimumHeight,
    maximumHeight,
    Ellipsoid.WGS84,
    scratchOrientedBoundingBox
  );
  const center = orientedBoundingBox.center;
  const halfAxes = orientedBoundingBox.halfAxes;

  // A region bounding volume is not transformed by the transform in the tileset JSON,
  // but may be transformed by additional transforms applied in Cesium.
  // This is why the transform is calculated as the difference between the initial transform and the current transform.
  transform = Matrix4.multiplyTransformation(
    transform,
    Matrix4.inverseTransformation(initialTransform, scratchTransform),
    scratchTransform
  );
  center = Matrix4.multiplyByPoint(transform, center, center);
  const rotationScale = Matrix4.getRotation(transform, scratchMatrix);
  halfAxes = Matrix3.multiply(rotationScale, halfAxes, halfAxes);

  if (defined(result) && result instanceof TileOrientedBoundingBox) {
    result.update(center, halfAxes);
    return result;
  }

  return new TileOrientedBoundingBox(center, halfAxes);
}

function createRegion(region, transform, initialTransform, result) {
  if (!Matrix4.equalsEpsilon(transform, initialTransform, CesiumMath.EPSILON8)) {
    return createBoxFromTransformedRegion(region, transform, initialTransform, result);
  }

  if (defined(result)) {
    return result;
  }

  const rectangleRegion = Rectangle.unpack(region, 0, scratchRectangle);

  return new TileBoundingRegion({
    rectangle: rectangleRegion,
    minimumHeight: region[4],
    maximumHeight: region[5]
  });
}
*/
