/* eslint-disable */
const fromPointsXMin = new Vector3();
const fromPointsYMin = new Vector3();
const fromPointsZMin = new Vector3();
const fromPointsXMax = new Vector3();
const fromPointsYMax = new Vector3();
const fromPointsZMax = new Vector3();
const fromPointsCurrentPos = new Vector3();
const fromPointsScratch = new Vector3();
const fromPointsRitterCenter = new Vector3();
const fromPointsMinBoxPt = new Vector3();
const fromPointsMaxBoxPt = new Vector3();
const fromPointsNaiveCenterScratch = new Vector3();
const volumeConstant = (4.0 / 3.0) * CesiumMath.PI;

/*
Computes a tight-fitting bounding sphere enclosing a list of 3D Cartesian points.
The bounding sphere is computed by running two algorithms, a naive algorithm and
Ritter's algorithm. The smaller of the two spheres is used to ensure a tight fit.
   *
@param {Vector3[]} [positions] An array of points that the bounding sphere will enclose.  Each point must have <code>x</code>, <code>y</code>, and <code>z</code> properties.
@param {BoundingSphere} [result] The object onto which to store the result.
@returns {BoundingSphere} The modified result parameter or a new BoundingSphere instance if one was not provided.
   *
@see {@link http://blogs.agi.com/insight3d/index.php/2008/02/04/a-bounding/|Bounding Sphere computation article}
*/

export default function makeBoundingSphereFromPoints(positions, result) {
  if (!defined(result)) {
    result = new BoundingSphere();
  }

  if (!defined(positions) || positions.length === 0) {
    result.center = Vector3.clone(Vector3.ZERO, result.center);
    result.radius = 0.0;
    return result;
  }

  const currentPos = Vector3.clone(positions[0], fromPointsCurrentPos);

  const xMin = Vector3.clone(currentPos, fromPointsXMin);
  const yMin = Vector3.clone(currentPos, fromPointsYMin);
  const zMin = Vector3.clone(currentPos, fromPointsZMin);

  const xMax = Vector3.clone(currentPos, fromPointsXMax);
  const yMax = Vector3.clone(currentPos, fromPointsYMax);
  const zMax = Vector3.clone(currentPos, fromPointsZMax);

  const numPositions = positions.length;

  for (let i = 1; i < numPositions; i++) {
    Vector3.clone(positions[i], currentPos);

    const x = currentPos.x;
    const y = currentPos.y;
    const z = currentPos.z;

    // Store points containing the the smallest and largest components
    if (x < xMin.x) {
      Vector3.clone(currentPos, xMin);
    }

    if (x > xMax.x) {
      Vector3.clone(currentPos, xMax);
    }

    if (y < yMin.y) {
      Vector3.clone(currentPos, yMin);
    }

    if (y > yMax.y) {
      Vector3.clone(currentPos, yMax);
    }

    if (z < zMin.z) {
      Vector3.clone(currentPos, zMin);
    }

    if (z > zMax.z) {
      Vector3.clone(currentPos, zMax);
    }
  }

  // Compute x-, y-, and z-spans (Squared distances b/n each component's min. and max.).
  const xSpan = Vector3.magnitudeSquared(Vector3.subtract(xMax, xMin, fromPointsScratch));
  const ySpan = Vector3.magnitudeSquared(Vector3.subtract(yMax, yMin, fromPointsScratch));
  const zSpan = Vector3.magnitudeSquared(Vector3.subtract(zMax, zMin, fromPointsScratch));

  // Set the diameter endpoints to the largest span.
  const diameter1 = xMin;
  const diameter2 = xMax;
  const maxSpan = xSpan;
  if (ySpan > maxSpan) {
    maxSpan = ySpan;
    diameter1 = yMin;
    diameter2 = yMax;
  }
  if (zSpan > maxSpan) {
    maxSpan = zSpan;
    diameter1 = zMin;
    diameter2 = zMax;
  }

  // Calculate the center of the initial sphere found by Ritter's algorithm
  const ritterCenter = fromPointsRitterCenter;
  ritterCenter.x = (diameter1.x + diameter2.x) * 0.5;
  ritterCenter.y = (diameter1.y + diameter2.y) * 0.5;
  ritterCenter.z = (diameter1.z + diameter2.z) * 0.5;

  // Calculate the radius of the initial sphere found by Ritter's algorithm
  const radiusSquared = Vector3.magnitudeSquared(
    Vector3.subtract(diameter2, ritterCenter, fromPointsScratch)
  );
  const ritterRadius = Math.sqrt(radiusSquared);

  // Find the center of the sphere found using the Naive method.
  const minBoxPt = fromPointsMinBoxPt;
  minBoxPt.x = xMin.x;
  minBoxPt.y = yMin.y;
  minBoxPt.z = zMin.z;

  const maxBoxPt = fromPointsMaxBoxPt;
  maxBoxPt.x = xMax.x;
  maxBoxPt.y = yMax.y;
  maxBoxPt.z = zMax.z;

  const naiveCenter = Vector3.midpoint(minBoxPt, maxBoxPt, fromPointsNaiveCenterScratch);

  // Begin 2nd pass to find naive radius and modify the ritter sphere.
  const naiveRadius = 0;
  for (i = 0; i < numPositions; i++) {
    Vector3.clone(positions[i], currentPos);

    // Find the furthest point from the naive center to calculate the naive radius.
    const r = Vector3.magnitude(Vector3.subtract(currentPos, naiveCenter, fromPointsScratch));
    if (r > naiveRadius) {
      naiveRadius = r;
    }

    // Make adjustments to the Ritter Sphere to include all points.
    const oldCenterToPointSquared = Vector3.magnitudeSquared(
      Vector3.subtract(currentPos, ritterCenter, fromPointsScratch)
    );
    if (oldCenterToPointSquared > radiusSquared) {
      const oldCenterToPoint = Math.sqrt(oldCenterToPointSquared);
      // Calculate new radius to include the point that lies outside
      ritterRadius = (ritterRadius + oldCenterToPoint) * 0.5;
      radiusSquared = ritterRadius * ritterRadius;
      // Calculate center of new Ritter sphere
      const oldToNew = oldCenterToPoint - ritterRadius;
      ritterCenter.x = (ritterRadius * ritterCenter.x + oldToNew * currentPos.x) / oldCenterToPoint;
      ritterCenter.y = (ritterRadius * ritterCenter.y + oldToNew * currentPos.y) / oldCenterToPoint;
      ritterCenter.z = (ritterRadius * ritterCenter.z + oldToNew * currentPos.z) / oldCenterToPoint;
    }
  }

  if (ritterRadius < naiveRadius) {
    Vector3.clone(ritterCenter, result.center);
    result.radius = ritterRadius;
  } else {
    Vector3.clone(naiveCenter, result.center);
    result.radius = naiveRadius;
  }

  return result;
}

