// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

/* eslint-disable */
import {Vector3, Matrix3, Matrix4, degrees} from '@math.gl/core';
import {BoundingSphere, OrientedBoundingBox} from '@math.gl/culling';
import {Ellipsoid} from '@math.gl/geospatial';
import {assert} from '@loaders.gl/loader-utils';

// const scratchProjectedBoundingSphere = new BoundingSphere();

function defined(x) {
  return x !== undefined && x !== null;
}

// const scratchMatrix = new Matrix3();
const scratchScale = new Vector3();
const scratchNorthWest = new Vector3();
const scratchSouthEast = new Vector3();
// const scratchRectangle = new Rectangle();
// const scratchOrientedBoundingBox = new OrientedBoundingBox();
const scratchTransform = new Matrix4();

/**
 * Create a bounding volume from the tile's bounding volume header.
 * @param {Object} boundingVolumeHeader The tile's bounding volume header.
 * @param {Matrix4} transform The transform to apply to the bounding volume.
 * @param [result] The object onto which to store the result.
 * @returns The modified result parameter or a new TileBoundingVolume instance if none was provided.
 */
export function createBoundingVolume(boundingVolumeHeader, transform, result) {
  assert(boundingVolumeHeader, '3D Tile: boundingVolume must be defined');

  // boundingVolume schema:
  // https://github.com/AnalyticalGraphicsInc/3d-tiles/blob/master/specification/schema/boundingVolume.schema.json
  if (boundingVolumeHeader.box) {
    return createBox(boundingVolumeHeader.box, transform, result);
  }
  if (boundingVolumeHeader.region) {
    // [west, south, east, north, minimum height, maximum height]
    // Latitudes and longitudes are in the WGS 84 datum as defined in EPSG 4979 and are in radians.
    // Heights are in meters above (or below) the WGS 84 ellipsoid.
    const [west, south, east, north, minHeight, maxHeight] = boundingVolumeHeader.region;

    const northWest = Ellipsoid.WGS84.cartographicToCartesian(
      [degrees(west), degrees(north), minHeight],
      scratchNorthWest
    );
    const southEast = Ellipsoid.WGS84.cartographicToCartesian(
      [degrees(east), degrees(south), maxHeight],
      scratchSouthEast
    );
    const centerInCartesian = new Vector3().addVectors(northWest, southEast).multiplyScalar(0.5);
    const radius = new Vector3().subVectors(northWest, southEast).len() / 2.0;

    // TODO improve region boundingVolume
    // for now, create a sphere as the boundingVolume instead of box
    return createSphere(
      [centerInCartesian[0], centerInCartesian[1], centerInCartesian[2], radius],
      new Matrix4()
    );
  }

  if (boundingVolumeHeader.sphere) {
    return createSphere(boundingVolumeHeader.sphere, transform, result);
  }

  throw new Error('3D Tile: boundingVolume must contain a sphere, region, or box');
}

function createBox(box, transform, result) {
  // box: An array of 12 numbers that define an oriented bounding box.
  // The first three elements define the x, y, and z values for the center of the box.
  // The next three elements (with indices 3, 4, and 5) define the x axis direction and half-length.
  // The next three elements (indices 6, 7, and 8) define the y axis direction and half-length.
  // The last three elements (indices 9, 10, and 11) define the z axis direction and half-length.
  const center = new Vector3(box[0], box[1], box[2]);
  transform.transform(center, center);

  const xAxis = transform.transformAsVector(box.slice(3, 6));
  const yAxis = transform.transformAsVector(box.slice(6, 9));
  const zAxis = transform.transformAsVector(box.slice(9, 12));
  const halfAxes = new Matrix3([
    xAxis[0],
    xAxis[1],
    xAxis[2],
    yAxis[0],
    yAxis[1],
    yAxis[2],
    zAxis[0],
    zAxis[1],
    zAxis[2]
  ]);

  if (defined(result)) {
    result.center = center;
    result.halfAxes = halfAxes;
    return result;
  }

  return new OrientedBoundingBox(center, halfAxes);
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

function createSphere(sphere, transform, result) {
  // Find the transformed center
  const center = new Vector3(sphere[0], sphere[1], sphere[2]);
  transform.transform(center, center);
  const scale = transform.getScale(scratchScale);

  const uniformScale = Math.max(Math.max(scale[0], scale[1]), scale[2]);
  const radius = sphere[3] * uniformScale;

  if (defined(result)) {
    result.center = center;
    result.radius = radius;
    return result;
  }

  return new BoundingSphere(center, radius);
}
