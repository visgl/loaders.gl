import {getS2Polygon} from './s2-utils';
import {Vector3} from '@math.gl/core';
import {OrientedBoundingBox, makeOrientedBoundingBoxFromPoints} from '@math.gl/culling';

export type S2BoundingVolume = {
  token: string | number; // This can be an S2 key or token
  minimumHeight: number;
  maximumHeight: number;
};

/**
 * Converts S2BoundingVolume to OrientedBoundingBox
 * @param {S2BoundingVolume} s2bv - s2 bounding volume to convert
 * @param {OrientedBoundingBox} [result] Optional object onto which to store the result.
 * @returns The modified result parameter or a new `OrientedBoundingBox` instance if not provided.
 */
export function convertS2BVtoOBB(
  s2bv: S2BoundingVolume,
  result?: OrientedBoundingBox | undefined
): OrientedBoundingBox {
  const polygon = getS2Polygon(s2bv.token);

  const points: Vector3[] = [];
  if (polygon.length % 2 !== 0) {
    throw new Error('Invalid polygon');
  }
  const min: number = s2bv.minimumHeight;
  const max: number = s2bv.maximumHeight;
  for (let i = 0; i < polygon.length; i += 2) {
    const lng: number = polygon[i];
    const lat: number = polygon[i + 1];
    points.push(new Vector3(lng, lat, min));
    points.push(new Vector3(lng, lat, max));
  }

  // Passing result===null throws an exception from makeOrientedBoundingBoxFromPoints
  const obb: OrientedBoundingBox = makeOrientedBoundingBoxFromPoints(
    points,
    result !== null ? result : undefined
  );
  return obb;
}

//=============
// From /home/michael/ae/cesium/packages/engine/Source/Core/S2Cell.js

// /**
//  * Return the lowest-numbered bit that is on for this cell id
//  * @private
//  */
// function lsb(cellId) {
//   return cellId & (~cellId + BigInt(1)); // eslint-disable-line
// }

// /**
//  * Gets the child cell of the cell at the given index.
//  *
//  * @param {Number} index An integer index of the child.
//  * @returns {S2Cell} The child of the S2Cell.
//  * @private
//  */
// S2Cell.prototype.getChild = function (index) {
//   //>>includeStart('debug', pragmas.debug);
//   Check.typeOf.number("index", index);
//   if (index < 0 || index > 3) {
//     throw new DeveloperError("child index must be in the range [0-3].");
//   }
//   if (this._level === 30) {
//     throw new DeveloperError("cannot get child of leaf cell.");
//   }
//   //>>includeEnd('debug');

//   // Shift sentinel bit 2 positions to the right.
//   // eslint-disable-next-line no-undef
//   const newLsb = lsb(this._cellId) >> BigInt(2);
//   // Insert child index before the sentinel bit.
//   // eslint-disable-next-line no-undef
//   const childCellId = this._cellId + BigInt(2 * index + 1 - 4) * newLsb;
//   return new S2Cell(childCellId);
// };