/*
Computes a tight-fitting bounding sphere enclosing a list of 3D points, where the points are
stored in a flat array in X, Y, Z, order.  The bounding sphere is computed by running two
algorithms, a naive algorithm and Ritter's algorithm. The smaller of the two spheres is used to
ensure a tight fit.
   *
@param {Number[]} [positions] An array of points that the bounding sphere will enclose.  Each point
       is formed from three elements in the array in the order X, Y, Z.
@param {Vector3} [center=Vector3.ZERO] The position to which the positions are relative, which need not be the
       origin of the coordinate system.  This is useful when the positions are to be used for
       relative-to-center (RTC) rendering.
@param {Number} [stride=3] The number of array elements per vertex.  It must be at least 3, but it may
       be higher.  Regardless of the value of this parameter, the X coordinate of the first position
       is at array index 0, the Y coordinate is at array index 1, and the Z coordinate is at array index
       2.  When stride is 3, the X coordinate of the next position then begins at array index 3.  If
       the stride is 5, however, two array elements are skipped and the next position begins at array
       index 5.
@param {BoundingSphere} [result] The object onto which to store the result.
@returns {BoundingSphere} The modified result parameter or a new BoundingSphere instance if one was not provided.
   *
@example
// Compute the bounding sphere from 3 positions, each specified relative to a center.
// In addition to the X, Y, and Z coordinates, the points array contains two additional
// elements per point which are ignored for the purpose of computing the bounding sphere.
var center = new Cesium.Vector3(1.0, 2.0, 3.0);
var points = [1.0, 2.0, 3.0, 0.1, 0.2,
              4.0, 5.0, 6.0, 0.1, 0.2,
              7.0, 8.0, 9.0, 0.1, 0.2];
var sphere = Cesium.BoundingSphere.fromVertices(points, center, 5);
   *
@see {@link http://blogs.agi.com/insight3d/index.php/2008/02/04/a-bounding/|Bounding Sphere computation article}
*/

