// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

/* eslint-disable */
import {Quaternion, Vector3, Matrix3, Matrix4, degrees} from '@math.gl/core';
import {BoundingSphere, OrientedBoundingBox} from '@math.gl/culling';
import {Ellipsoid} from '@math.gl/geospatial';
import {assert} from '@loaders.gl/loader-utils';

// const scratchProjectedBoundingSphere = new BoundingSphere();

function defined(x) {
  return x !== undefined && x !== null;
}

// const scratchMatrix = new Matrix3();
const scratchPoint = new Vector3();
const scratchScale = new Vector3();
const scratchNorthWest = new Vector3();
const scratchSouthEast = new Vector3();
const scratchCenter = new Vector3();
const scratchXAxis = new Vector3();
const scratchYAxis = new Vector3();
const scratchZAxis = new Vector3();
// const scratchRectangle = new Rectangle();
// const scratchOrientedBoundingBox = new OrientedBoundingBox();
// const scratchTransform = new Matrix4();

/**
 * Create a bounding volume from the tile's bounding volume header.
 * @param {Object} boundingVolumeHeader The tile's bounding volume header.
 * @param {Matrix4} transform The transform to apply to the bounding volume.
 * @param [result] The object onto which to store the result.
 * @returns The modified result parameter or a new TileBoundingVolume instance if none was provided.
 */
export function createBoundingVolume(boundingVolumeHeader, transform, result?) {
  assert(boundingVolumeHeader, '3D Tile: boundingVolume must be defined');

  // boundingVolume schema:
  // https://github.com/AnalyticalGraphicsInc/3d-tiles/blob/master/specification/schema/boundingVolume.schema.json
  if (boundingVolumeHeader.box) {
    return createBox(boundingVolumeHeader.box, transform, result);
  }
  if (boundingVolumeHeader.region) {
    return createObbFromRegion(boundingVolumeHeader.region);
  }

  if (boundingVolumeHeader.sphere) {
    return createSphere(boundingVolumeHeader.sphere, transform, result);
  }

  throw new Error('3D Tile: boundingVolume must contain a sphere, region, or box');
}

/** [min, max] each in [longitude, latitude, altitude] */
export type CartographicBounds = [min: number[], max: number[]];

/**
 * Calculate the cartographic bounding box the tile's bounding volume.
 * @param {Object} boundingVolumeHeader The tile's bounding volume header.
 * @param {BoundingVolume} boundingVolume The bounding volume.
 * @returns {CartographicBounds}
 */
export function getCartographicBounds(
  boundingVolumeHeader,
  boundingVolume: OrientedBoundingBox | BoundingSphere
): CartographicBounds {
  // boundingVolume schema:
  // https://github.com/AnalyticalGraphicsInc/3d-tiles/blob/master/specification/schema/boundingVolume.schema.json
  if (boundingVolumeHeader.box) {
    return orientedBoundingBoxToCartographicBounds(boundingVolume as OrientedBoundingBox);
  }
  if (boundingVolumeHeader.region) {
    // [west, south, east, north, minimum height, maximum height]
    // Latitudes and longitudes are in the WGS 84 datum as defined in EPSG 4979 and are in radians.
    // Heights are in meters above (or below) the WGS 84 ellipsoid.
    const [west, south, east, north, minHeight, maxHeight] = boundingVolumeHeader.region;

    return [
      [degrees(west), degrees(south), minHeight],
      [degrees(east), degrees(north), maxHeight]
    ];
  }

  if (boundingVolumeHeader.sphere) {
    return boundingSphereToCartographicBounds(boundingVolume as BoundingSphere);
  }

  throw new Error('Unkown boundingVolume type');
}

