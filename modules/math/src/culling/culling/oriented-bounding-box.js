import {Vector3, Matrix3} from 'math.gl';
import {Intersect} from '../constants';

const scratchOffset = new Vector3();

const scratchVectorU = new Vector3();

const scratchVectorV = new Vector3();

const scratchVectorW = new Vector3();

const scratchPPrime = new Vector3();

const scratchCorner = new Vector3();

const scratchToCenter = new Vector3();

export default class OrientedBoundingBox {
  // An OrientedBoundingBox of some object is a closed and convex cuboid. It can provide a tighter bounding volume than {@link BoundingSphere} or {@link AxisAlignedBoundingBox} in many cases.
  constructor(center = [0, 0, 0], halfAxes = [0, 0, 0, 0, 0, 0, 0, 0, 0]) {
    this.center = new Vector3(center);
    this.halfAxes = new Matrix3(halfAxes);
  }

  // Duplicates a OrientedBoundingBox instance.
  clone(result) {
    return new OrientedBoundingBox(this.center, this.halfAxes);
  }

  // Compares the provided OrientedBoundingBox componentwise and returns
  equals(right) {
    return (
      this === right ||
      (right && this.center.equals(right.center) && this.halfAxes.equals(right.halfAxes))
    );
  }

  /**
   * Determines which side of a plane the oriented bounding box is located.
   *
   * @param {OrientedBoundingBox} box The oriented bounding box to test.
   * @param {Plane} plane The plane to test against.
   * @returns {Intersect} {@link Intersect.INSIDE} if the entire box is on the side of the plane the normal is pointing, {@link Intersect.OUTSIDE} if the entire box is on the opposite side, and {@link Intersect.INTERSECTING} if the box intersects the plane.
   */
  intersectPlane(plane) {
    const center = this.center;
    const normal = plane.normal;
    const halfAxes = this.halfAxes;
    const normalX = normal.x;
    const normalY = normal.y;
    const normalZ = normal.z;

    // Plane is used as if it is its normal; the first three components are assumed to be normalized
    const radEffective =
      Math.abs(
        normalX * halfAxes[Matrix3.COLUMN0ROW0] +
          normalY * halfAxes[Matrix3.COLUMN0ROW1] +
          normalZ * halfAxes[Matrix3.COLUMN0ROW2]
      ) +
      Math.abs(
        normalX * halfAxes[Matrix3.COLUMN1ROW0] +
          normalY * halfAxes[Matrix3.COLUMN1ROW1] +
          normalZ * halfAxes[Matrix3.COLUMN1ROW2]
      ) +
      Math.abs(
        normalX * halfAxes[Matrix3.COLUMN2ROW0] +
          normalY * halfAxes[Matrix3.COLUMN2ROW1] +
          normalZ * halfAxes[Matrix3.COLUMN2ROW2]
      );
    const distanceToPlane = Vector3.dot(normal, center) + plane.distance;

    if (distanceToPlane <= -radEffective) {
      // The entire box is on the negative side of the plane normal
      return Intersect.OUTSIDE;
    } else if (distanceToPlane >= radEffective) {
      // The entire box is on the positive side of the plane normal
      return Intersect.INSIDE;
    }
    return Intersect.INTERSECTING;
  }

  // Computes the estimated distance from the closest point on a bounding box to a point.
  distanceTo(point) {
    return Math.sqrt(this.distanceSquaredTo(point));
  }

  // Computes the estimated distance squared from the closest point on a bounding box to a point.
  // See Geometric Tools for Computer Graphics 10.4.2

  // eslint-disable-next-line max-statements
  distanceSquaredTo(point) {
    const offset = Vector3.subtract(point, this.center, scratchOffset);

    const halfAxes = this.halfAxes;
    const u = Matrix3.getColumn(halfAxes, 0, scratchVectorU);
    const v = Matrix3.getColumn(halfAxes, 1, scratchVectorV);
    const w = Matrix3.getColumn(halfAxes, 2, scratchVectorW);

    const uHalf = Vector3.magnitude(u);
    const vHalf = Vector3.magnitude(v);
    const wHalf = Vector3.magnitude(w);

    Vector3.normalize(u, u);
    Vector3.normalize(v, v);
    Vector3.normalize(w, w);

    const pPrime = scratchPPrime;
    pPrime.x = Vector3.dot(offset, u);
    pPrime.y = Vector3.dot(offset, v);
    pPrime.z = Vector3.dot(offset, w);

    let distanceSquared = 0.0;
    let d;

    if (pPrime.x < -uHalf) {
      d = pPrime.x + uHalf;
      distanceSquared += d * d;
    } else if (pPrime.x > uHalf) {
      d = pPrime.x - uHalf;
      distanceSquared += d * d;
    }

    if (pPrime.y < -vHalf) {
      d = pPrime.y + vHalf;
      distanceSquared += d * d;
    } else if (pPrime.y > vHalf) {
      d = pPrime.y - vHalf;
      distanceSquared += d * d;
    }

    if (pPrime.z < -wHalf) {
      d = pPrime.z + wHalf;
      distanceSquared += d * d;
    } else if (pPrime.z > wHalf) {
      d = pPrime.z - wHalf;
      distanceSquared += d * d;
    }

    return distanceSquared;
  }