export function makeBoundingSphereFromVertices(positions, center, stride, result) {
  if (!defined(result)) {
    result = new BoundingSphere();
  }

  if (!defined(positions) || positions.length === 0) {
    result.center = Vector3.clone(Vector3.ZERO, result.center);
    result.radius = 0.0;
    return result;
  }

  center = defaultValue(center, Vector3.ZERO);

  stride = defaultValue(stride, 3);

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number.greaterThanOrEquals('stride', stride, 3);
  //>>includeEnd('debug');

  var currentPos = fromPointsCurrentPos;
  currentPos.x = positions[0] + center.x;
  currentPos.y = positions[1] + center.y;
  currentPos.z = positions[2] + center.z;

  var xMin = Vector3.clone(currentPos, fromPointsXMin);
  var yMin = Vector3.clone(currentPos, fromPointsYMin);
  var zMin = Vector3.clone(currentPos, fromPointsZMin);

  var xMax = Vector3.clone(currentPos, fromPointsXMax);
  var yMax = Vector3.clone(currentPos, fromPointsYMax);
  var zMax = Vector3.clone(currentPos, fromPointsZMax);

  var numElements = positions.length;
  var i;
  for (i = 0; i < numElements; i += stride) {
    var x = positions[i] + center.x;
    var y = positions[i + 1] + center.y;
    var z = positions[i + 2] + center.z;

    currentPos.x = x;
    currentPos.y = y;
    currentPos.z = z;

    // Store points containing the the smallest and largest components
    if (x < xMin.x) {
      Vector3.clone(currentPos, xMin);
    }

    if (x > xMax.x) {
      Vector3.clone(currentPos, xMax);
    }

    if (y < yMin.y) {
      Vector3.clone(currentPos, yMin);
    }

    if (y > yMax.y) {
      Vector3.clone(currentPos, yMax);
    }

    if (z < zMin.z) {
      Vector3.clone(currentPos, zMin);
    }

    if (z > zMax.z) {
      Vector3.clone(currentPos, zMax);
    }
  }

  // Compute x-, y-, and z-spans (Squared distances b/n each component's min. and max.).
  var xSpan = Vector3.magnitudeSquared(Vector3.subtract(xMax, xMin, fromPointsScratch));
  var ySpan = Vector3.magnitudeSquared(Vector3.subtract(yMax, yMin, fromPointsScratch));
  var zSpan = Vector3.magnitudeSquared(Vector3.subtract(zMax, zMin, fromPointsScratch));

  // Set the diameter endpoints to the largest span.
  var diameter1 = xMin;
  var diameter2 = xMax;
  var maxSpan = xSpan;
  if (ySpan > maxSpan) {
    maxSpan = ySpan;
    diameter1 = yMin;
    diameter2 = yMax;
  }
  if (zSpan > maxSpan) {
    maxSpan = zSpan;
    diameter1 = zMin;
    diameter2 = zMax;
  }

  // Calculate the center of the initial sphere found by Ritter's algorithm
  var ritterCenter = fromPointsRitterCenter;
  ritterCenter.x = (diameter1.x + diameter2.x) * 0.5;
  ritterCenter.y = (diameter1.y + diameter2.y) * 0.5;
  ritterCenter.z = (diameter1.z + diameter2.z) * 0.5;

  // Calculate the radius of the initial sphere found by Ritter's algorithm
  var radiusSquared = Vector3.magnitudeSquared(
    Vector3.subtract(diameter2, ritterCenter, fromPointsScratch)
  );
  var ritterRadius = Math.sqrt(radiusSquared);

  // Find the center of the sphere found using the Naive method.
  var minBoxPt = fromPointsMinBoxPt;
  minBoxPt.x = xMin.x;
  minBoxPt.y = yMin.y;
  minBoxPt.z = zMin.z;

  var maxBoxPt = fromPointsMaxBoxPt;
  maxBoxPt.x = xMax.x;
  maxBoxPt.y = yMax.y;
  maxBoxPt.z = zMax.z;

  var naiveCenter = Vector3.midpoint(minBoxPt, maxBoxPt, fromPointsNaiveCenterScratch);

  // Begin 2nd pass to find naive radius and modify the ritter sphere.
  var naiveRadius = 0;
  for (i = 0; i < numElements; i += stride) {
    currentPos.x = positions[i] + center.x;
    currentPos.y = positions[i + 1] + center.y;
    currentPos.z = positions[i + 2] + center.z;

    // Find the furthest point from the naive center to calculate the naive radius.
    var r = Vector3.magnitude(Vector3.subtract(currentPos, naiveCenter, fromPointsScratch));
    if (r > naiveRadius) {
      naiveRadius = r;
    }

    // Make adjustments to the Ritter Sphere to include all points.
    var oldCenterToPointSquared = Vector3.magnitudeSquared(
      Vector3.subtract(currentPos, ritterCenter, fromPointsScratch)
    );
    if (oldCenterToPointSquared > radiusSquared) {
      var oldCenterToPoint = Math.sqrt(oldCenterToPointSquared);
      // Calculate new radius to include the point that lies outside
      ritterRadius = (ritterRadius + oldCenterToPoint) * 0.5;
      radiusSquared = ritterRadius * ritterRadius;
      // Calculate center of new Ritter sphere
      var oldToNew = oldCenterToPoint - ritterRadius;
      ritterCenter.x = (ritterRadius * ritterCenter.x + oldToNew * currentPos.x) / oldCenterToPoint;
      ritterCenter.y = (ritterRadius * ritterCenter.y + oldToNew * currentPos.y) / oldCenterToPoint;
      ritterCenter.z = (ritterRadius * ritterCenter.z + oldToNew * currentPos.z) / oldCenterToPoint;
    }
  }

  if (ritterRadius < naiveRadius) {
    Vector3.clone(ritterCenter, result.center);
    result.radius = ritterRadius;
  } else {
    Vector3.clone(naiveCenter, result.center);
    result.radius = naiveRadius;
  }

  return result;
}