function createBox(box, transform, result?) {
  // https://math.gl/modules/culling/docs/api-reference/oriented-bounding-box
  // 1. A half-axes based representation.
  // box: An array of 12 numbers that define an oriented bounding box.
  // The first three elements define the x, y, and z values for the center of the box.
  // The next three elements (with indices 3, 4, and 5) define the x axis direction and half-length.
  // The next three elements (indices 6, 7, and 8) define the y axis direction and half-length.
  // The last three elements (indices 9, 10, and 11) define the z axis direction and half-length.
  // 2. A half-size-quaternion based representation.
  // box: An array of 10 numbers that define an oriented bounding box.
  // The first three elements define the x, y, and z values for the center of the box in a right-handed 3-axis (x, y, z) Cartesian coordinate system where the z-axis is up.
  // The next three elements (with indices 3, 4, and 5) define the halfSize.
  // The last four elements (indices 6, 7, 8 and 10) define the quaternion.
  const center = new Vector3(box[0], box[1], box[2]);
  transform.transform(center, center);
  let origin: number[] = [];
  if (box.length === 10) {
    const halfSize = box.slice(3, 6);
    const quaternion = new Quaternion();
    quaternion.fromArray(box, 6);
    const x = new Vector3([1, 0, 0]);
    const y = new Vector3([0, 1, 0]);
    const z = new Vector3([0, 0, 1]);
    x.transformByQuaternion(quaternion);
    x.scale(halfSize[0]);
    y.transformByQuaternion(quaternion);
    y.scale(halfSize[1]);
    z.transformByQuaternion(quaternion);
    z.scale(halfSize[2]);
    origin = [...x.toArray(), ...y.toArray(), ...z.toArray()];
  } else {
    origin = [...box.slice(3, 6), ...box.slice(6, 9), ...box.slice(9, 12)];
  }
  const xAxis = transform.transformAsVector(origin.slice(0, 3));
  const yAxis = transform.transformAsVector(origin.slice(3, 6));
  const zAxis = transform.transformAsVector(origin.slice(6, 9));
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

function createSphere(sphere, transform, result?) {
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

/**
 * Create OrientedBoundingBox instance from region 3D tiles bounding volume
 * @param region - region 3D tiles bounding volume
 * @returns OrientedBoundingBox instance
 */
function createObbFromRegion(region: number[]): OrientedBoundingBox {
  // [west, south, east, north, minimum height, maximum height]
  // Latitudes and longitudes are in the WGS 84 datum as defined in EPSG 4979 and are in radians.
  // Heights are in meters above (or below) the WGS 84 ellipsoid.
  const [west, south, east, north, minHeight, maxHeight] = region;

  const northWest = Ellipsoid.WGS84.cartographicToCartesian(
    [degrees(west), degrees(north), minHeight],
    scratchNorthWest
  );
  const southEast = Ellipsoid.WGS84.cartographicToCartesian(
    [degrees(east), degrees(south), maxHeight],
    scratchSouthEast
  );
  const centerInCartesian = new Vector3().addVectors(northWest, southEast).multiplyByScalar(0.5);
  Ellipsoid.WGS84.cartesianToCartographic(centerInCartesian, scratchCenter);

  Ellipsoid.WGS84.cartographicToCartesian(
    [degrees(east), scratchCenter[1], scratchCenter[2]],
    scratchXAxis
  );
  Ellipsoid.WGS84.cartographicToCartesian(
    [scratchCenter[0], degrees(north), scratchCenter[2]],
    scratchYAxis
  );
  Ellipsoid.WGS84.cartographicToCartesian(
    [scratchCenter[0], scratchCenter[1], maxHeight],
    scratchZAxis
  );

  return createBox(
    [
      ...centerInCartesian,
      ...scratchXAxis.subtract(centerInCartesian),
      ...scratchYAxis.subtract(centerInCartesian),
      ...scratchZAxis.subtract(centerInCartesian)
    ],
    new Matrix4()
  );
}

/**
 * Convert a bounding volume defined by OrientedBoundingBox to cartographic bounds
 * @returns {CartographicBounds}
 */
function orientedBoundingBoxToCartographicBounds(
  boundingVolume: OrientedBoundingBox
): CartographicBounds {
  const result = emptyCartographicBounds();

  const {halfAxes} = boundingVolume as OrientedBoundingBox;
  const xAxis = new Vector3(halfAxes.getColumn(0));
  const yAxis = new Vector3(halfAxes.getColumn(1));
  const zAxis = new Vector3(halfAxes.getColumn(2));

  // Test all 8 corners of the box
  for (let x = 0; x < 2; x++) {
    for (let y = 0; y < 2; y++) {
      for (let z = 0; z < 2; z++) {
        scratchPoint.copy(boundingVolume.center);
        scratchPoint.add(xAxis);
        scratchPoint.add(yAxis);
        scratchPoint.add(zAxis);

        addToCartographicBounds(result, scratchPoint);
        zAxis.negate();
      }
      yAxis.negate();
    }
    xAxis.negate();
  }
  return result;
}

/**
 * Convert a bounding volume defined by BoundingSphere to cartographic bounds
 * @returns {CartographicBounds}
 */
function boundingSphereToCartographicBounds(boundingVolume: BoundingSphere): CartographicBounds {
  const result = emptyCartographicBounds();

  const {center, radius} = boundingVolume as BoundingSphere;
  const point = Ellipsoid.WGS84.scaleToGeodeticSurface(center, scratchPoint);

  let zAxis: Vector3;
  if (point) {
    zAxis = Ellipsoid.WGS84.geodeticSurfaceNormal(point) as Vector3;
  } else {
    zAxis = new Vector3(0, 0, 1);
  }
  let xAxis = new Vector3(zAxis[2], -zAxis[1], 0);
  if (xAxis.len() > 0) {
    xAxis.normalize();
  } else {
    xAxis = new Vector3(0, 1, 0);
  }
  const yAxis = xAxis.clone().cross(zAxis);

  // Test 6 end points of the 3 axes
  for (const axis of [xAxis, yAxis, zAxis]) {
    scratchScale.copy(axis).scale(radius);
    for (let dir = 0; dir < 2; dir++) {
      scratchPoint.copy(center);
      scratchPoint.add(scratchScale);
      addToCartographicBounds(result, scratchPoint);
      // Flip the axis
      scratchScale.negate();
    }
  }
  return result;
}

/**
 * Create a new cartographic bounds that contains no points
 * @returns {CartographicBounds}
 */
function emptyCartographicBounds(): CartographicBounds {
  return [
    [Infinity, Infinity, Infinity],
    [-Infinity, -Infinity, -Infinity]
  ];
}

/**
 * Add a point to the target cartographic bounds
 * @param {CartographicBounds} target
 * @param {Vector3} cartesian coordinates of the point to add
 */
function addToCartographicBounds(target: CartographicBounds, cartesian: Readonly<Vector3>) {
  Ellipsoid.WGS84.cartesianToCartographic(cartesian, scratchPoint);
  target[0][0] = Math.min(target[0][0], scratchPoint[0]);
  target[0][1] = Math.min(target[0][1], scratchPoint[1]);
  target[0][2] = Math.min(target[0][2], scratchPoint[2]);

  target[1][0] = Math.max(target[1][0], scratchPoint[0]);
  target[1][1] = Math.max(target[1][1], scratchPoint[1]);
  target[1][2] = Math.max(target[1][2], scratchPoint[2]);
}
