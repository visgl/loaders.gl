import {Vector3} from 'math.gl';

/* eslint-disable */

/*
const scratchVector1 = new Vector3();

const scratchVector2 = new Vector3();

const scratchVector3 = new Vector3();

const scratchVector4 = new Vector3();

const scratchVector5 = new Vector3();

const scratchVector6 = new Vector3();

const scratchCoconstianceResult = new Matrix3();

const scratchScale = new Vector3();

const scratchRectangleCenterCartographic = new Cartographic();

const scratchRectangleCenter = new Vector3();

// const scratchEigenResult = {

const scratchBoundingSphere = new BoundingSphere();

const perimeterCartographicScratch = [new Cartographic(), new Cartographic(), new Cartographic(), new Cartographic(), new Cartographic(), new Cartographic(), new Cartographic(), new Cartographic()];
const perimeterVectorScratch = [new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3()];
const perimeterProjectedScratch = [new Vector2(), new Vector2(), new Vector2(), new Vector2(), new Vector2(), new Vector2(), new Vector2(), new Vector2()];
*/

// Computes an instance of an OrientedBoundingBox of the given positions.
// This is an implementation of Stefan Gottschalk's Collision Queries using Oriented Bounding Boxes solution (PHD thesis).
// Reference: http://gamma.cs.unc.edu/users/gottschalk/main.pdf
export default function makeOrientedBoundingBoxfromPoints(positions, result) {
  if (!defined(result)) {
    result = new OrientedBoundingBox();
  }

  if (!defined(positions) || positions.length === 0) {
    result.halfAxes = Matrix3.ZERO;
    result.center = Vector3.ZERO;
    return result;
  }

  const meanPoint = new Vector3(0, 0, 0);
  for (const position of positions) {
    meanPoint.add(position);
  }
  const invLength = 1.0 / length;
  Vector3.multiplyByScalar(meanPoint, invLength, meanPoint);

  let exx = 0.0;
  let exy = 0.0;
  let exz = 0.0;
  let eyy = 0.0;
  let eyz = 0.0;
  let ezz = 0.0;
  let p;

  for (i = 0; i < length; i++) {
    p = Vector3.subtract(positions[i], meanPoint, scratchVector2);
    exx += p.x * p.x;
    exy += p.x * p.y;
    exz += p.x * p.z;
    eyy += p.y * p.y;
    eyz += p.y * p.z;
    ezz += p.z * p.z;
  }

  exx *= invLength;
  exy *= invLength;
  exz *= invLength;
  eyy *= invLength;
  eyz *= invLength;
  ezz *= invLength;

  var covarianceMatrix = scratchCovarianceResult;
  covarianceMatrix[0] = exx;
  covarianceMatrix[1] = exy;
  covarianceMatrix[2] = exz;
  covarianceMatrix[3] = exy;
  covarianceMatrix[4] = eyy;
  covarianceMatrix[5] = eyz;
  covarianceMatrix[6] = exz;
  covarianceMatrix[7] = eyz;
  covarianceMatrix[8] = ezz;

  var eigenDecomposition = Matrix3.computeEigenDecomposition(covarianceMatrix, scratchEigenResult);
  var rotation = Matrix3.clone(eigenDecomposition.unitary, result.halfAxes);

  var v1 = Matrix3.getColumn(rotation, 0, scratchVector4);
  var v2 = Matrix3.getColumn(rotation, 1, scratchVector5);
  var v3 = Matrix3.getColumn(rotation, 2, scratchVector6);

  var u1 = -Number.MAX_VALUE;
  var u2 = -Number.MAX_VALUE;
  var u3 = -Number.MAX_VALUE;
  var l1 = Number.MAX_VALUE;
  var l2 = Number.MAX_VALUE;
  var l3 = Number.MAX_VALUE;

  for (i = 0; i < length; i++) {
    p = positions[i];
    u1 = Math.max(Vector3.dot(v1, p), u1);
    u2 = Math.max(Vector3.dot(v2, p), u2);
    u3 = Math.max(Vector3.dot(v3, p), u3);

    l1 = Math.min(Vector3.dot(v1, p), l1);
    l2 = Math.min(Vector3.dot(v2, p), l2);
    l3 = Math.min(Vector3.dot(v3, p), l3);
  }

  v1 = Vector3.multiplyByScalar(v1, 0.5 * (l1 + u1), v1);
  v2 = Vector3.multiplyByScalar(v2, 0.5 * (l2 + u2), v2);
  v3 = Vector3.multiplyByScalar(v3, 0.5 * (l3 + u3), v3);

  var center = Vector3.add(v1, v2, result.center);
  Vector3.add(center, v3, center);

  var scale = scratchVector3;
  scale.x = u1 - l1;
  scale.y = u2 - l2;
  scale.z = u3 - l3;
  Vector3.multiplyByScalar(scale, 0.5, scale);
  Matrix3.multiplyByScale(result.halfAxes, scale, result.halfAxes);

  return result;
}
