/* eslint-disable */
import {Vector3, equals} from 'math.gl';
import assert from '../../utils/assert';

const scratchNormal = new Vector3();
const scratchVector3 = new Vector3();
const scratchPosition = new Vector3();

// A plane in Hessian Normal Form defined by
export default class Plane {
  // The XY plane passing through the origin, with normal in positive Z.
  static get ORIGIN_XY_PLANE() {
    return new Plane([0, 0, 1], 0.0);
  }

  // The YZ plane passing through the origin, with normal in positive X.
  static get ORIGIN_YZ_PLANE() {
    return new Plane([1, 0, 0], 0.0);
  }

  // The ZX plane passing through the origin, with normal in positive Y.
  static get ORIGIN_ZX_PLANE() {
    return new Plane([0, 1, 0], 0.0);
  }

  constructor(normal, distance) {
    assert(Number.isFinite(distance));

    this.normal = new Vector3(normal).normalize();
    this.distance = distance;
  }

  // Creates a plane from a normal and a point on the plane.
  fromPointNormal(point, normal) {
    if (!CesiumMath.equalsEpsilon(Vector3.magnitude(normal), 1.0, CesiumMath.EPSILON6)) {
      throw new DeveloperError('normal must be normalized.');
    }
    //>>includeEnd('debug');

    const distance = -Vector3.dot(normal, point);

    if (!defined(result)) {
      return new Plane(normal, distance);
    }

    Vector3.clone(normal, result.normal);
    result.distance = distance;
    return result;
  }

  /*
  // Creates a plane from the general equation
  fromCartesian4(coefficients) {
  	//>>includeStart('debug', pragmas.debug);
  	Check.typeOf.object('coefficients', coefficients);
  	//>>includeEnd('debug');

  	var normal = Vector3.fromCartesian4(coefficients, scratchNormal);
  	var distance = coefficients.w;

  	//>>includeStart('debug', pragmas.debug);
  	if (!CesiumMath.equalsEpsilon(Vector3.magnitude(normal), 1.0, CesiumMath.EPSILON6)) {
  		throw new DeveloperError('normal must be normalized.');
  	}
  	//>>includeEnd('debug');

  	if (!defined(result)) {
  		return new Plane(normal, distance);
  	}
  	Vector3.clone(normal, result.normal);
  	result.distance = distance;
  	return result;
  };
  */

  // Duplicates a Plane instance.
  clone(plane) {
    this.normal = plane.normal.clone();
    this.distance = plane.distance;
    return this._check();
  }

  // Compares the provided Planes by normal and distance
  equals(right) {
    return equals(this.distance, right.distance) && equals(this.normal, right.normal);
  }

  // Computes the signed shortest distance of a point to a plane.
  // The sign of the distance determines which side of the plane the point is on.
  getPointDistance(plane, point) {
    return Vector3.dot(plane.normal, point) + plane.distance;
  }

  // Projects a point onto the plane.
  projectPointOntoPlane(point, result = [0, 0, 0]) {
    // projectedPoint = point - (normal.point + scale) * normal
    const pointDistance = this.getPointDistance(point);
    const scaledNormal = Vector3.multiplyByScalar(this.normal, pointDistance, scratchVector3);
    return Vector3.subtract(point, scaledNormal, result);
  }

  // Transforms the plane by the given transformation matrix.
  transform(transform) {
    Matrix4.multiplyByPointAsVector(transform, this.normal, scratchNormal);
    Vector3.normalize(scratchNormal, scratchNormal);

    Vector3.multiplyByScalar(this.normal, -this.distance, scratchPosition);
    Matrix4.multiplyByPoint(transform, scratchPosition, scratchPosition);

    return Plane.fromPointNormal(scratchPosition, scratchNormal, result);
  }

  // PRIVATE

  _check() {
    if (!this._validate) {
      throw new Error('Invalid Plane');
    }
  }

  _validate() {
    return (
      Number.isFinite(this.normal[0]) &&
      Number.isFinite(this.normal[1]) &&
      Number.isFinite(this.normal[2]) &&
      Number.isFinite(this.distance)
    );
  }
}
