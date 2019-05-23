/* eslint-disable */
import {Vector3} from 'math.gl';
import MathUtils from './math-utils';
import * as vec3 from 'gl-matrix/vec3';

const scaleToGeodeticSurfaceIntersection = new Vector3();
const scaleToGeodeticSurfaceGradient = new Vector3();

/**
 * Scales the provided Cartesian position along the geodetic surface normal
 * so that it is on the surface of this ellipsoid.  If the position is
 * at the center of the ellipsoid, this function returns undefined.
 *
 * @param {Vector3} cartesian The Cartesian position to scale.
 * @param {Vector3} oneOverRadii One over radii of the ellipsoid.
 * @param {Vector3} oneOverRadiiSquared One over radii squared of the ellipsoid.
 * @param {Number} centerToleranceSquared Tolerance for closeness to the center.
 * @param {Vector3} [result] The object onto which to store the result.
 * @returns {Vector3} The modified result parameter, a new Vector3 instance if none was provided, or undefined if the position is at the center.
 *
 * @exports scaleToGeodeticSurface
 *
 * @private
 */
export default function scaleToGeodeticSurface(cartesian, ellipsoid, result = [0, 0, 0]) {
  const {oneOverRadii, oneOverRadiiSquared, centerToleranceSquared} = ellipsoid;
  const positionX = cartesian.x || 0;
  const positionY = cartesian.y || 0;
  const positionZ = cartesian.z || 0;

  const oneOverRadiiX = oneOverRadii.x || 0;
  const oneOverRadiiY = oneOverRadii.y || 0;
  const oneOverRadiiZ = oneOverRadii.z || 0;

  const x2 = positionX * positionX * oneOverRadiiX * oneOverRadiiX;
  const y2 = positionY * positionY * oneOverRadiiY * oneOverRadiiY;
  const z2 = positionZ * positionZ * oneOverRadiiZ * oneOverRadiiZ;

  // Compute the squared ellipsoid norm.
  const squaredNorm = x2 + y2 + z2;
  const ratio = Math.sqrt(1.0 / squaredNorm);

  if (!Number.isFinite(ratio)) {
    return undefined;
  }

  // As an initial approximation, assume that the radial intersection is the projection point.
  const intersection = new Vector3();
  intersection.copy(cartesian).scale(ratio);

  // If the position is near the center, the iteration will not converge.
  if (squaredNorm < centerToleranceSquared) {
    return intersection;
  }

  const oneOverRadiiSquaredX = oneOverRadiiSquared.x || 0;
  const oneOverRadiiSquaredY = oneOverRadiiSquared.y || 0;
  const oneOverRadiiSquaredZ = oneOverRadiiSquared.z || 0;

  // Use the gradient at the intersection point in place of the true unit normal.
  // The difference in magnitude will be absorbed in the multiplier.
  const gradient = new Vector3();
  gradient.x = intersection.x * oneOverRadiiSquaredX * 2.0;
  gradient.y = intersection.y * oneOverRadiiSquaredY * 2.0;
  gradient.z = intersection.z * oneOverRadiiSquaredZ * 2.0;

  // Compute the initial guess at the normal vector multiplier, lambda.
  let lambda = ((1.0 - ratio) * vec3.length(cartesian)) / (0.5 * vec3.length(gradient));
  let correction = 0.0;

  let func;
  let denominator;
  let xMultiplier;
  let yMultiplier;
  let zMultiplier;
  let xMultiplier2;
  let yMultiplier2;
  let zMultiplier2;
  let xMultiplier3;
  let yMultiplier3;
  let zMultiplier3;

  do {
    lambda -= correction;

    xMultiplier = 1.0 / (1.0 + lambda * oneOverRadiiSquaredX);
    yMultiplier = 1.0 / (1.0 + lambda * oneOverRadiiSquaredY);
    zMultiplier = 1.0 / (1.0 + lambda * oneOverRadiiSquaredZ);

    xMultiplier2 = xMultiplier * xMultiplier;
    yMultiplier2 = yMultiplier * yMultiplier;
    zMultiplier2 = zMultiplier * zMultiplier;

    xMultiplier3 = xMultiplier2 * xMultiplier;
    yMultiplier3 = yMultiplier2 * yMultiplier;
    zMultiplier3 = zMultiplier2 * zMultiplier;

    func = x2 * xMultiplier2 + y2 * yMultiplier2 + z2 * zMultiplier2 - 1.0;

    // "denominator" here refers to the use of this expression in the velocity and acceleration
    // computations in the sections to follow.
    denominator =
      x2 * xMultiplier3 * oneOverRadiiSquaredX +
      y2 * yMultiplier3 * oneOverRadiiSquaredY +
      z2 * zMultiplier3 * oneOverRadiiSquaredZ;

    const derivative = -2.0 * denominator;

    correction = func / derivative;
  } while (Math.abs(func) > MathUtils.EPSILON12);

  result.x = positionX * xMultiplier;
  result.y = positionY * yMultiplier;
  result.z = positionZ * zMultiplier;
  return result;
}