/*
Computes a tight-fitting bounding sphere enclosing a list of {@link EncodedVector3}s, where the points are
stored in parallel flat arrays in X, Y, Z, order.  The bounding sphere is computed by running two
algorithms, a naive algorithm and Ritter's algorithm. The smaller of the two spheres is used to
ensure a tight fit.
   *
@param {Number[]} [positionsHigh] An array of high bits of the encoded cartesians that the bounding sphere will enclose.  Each point
       is formed from three elements in the array in the order X, Y, Z.
@param {Number[]} [positionsLow] An array of low bits of the encoded cartesians that the bounding sphere will enclose.  Each point
       is formed from three elements in the array in the order X, Y, Z.
@param {BoundingSphere} [result] The object onto which to store the result.
@returns {BoundingSphere} The modified result parameter or a new BoundingSphere instance if one was not provided.
   *
@see {@link http://blogs.agi.com/insight3d/index.php/2008/02/04/a-bounding/|Bounding Sphere computation article}
*/

export function makeBoundingSphereFromEncodedCartesianVertices(
  positionsHigh,
  positionsLow,
  result
) {
  if (!defined(result)) {
    result = new BoundingSphere();
  }

  if (
    !defined(positionsHigh) ||
    !defined(positionsLow) ||
    positionsHigh.length !== positionsLow.length ||
    positionsHigh.length === 0
  ) {
    result.center = Vector3.clone(Vector3.ZERO, result.center);
    result.radius = 0.0;
    return result;
  }

  var currentPos = fromPointsCurrentPos;
  currentPos.x = positionsHigh[0] + positionsLow[0];
  currentPos.y = positionsHigh[1] + positionsLow[1];
  currentPos.z = positionsHigh[2] + positionsLow[2];

  var xMin = Vector3.clone(currentPos, fromPointsXMin);
  var yMin = Vector3.clone(currentPos, fromPointsYMin);
  var zMin = Vector3.clone(currentPos, fromPointsZMin);

  var xMax = Vector3.clone(currentPos, fromPointsXMax);
  var yMax = Vector3.clone(currentPos, fromPointsYMax);
  var zMax = Vector3.clone(currentPos, fromPointsZMax);

  var numElements = positionsHigh.length;
  var i;
  for (i = 0; i < numElements; i += 3) {
    var x = positionsHigh[i] + positionsLow[i];
    var y = positionsHigh[i + 1] + positionsLow[i + 1];
    var z = positionsHigh[i + 2] + positionsLow[i + 2];

    currentPos.x = x;
    currentPos.y = y;
    currentPos.z = z;

    // Store points containing the the smallest and largest components
    if (x < xMin.x) {
      Vector3.clone(currentPos, xMin);
    }

    if (x > xMax.x) {
      Vector3.clone(currentPos, xMax);
    }

    if (y < yMin.y) {
      Vector3.clone(currentPos, yMin);
    }

    if (y > yMax.y) {
      Vector3.clone(currentPos, yMax);
    }

    if (z < zMin.z) {
      Vector3.clone(currentPos, zMin);
    }

    if (z > zMax.z) {
      Vector3.clone(currentPos, zMax);
    }
  }

  // Compute x-, y-, and z-spans (Squared distances b/n each component's min. and max.).
  var xSpan = Vector3.magnitudeSquared(Vector3.subtract(xMax, xMin, fromPointsScratch));
  var ySpan = Vector3.magnitudeSquared(Vector3.subtract(yMax, yMin, fromPointsScratch));
  var zSpan = Vector3.magnitudeSquared(Vector3.subtract(zMax, zMin, fromPointsScratch));

  // Set the diameter endpoints to the largest span.
  var diameter1 = xMin;
  var diameter2 = xMax;
  var maxSpan = xSpan;
  if (ySpan > maxSpan) {
    maxSpan = ySpan;
    diameter1 = yMin;
    diameter2 = yMax;
  }
  if (zSpan > maxSpan) {
    maxSpan = zSpan;
    diameter1 = zMin;
    diameter2 = zMax;
  }

  // Calculate the center of the initial sphere found by Ritter's algorithm
  var ritterCenter = fromPointsRitterCenter;
  ritterCenter.x = (diameter1.x + diameter2.x) * 0.5;
  ritterCenter.y = (diameter1.y + diameter2.y) * 0.5;
  ritterCenter.z = (diameter1.z + diameter2.z) * 0.5;

  // Calculate the radius of the initial sphere found by Ritter's algorithm
  var radiusSquared = Vector3.magnitudeSquared(
    Vector3.subtract(diameter2, ritterCenter, fromPointsScratch)
  );
  var ritterRadius = Math.sqrt(radiusSquared);

  // Find the center of the sphere found using the Naive method.
  var minBoxPt = fromPointsMinBoxPt;
  minBoxPt.x = xMin.x;
  minBoxPt.y = yMin.y;
  minBoxPt.z = zMin.z;

  var maxBoxPt = fromPointsMaxBoxPt;
  maxBoxPt.x = xMax.x;
  maxBoxPt.y = yMax.y;
  maxBoxPt.z = zMax.z;

  var naiveCenter = Vector3.midpoint(minBoxPt, maxBoxPt, fromPointsNaiveCenterScratch);

  // Begin 2nd pass to find naive radius and modify the ritter sphere.
  var naiveRadius = 0;
  for (i = 0; i < numElements; i += 3) {
    currentPos.x = positionsHigh[i] + positionsLow[i];
    currentPos.y = positionsHigh[i + 1] + positionsLow[i + 1];
    currentPos.z = positionsHigh[i + 2] + positionsLow[i + 2];

    // Find the furthest point from the naive center to calculate the naive radius.
    var r = Vector3.magnitude(Vector3.subtract(currentPos, naiveCenter, fromPointsScratch));
    if (r > naiveRadius) {
      naiveRadius = r;
    }

    // Make adjustments to the Ritter Sphere to include all points.
    var oldCenterToPointSquared = Vector3.magnitudeSquared(
      Vector3.subtract(currentPos, ritterCenter, fromPointsScratch)
    );
    if (oldCenterToPointSquared > radiusSquared) {
      var oldCenterToPoint = Math.sqrt(oldCenterToPointSquared);
      // Calculate new radius to include the point that lies outside
      ritterRadius = (ritterRadius + oldCenterToPoint) * 0.5;
      radiusSquared = ritterRadius * ritterRadius;
      // Calculate center of new Ritter sphere
      var oldToNew = oldCenterToPoint - ritterRadius;
      ritterCenter.x = (ritterRadius * ritterCenter.x + oldToNew * currentPos.x) / oldCenterToPoint;
      ritterCenter.y = (ritterRadius * ritterCenter.y + oldToNew * currentPos.y) / oldCenterToPoint;
      ritterCenter.z = (ritterRadius * ritterCenter.z + oldToNew * currentPos.z) / oldCenterToPoint;
    }
  }

  if (ritterRadius < naiveRadius) {
    Vector3.clone(ritterCenter, result.center);
    result.radius = ritterRadius;
  } else {
    Vector3.clone(naiveCenter, result.center);
    result.radius = naiveRadius;
  }

  return result;
}
