import type {BoundingVolumes, FullExtent, Mbs, Obb} from '@loaders.gl/i3s';

import {Matrix3, Quaternion, Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {
  OrientedBoundingBox,
  makeOrientedBoundingBoxFromPoints,
  makeBoundingSphereFromPoints,
  BoundingSphere
} from '@math.gl/culling';
import {Tile3D} from '@loaders.gl/tiles';
import {Geoid} from '@math.gl/geoid';

/**
 * Create bounding volumes object from tile and geoid height model.
 * @param tile
 * @param geoidHeightModel
 * @returns - Bounding volumes object
 */
export function createBoundingVolumes(tile: Tile3D, geoidHeightModel: Geoid): BoundingVolumes {
  let radius;
  let halfSize;
  let quaternion;

  const boundingVolume = tile.boundingVolume;
  const cartographicCenter = Ellipsoid.WGS84.cartesianToCartographic(
    boundingVolume.center,
    new Vector3()
  );
  cartographicCenter[2] =
    cartographicCenter[2] -
    geoidHeightModel.getHeight(cartographicCenter[1], cartographicCenter[0]);
  if (boundingVolume instanceof OrientedBoundingBox) {
    halfSize = boundingVolume.halfSize;
    radius = new Vector3(halfSize[0], halfSize[1], halfSize[2]).len();
    quaternion = boundingVolume.quaternion;
  } else {
    radius = tile.boundingVolume.radius;
    halfSize = [radius, radius, radius];
    quaternion = new Quaternion()
      .fromMatrix3(new Matrix3([halfSize[0], 0, 0, 0, halfSize[1], 0, 0, 0, halfSize[2]]))
      .normalize();
  }

  return {
    mbs: [cartographicCenter[0], cartographicCenter[1], cartographicCenter[2], radius],
    obb: {
      center: [cartographicCenter[0], cartographicCenter[1], cartographicCenter[2]],
      halfSize,
      quaternion
    }
  };
}

/**
 * Generates bounding volumes from geometry positions
 * @param cartesianPositions
 * @param geoidHeightModel
 */
export function createBoundingVolumesFromGeometry(
  cartesianPositions: Float32Array,
  geoidHeightModel: Geoid
): {mbs: Mbs; obb: Obb} {
  const positionVectors = convertPositionsToVectors(cartesianPositions);

  const geometryObb = makeOrientedBoundingBoxFromPoints(positionVectors);
  const geometryMbs = makeBoundingSphereFromPoints(positionVectors);

  let mbsCenter = Ellipsoid.WGS84.cartesianToCartographic(geometryMbs.center, new Vector3());
  let obbCenter = Ellipsoid.WGS84.cartesianToCartographic(geometryObb.center, new Vector3());

  mbsCenter[2] = mbsCenter[2] - geoidHeightModel.getHeight(mbsCenter[1], mbsCenter[0]);
  obbCenter[2] = obbCenter[2] - geoidHeightModel.getHeight(obbCenter[1], obbCenter[0]);

  return {
    mbs: [mbsCenter[0], mbsCenter[1], mbsCenter[2], geometryMbs.radius],
    obb: {
      center: obbCenter,
      halfSize: geometryObb.halfSize,
      quaternion: geometryObb.quaternion
    }
  };
}

/**
 * Create array of posisitons where each vertex is vector
 * @param {array} positions
 * @returns {Vector3[]}
 */
export function convertPositionsToVectors(positions: Float32Array): Vector3[] {
  const result: Vector3[] = [];

  for (let i = 0; i < positions.length; i += 3) {
    // TODO: (perf) new Vector3 is not optimal but required in `makeOrientedBoundingBoxFromPoints`.
    // modify `makeOrientedBoundingBoxFromPoints` to use scratch vectors
    const positionVector = new Vector3([positions[i], positions[i + 1], positions[i + 2]]);
    result.push(positionVector);
  }

  return result;
}

/**
 * Convert common coordinate to fullExtent https://github.com/Esri/i3s-spec/blob/master/docs/1.8/fullExtent.cmn.md
 * @param
 * @param boundingVolume
 * @returns - fullExtent object
 */
export function convertBoundingVolumeToI3SFullExtent(
  boundingVolume: OrientedBoundingBox | BoundingSphere
): FullExtent {
  let sphere: BoundingSphere;
  if (boundingVolume instanceof BoundingSphere) {
    sphere = boundingVolume;
  } else {
    sphere = boundingVolume.getBoundingSphere();
  }
  const center: Vector3 = sphere.center;
  const radius: number = sphere.radius;
  const vertexMax = Ellipsoid.WGS84.cartesianToCartographic(
    new Vector3(center[0] + radius, center[1] + radius, center[2] + radius),
    new Vector3()
  );
  const vertexMin = Ellipsoid.WGS84.cartesianToCartographic(
    new Vector3(center[0] - radius, center[1] - radius, center[2] - radius),
    new Vector3()
  );

  return {
    xmin: vertexMin[0],
    xmax: vertexMax[0],
    ymin: vertexMin[1],
    ymax: vertexMax[1],
    zmin: vertexMin[2],
    zmax: vertexMax[2]
  };
}

/**
 * Creates oriented boundinb box from mbs.
 * @param mbs - Minimum Bounding Sphere
 * @returns - Oriented BOunding Box
 */
export function createObbFromMbs(mbs: Mbs): Obb {
  const radius = mbs[3];
  const center = new Vector3(mbs[0], mbs[1], mbs[2]);
  const halfAxex = new Matrix3([radius, 0, 0, 0, radius, 0, 0, 0, radius]);
  return new OrientedBoundingBox(center, halfAxex);
}
