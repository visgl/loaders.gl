// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

/* eslint-disable */
import {Vector3, Matrix3, Matrix4, degrees} from 'math.gl';
import {BoundingSphere, OrientedBoundingBox} from '@math.gl/culling';
import {Ellipsoid} from '@math.gl/geospatial';
import assert from '../../utils/assert';

// const scratchProjectedBoundingSphere = new BoundingSphere();

const defined = x => x !== undefined;

const scratchMatrix = new Matrix3();
const scratchScale = new Vector3();
const scratchHalfAxes = new Matrix3();
const scratchCenter = new Vector3();
// const scratchRectangle = new Rectangle();
// const scratchOrientedBoundingBox = new OrientedBoundingBox();
const scratchTransform = new Matrix4();

/**
 * Create a bounding volume from the tile's bounding volume header.
 * @param {Object} boundingVolumeHeader The tile's bounding volume header.
 * @param {Matrix4} transform The transform to apply to the bounding volume.
 * @param {TileBoundingVolume} [result] The object onto which to store the result.
 * @returns {TileBoundingVolume} The modified result parameter or a new TileBoundingVolume instance if none was provided.
 */
export function createBoundingVolume(boundingVolumeHeader, transform, result) {
  result = result || {};
  assert(boundingVolumeHeader, '3D Tile: boundingVolume must be defined');
  if (boundingVolumeHeader.box) {
    // The first three elements define the x, y, and z values for the center of the box.
    // const [x, y, z] = boundingVolumeHeader.box;
    // let center = new Vector3(x, y, z);
    // center = new Matrix4(transform).transform(center);
    // center = Ellipsoid.WGS84.cartesianToCartographic(center, center);
    //
    // Object.assign(result, boundingVolumeHeader, {center});
    //
    // return result;
    return createBox(boundingVolumeHeader.box, transform, result);
  }
  if (boundingVolumeHeader.region) {
    // [west, south, east, north, minimum height, maximum height]
    // Latitudes and longitudes are in the WGS 84 datum as defined in EPSG 4979 and are in radians.
    // Heights are in meters above (or below) the WGS 84 ellipsoid.
    const [west, south, east, north, minHeight, maxHeight] = boundingVolumeHeader.region;

    const center = new Vector3(
      degrees((west + east) / 2),
      degrees((north + south) / 2),
      (minHeight + maxHeight) / 2
    );
    Object.assign(result, boundingVolumeHeader, {center});

    return result;
    // return createRegion(boundingVolumeHeader.region, transform, this._initialTransform, result);
  }
  if (boundingVolumeHeader.sphere) {
    // The first three elements define the x, y, and z values for the center of the sphere in a right-handed 3-axis (x, y, z)
    const [x, y, z] = boundingVolumeHeader.sphere;
    let center = new Vector3(x, y, z);

    center = new Matrix4(transform).transform(center);
    center = Ellipsoid.WGS84.cartesianToCartographic(center, center);

    Object.assign(result, boundingVolumeHeader, {center});

    return result;
    // return createSphere(boundingVolumeHeader.sphere, transform, result);
  }
  throw new Error('3D Tile: boundingVolume must contain a sphere, region, or box');
}

function createBox(box, transform, result) {
  // return null;

  // const halfAxes = new Matrix3(); // Matrix3.fromArray(box, 3, scratchHalfAxes);

  // Find the transformed center and halfAxes
  // center = Matrix4.multiplyByPoint(transform, center, center);

  // Need to do halfAxes = transform3x3 * halfAxes
  // const rotationScale = Matrix4.getRotation(transform, scratchMatrix);
  // halfAxes = Matrix3.multiply(rotationScale, halfAxes, halfAxes);

  // if (defined(result)) {
  //   result.update(center, halfAxes);
  //   return result;
  // }

  const center = new Vector3(box[0], box[1], box[2]);
  let halfAxes = new Matrix3(box.slice(3, box.length));

  transform.transformPoint(center, center); // (in, out), transformVector and Point have been removed in 3.0?

  halfAxes = new Matrix3(
    transform[0], transform[1], transform[2],
    transform[4], transform[5], transform[6],
    transform[8], transform[9], transform[10]
  ).multiplyRight(halfAxes);

  return new OrientedBoundingBox(center, halfAxes);
}

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

function createSphere(sphere, transform, result) {
  const center = Vector3.fromElements(sphere[0], sphere[1], sphere[2], scratchCenter);
  const radius = sphere[3];

  // Find the transformed center and radius
  center = Matrix4.multiplyByPoint(transform, center, center);
  const scale = Matrix4.getScale(transform, scratchScale);
  const uniformScale = Vector3.maximumComponent(scale);
  radius *= uniformScale;

  if (defined(result)) {
    result.update(center, radius);
    return result;
  }
  return new TileBoundingSphere(center, radius);
}
