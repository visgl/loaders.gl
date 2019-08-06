// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

/* eslint-disable */
import {Vector3, Matrix3, Matrix4, degrees} from 'math.gl';
import {BoundingSphere, OrientedBoundingBox} from '@math.gl/culling';
import {Ellipsoid} from '@math.gl/geospatial';
import assert from '../../utils/assert';

const defined = x => x !== undefined;

const scratchMatrix = new Matrix3();
const scratchScale = new Vector3();
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
  assert(boundingVolumeHeader, '3D Tile: boundingVolume must be defined');
  if (boundingVolumeHeader.box) {
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

    const centerInCartesian = Ellipsoid.WGS84.cartographicToCartesian(center, scratchCenter);

    const northWest = Ellipsoid.WGS84.cartographicToCartesian([north, west, 0]);
    const northEast = Ellipsoid.WGS84.cartographicToCartesian([north, east, 0]);
    const southWest = Ellipsoid.WGS84.cartographicToCartesian([south, west, 0]);
    const radius =
      (Math.abs(northEast[0] - northWest[0]) + Math.abs(southWest[1] - northWest[1])) * 8;

    // TODO fix region boundingVolume
    // for now, create a fake big sphere as the boundingVolume
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
  const center = new Vector3(box[0], box[1], box[2]);
  let halfAxes = new Matrix3(box.slice(3, box.length));

  transform.transform(center, center);

  halfAxes = new Matrix3(
    transform[0],
    transform[1],
    transform[2],
    transform[4],
    transform[5],
    transform[6],
    transform[8],
    transform[9],
    transform[10]
  ).multiplyRight(halfAxes);

  if (defined(result)) {
    result.center = center;
    result.halfAxes = halfAxes;
    return result;
  }

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

function createSphere(sphere, transform, result = new BoundingSphere()) {
  // Find the transformed center
  const center = new Vector3().from(sphere);
  transform.transform(center, center);

  // Scale the radius
  const scale = transform.getScale(scratchScale);
  const uniformScale = Math.max(scale[0], scale[1], scale[2]);
  const radius = sphere[3] * uniformScale;

  result.center = center;
  result.radius = radius;
  return result;
}

export function getMercatorZoom(boundingVolume) {
  const WGS84_RADIUS_X = Ellipsoid.WGS84.radii[0];
  const WGS84_RADIUS_Y = Ellipsoid.WGS84.radii[1];
  const WGS84_RADIUS_Z = Ellipsoid.WGS84.radii[2];

  // OrientedBoundingBox
  if (boundingVolume instanceof OrientedBoundingBox) {
    const {halfAxes} = boundingVolume;
    const [x, , , , y, , , , z] = halfAxes;

    const zoomX = Math.log2(WGS84_RADIUS_X / x / 2);
    const zoomY = Math.log2(WGS84_RADIUS_Y / y / 2);
    const zoomZ = Math.log2(WGS84_RADIUS_Z / z / 2);
    return (zoomX + zoomY + zoomZ) / 3;
  }

  // BoundingSphere
  if (boundingVolume instanceof BoundingSphere) {
    const {radius} = boundingVolume;
    return Math.log2(WGS84_RADIUS_Z / radius);
  }

  // BoundingRectangle
  // if (boundingVolume instanceof BoundingRectangle)
  const {width, height} = boundingVolume;
  if (width && height) {
    const zoomX = Math.log2(WGS84_RADIUS_X / width);
    const zoomY = Math.log2(WGS84_RADIUS_Y / height);
    return (zoomX + zoomY) / 2;
  }

  console.warn('Unknown bounding volume');
  return 18;
}