  // The distances calculated by the vector from the center of the bounding box
  // to position projected onto direction.

  // eslint-disable-next-line max-statements
  computePlaneDistances(box, position, direction, result = [[], []]) {
    let minDist = Number.POSITIVE_INFINITY;
    let maxDist = Number.NEGATIVE_INFINITY;

    const center = box.center;
    const halfAxes = box.halfAxes;

    const u = Matrix3.getColumn(halfAxes, 0, scratchVectorU);
    const v = Matrix3.getColumn(halfAxes, 1, scratchVectorV);
    const w = Matrix3.getColumn(halfAxes, 2, scratchVectorW);

    // project first corner
    const corner = Vector3.add(u, v, scratchCorner);
    Vector3.add(corner, w, corner);
    Vector3.add(corner, center, corner);

    const toCenter = Vector3.subtract(corner, position, scratchToCenter);
    let mag = Vector3.dot(direction, toCenter);

    minDist = Math.min(mag, minDist);
    maxDist = Math.max(mag, maxDist);

    // project second corner
    Vector3.add(center, u, corner);
    Vector3.add(corner, v, corner);
    Vector3.subtract(corner, w, corner);

    Vector3.subtract(corner, position, toCenter);
    mag = Vector3.dot(direction, toCenter);

    minDist = Math.min(mag, minDist);
    maxDist = Math.max(mag, maxDist);

    // project third corner
    Vector3.add(center, u, corner);
    Vector3.subtract(corner, v, corner);
    Vector3.add(corner, w, corner);

    Vector3.subtract(corner, position, toCenter);
    mag = Vector3.dot(direction, toCenter);

    minDist = Math.min(mag, minDist);
    maxDist = Math.max(mag, maxDist);

    // project fourth corner
    Vector3.add(center, u, corner);
    Vector3.subtract(corner, v, corner);
    Vector3.subtract(corner, w, corner);

    Vector3.subtract(corner, position, toCenter);
    mag = Vector3.dot(direction, toCenter);

    minDist = Math.min(mag, minDist);
    maxDist = Math.max(mag, maxDist);

    // project fifth corner
    Vector3.subtract(center, u, corner);
    Vector3.add(corner, v, corner);
    Vector3.add(corner, w, corner);

    Vector3.subtract(corner, position, toCenter);
    mag = Vector3.dot(direction, toCenter);

    minDist = Math.min(mag, minDist);
    maxDist = Math.max(mag, maxDist);

    // project sixth corner
    Vector3.subtract(center, u, corner);
    Vector3.add(corner, v, corner);
    Vector3.subtract(corner, w, corner);

    Vector3.subtract(corner, position, toCenter);
    mag = Vector3.dot(direction, toCenter);

    minDist = Math.min(mag, minDist);
    maxDist = Math.max(mag, maxDist);

    // project seventh corner
    Vector3.subtract(center, u, corner);
    Vector3.subtract(corner, v, corner);
    Vector3.add(corner, w, corner);

    Vector3.subtract(corner, position, toCenter);
    mag = Vector3.dot(direction, toCenter);

    minDist = Math.min(mag, minDist);
    maxDist = Math.max(mag, maxDist);

    // project eighth corner
    Vector3.subtract(center, u, corner);
    Vector3.subtract(corner, v, corner);
    Vector3.subtract(corner, w, corner);

    Vector3.subtract(corner, position, toCenter);
    mag = Vector3.dot(direction, toCenter);

    minDist = Math.min(mag, minDist);
    maxDist = Math.max(mag, maxDist);

    result.start = minDist;
    result.stop = maxDist;
    return result;
  }

  getTransform() {
    // const modelMatrix = Matrix4.fromRotationTranslation(this.boundingVolume.halfAxes, this.boundingVolume.center);
    // return modelMatrix;
  }
}

/**
 * The number of elements used to pack the object into an array.
 * @type {Number}
 *
packedLength = Vector3.packedLength + Matrix3.packedLength;

 * Stores the provided instance into the provided array.
 * @param {OrientedBoundingBox} value The value to pack.
 * @param {Number[]} array The array to pack into.
 * @param {Number} [startingIndex=0] The index into the array at which to start packing the elements.
 * @returns {Number[]} The array that was packed into

pack(value, array, startingIndex) {
  Vector3.pack(value.center, array, startingIndex);
  Matrix3.pack(value.halfAxes, array, startingIndex + Vector3.packedLength);

  return array;
};

 * Retrieves an instance from a packed array.
 * @param {Number[]} array The packed array.
 * @param {Number} [startingIndex=0] The starting index of the element to be unpacked.
 * @param {OrientedBoundingBox} [result] The object into which to store the result.
 * @returns {OrientedBoundingBox} The modified result parameter or a new OrientedBoundingBox instance if one was not provided.

unpack(array, startingIndex, result) {
  startingIndex = defaultValue(startingIndex, 0);

  if (!defined(result)) {
    result = new OrientedBoundingBox();
  }

  Vector3.unpack(array, startingIndex, result.center);
  Matrix3.unpack(array, startingIndex + Vector3.packedLength, result.halfAxes);
  return result;
};

  unitary : new Matrix3(),
  diagonal : new Matrix3()
};
*/
