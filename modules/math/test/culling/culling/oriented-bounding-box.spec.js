/* eslint-disable */
import test from 'tape-catch';

import {Vector3, Matrix3, Quaternion, radians as toRadians} from 'math.gl';
import {
  OrientedBoundingBox,
  // BoundingSphere,
  Intersect,
  Plane
} from '@loaders.gl/math'; // '@math.gl/culling';

const positions = [
  new Vector3(2.0, 0.0, 0.0),
  new Vector3(0.0, 3.0, 0.0),
  new Vector3(0.0, 0.0, 4.0),
  new Vector3(-2.0, 0.0, 0.0),
  new Vector3(0.0, -3.0, 0.0),
  new Vector3(0.0, 0.0, -4.0)
];

function rotatePositions(positions, axis, angle) {
  const points = [];

  const quaternion = Quaternion.fromAxisAngle(axis, angle);
  const rotation = Matrix3.fromQuaternion(quaternion);

  for (let i = 0; i < positions.length; ++i) {
    points.push(Matrix3.multiplyByVector(rotation, positions[i], new Vector3()));
  }

  return {points, rotation};
}

function translatePositions(positions, translation) {
  const points = [];
  for (let i = 0; i < positions.length; ++i) {
    points.push(Vector3.add(translation, positions[i], new Vector3()));
  }

  return points;
}

test('constructor sets expected default values', t => {
  const box = new OrientedBoundingBox();
  t.equals(box.center, Vector3.ZERO);
  t.equals(box.halfAxes, Matrix3.ZERO);
  t.end();
});

test('clone without a result parameter', t => {
  const box = new OrientedBoundingBox();
  const result = box.clone();
  t.notEquals(box, result);
  t.equals(box, result);
  t.equals(box.clone(), box);
  t.end();
});

test('equals works in all cases', t => {
  const box = new OrientedBoundingBox();
  t.equals(box.equals(new OrientedBoundingBox()), true);
  t.equals(box.equals(undefined), false);
  t.end();
});

// eslint-disable-next-line max-statements
function intersectPlaneTestCornersEdgesFaces(t, center, axes) {
  const SQRT1_2 = Math.pow(1.0 / 2.0, 1 / 2.0);
  const SQRT3_4 = Math.pow(3.0 / 4.0, 1 / 2.0);

  const box = new OrientedBoundingBox(center, Matrix3.multiplyByScalar(axes, 0.5, new Matrix3()));

  const planeNormXform = function(nx, ny, nz, dist) {
    const n = new Vector3(nx, ny, nz);
    const arb = new Vector3(357, 924, 258);
    const p0 = Vector3.normalize(n, new Vector3());
    Vector3.multiplyByScalar(p0, -dist, p0);
    const tang = Vector3.cross(n, arb, new Vector3());
    Vector3.normalize(tang, tang);
    const binorm = Vector3.cross(n, tang, new Vector3());
    Vector3.normalize(binorm, binorm);

    Matrix3.multiplyByVector(axes, p0, p0);
    Matrix3.multiplyByVector(axes, tang, tang);
    Matrix3.multiplyByVector(axes, binorm, binorm);
    Vector3.cross(tang, binorm, n);
    if (Vector3.magnitude(n) === 0) {
      return undefined;
    }
    Vector3.normalize(n, n);

    Vector3.add(p0, center, p0);
    const d = -Vector3.dot(p0, n);
    if (Math.abs(d) > 0.0001 && Vector3.magnitudeSquared(n) > 0.0001) {
      return new Plane(n, d);
    }
    return undefined;
  };

  let pl;

  // Tests against faces

  t.equalslaneNormXform(+1.0, +0.0, +0.0, 0.50001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INSIDE);
  }
  t.equalslaneNormXform(-1.0, +0.0, +0.0, 0.50001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INSIDE);
  }
  t.equalslaneNormXform(+0.0, +1.0, +0.0, 0.50001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INSIDE);
  }
  t.equalslaneNormXform(+0.0, -1.0, +0.0, 0.50001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INSIDE);
  }
  t.equalslaneNormXform(+0.0, +0.0, +1.0, 0.50001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INSIDE);
  }
  t.equalslaneNormXform(+0.0, +0.0, -1.0, 0.50001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INSIDE);
  }

  t.equalslaneNormXform(+1.0, +0.0, +0.0, 0.49999);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(-1.0, +0.0, +0.0, 0.49999);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(+0.0, +1.0, +0.0, 0.49999);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(+0.0, -1.0, +0.0, 0.49999);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(+0.0, +0.0, +1.0, 0.49999);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(+0.0, +0.0, -1.0, 0.49999);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }

  t.equalslaneNormXform(+1.0, +0.0, +0.0, -0.49999);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(-1.0, +0.0, +0.0, -0.49999);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(+0.0, +1.0, +0.0, -0.49999);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(+0.0, -1.0, +0.0, -0.49999);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(+0.0, +0.0, +1.0, -0.49999);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(+0.0, +0.0, -1.0, -0.49999);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }

  t.equalslaneNormXform(+1.0, +0.0, +0.0, -0.50001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.OUTSIDE);
  }
  t.equalslaneNormXform(-1.0, +0.0, +0.0, -0.50001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.OUTSIDE);
  }
  t.equalslaneNormXform(+0.0, +1.0, +0.0, -0.50001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.OUTSIDE);
  }
  t.equalslaneNormXform(+0.0, -1.0, +0.0, -0.50001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.OUTSIDE);
  }
  t.equalslaneNormXform(+0.0, +0.0, +1.0, -0.50001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.OUTSIDE);
  }
  t.equalslaneNormXform(+0.0, +0.0, -1.0, -0.50001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.OUTSIDE);
  }

  // Tests against edges

  t.equalslaneNormXform(+1.0, +1.0, +0.0, SQRT1_2 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INSIDE);
  }
  t.equalslaneNormXform(+1.0, -1.0, +0.0, SQRT1_2 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INSIDE);
  }
  t.equalslaneNormXform(-1.0, +1.0, +0.0, SQRT1_2 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INSIDE);
  }
  t.equalslaneNormXform(-1.0, -1.0, +0.0, SQRT1_2 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INSIDE);
  }
  t.equalslaneNormXform(+1.0, +0.0, +1.0, SQRT1_2 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INSIDE);
  }
  t.equalslaneNormXform(+1.0, +0.0, -1.0, SQRT1_2 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INSIDE);
  }
  t.equalslaneNormXform(-1.0, +0.0, +1.0, SQRT1_2 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INSIDE);
  }
  t.equalslaneNormXform(-1.0, +0.0, -1.0, SQRT1_2 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INSIDE);
  }
  t.equalslaneNormXform(+0.0, +1.0, +1.0, SQRT1_2 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INSIDE);
  }
  t.equalslaneNormXform(+0.0, +1.0, -1.0, SQRT1_2 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INSIDE);
  }
  t.equalslaneNormXform(+0.0, -1.0, +1.0, SQRT1_2 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INSIDE);
  }
  t.equalslaneNormXform(+0.0, -1.0, -1.0, SQRT1_2 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INSIDE);
  }

  t.equalslaneNormXform(+1.0, +1.0, +0.0, SQRT1_2 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(+1.0, -1.0, +0.0, SQRT1_2 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(-1.0, +1.0, +0.0, SQRT1_2 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(-1.0, -1.0, +0.0, SQRT1_2 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(+1.0, +0.0, +1.0, SQRT1_2 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(+1.0, +0.0, -1.0, SQRT1_2 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(-1.0, +0.0, +1.0, SQRT1_2 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(-1.0, +0.0, -1.0, SQRT1_2 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(+0.0, +1.0, +1.0, SQRT1_2 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(+0.0, +1.0, -1.0, SQRT1_2 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(+0.0, -1.0, +1.0, SQRT1_2 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(+0.0, -1.0, -1.0, SQRT1_2 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }

  t.equalslaneNormXform(+1.0, +1.0, +0.0, -SQRT1_2 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(+1.0, -1.0, +0.0, -SQRT1_2 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(-1.0, +1.0, +0.0, -SQRT1_2 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(-1.0, -1.0, +0.0, -SQRT1_2 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(+1.0, +0.0, +1.0, -SQRT1_2 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(+1.0, +0.0, -1.0, -SQRT1_2 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(-1.0, +0.0, +1.0, -SQRT1_2 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(-1.0, +0.0, -1.0, -SQRT1_2 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(+0.0, +1.0, +1.0, -SQRT1_2 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(+0.0, +1.0, -1.0, -SQRT1_2 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(+0.0, -1.0, +1.0, -SQRT1_2 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(+0.0, -1.0, -1.0, -SQRT1_2 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }

  t.equalslaneNormXform(+1.0, +1.0, +0.0, -SQRT1_2 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.OUTSIDE);
  }
  t.equalslaneNormXform(+1.0, -1.0, +0.0, -SQRT1_2 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.OUTSIDE);
  }
  t.equalslaneNormXform(-1.0, +1.0, +0.0, -SQRT1_2 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.OUTSIDE);
  }
  t.equalslaneNormXform(-1.0, -1.0, +0.0, -SQRT1_2 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.OUTSIDE);
  }
  t.equalslaneNormXform(+1.0, +0.0, +1.0, -SQRT1_2 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.OUTSIDE);
  }
  t.equalslaneNormXform(+1.0, +0.0, -1.0, -SQRT1_2 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.OUTSIDE);
  }
  t.equalslaneNormXform(-1.0, +0.0, +1.0, -SQRT1_2 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.OUTSIDE);
  }
  t.equalslaneNormXform(-1.0, +0.0, -1.0, -SQRT1_2 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.OUTSIDE);
  }
  t.equalslaneNormXform(+0.0, +1.0, +1.0, -SQRT1_2 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.OUTSIDE);
  }
  t.equalslaneNormXform(+0.0, +1.0, -1.0, -SQRT1_2 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.OUTSIDE);
  }
  t.equalslaneNormXform(+0.0, -1.0, +1.0, -SQRT1_2 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.OUTSIDE);
  }
  t.equalslaneNormXform(+0.0, -1.0, -1.0, -SQRT1_2 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.OUTSIDE);
  }

  // Tests against corners

  t.equalslaneNormXform(+1.0, +1.0, +1.0, SQRT3_4 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INSIDE);
  }
  t.equalslaneNormXform(+1.0, +1.0, -1.0, SQRT3_4 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INSIDE);
  }
  t.equalslaneNormXform(+1.0, -1.0, +1.0, SQRT3_4 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INSIDE);
  }
  t.equalslaneNormXform(+1.0, -1.0, -1.0, SQRT3_4 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INSIDE);
  }
  t.equalslaneNormXform(-1.0, +1.0, +1.0, SQRT3_4 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INSIDE);
  }
  t.equalslaneNormXform(-1.0, +1.0, -1.0, SQRT3_4 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INSIDE);
  }
  t.equalslaneNormXform(-1.0, -1.0, +1.0, SQRT3_4 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INSIDE);
  }
  t.equalslaneNormXform(-1.0, -1.0, -1.0, SQRT3_4 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INSIDE);
  }

  t.equalslaneNormXform(+1.0, +1.0, +1.0, SQRT3_4 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(+1.0, +1.0, -1.0, SQRT3_4 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(+1.0, -1.0, +1.0, SQRT3_4 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(+1.0, -1.0, -1.0, SQRT3_4 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(-1.0, +1.0, +1.0, SQRT3_4 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(-1.0, +1.0, -1.0, SQRT3_4 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(-1.0, -1.0, +1.0, SQRT3_4 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(-1.0, -1.0, -1.0, SQRT3_4 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }

  t.equalslaneNormXform(+1.0, +1.0, +1.0, -SQRT3_4 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(+1.0, +1.0, -1.0, -SQRT3_4 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(+1.0, -1.0, +1.0, -SQRT3_4 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(+1.0, -1.0, -1.0, -SQRT3_4 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(-1.0, +1.0, +1.0, -SQRT3_4 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(-1.0, +1.0, -1.0, -SQRT3_4 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(-1.0, -1.0, +1.0, -SQRT3_4 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }
  t.equalslaneNormXform(-1.0, -1.0, -1.0, -SQRT3_4 + 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.INTERSECTING);
  }

  t.equalslaneNormXform(+1.0, +1.0, +1.0, -SQRT3_4 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.OUTSIDE);
  }
  t.equalslaneNormXform(+1.0, +1.0, -1.0, -SQRT3_4 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.OUTSIDE);
  }
  t.equalslaneNormXform(+1.0, -1.0, +1.0, -SQRT3_4 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.OUTSIDE);
  }
  t.equalslaneNormXform(+1.0, -1.0, -1.0, -SQRT3_4 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.OUTSIDE);
  }
  t.equalslaneNormXform(-1.0, +1.0, +1.0, -SQRT3_4 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.OUTSIDE);
  }
  t.equalslaneNormXform(-1.0, +1.0, -1.0, -SQRT3_4 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.OUTSIDE);
  }
  t.equalslaneNormXform(-1.0, -1.0, +1.0, -SQRT3_4 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.OUTSIDE);
  }
  t.equalslaneNormXform(-1.0, -1.0, -1.0, -SQRT3_4 - 0.00001);
  if (pl) {
    expect(box.intersectPlane(pl), Intersect.OUTSIDE);
  }
}

test.skip('intersectPlane works with untransformed box', t => {
  intersectPlaneTestCornersEdgesFaces(t, Vector3.ZERO, Matrix3.IDENTITY);
  t.end();
});

test.skip('intersectPlane works with off-center box', t => {
  intersectPlaneTestCornersEdgesFaces(new Vector3(1.0, 0.0, 0.0), Matrix3.IDENTITY);
  intersectPlaneTestCornersEdgesFaces(new Vector3(0.7, -1.8, 12.0), Matrix3.IDENTITY);
  t.end();
});

test.skip('intersectPlane works with rotated box', t => {
  intersectPlaneTestCornersEdgesFaces(
    Vector3.ZERO,
    Matrix3.fromQuaternion(
      Quaternion.fromAxisAngle(new Vector3(0.5, 1.5, -1.2), 1.2),
      new Matrix3()
    )
  );
  t.end();
});

test.skip('intersectPlane works with scaled box', t => {
  const m = new Matrix3();
  intersectPlaneTestCornersEdgesFaces(
    Vector3.ZERO,
    Matrix3.fromScale(new Vector3(1.5, 0.4, 20.6), m)
  );
  intersectPlaneTestCornersEdgesFaces(
    Vector3.ZERO,
    Matrix3.fromScale(new Vector3(0.0, 0.4, 20.6), m)
  );
  intersectPlaneTestCornersEdgesFaces(
    Vector3.ZERO,
    Matrix3.fromScale(new Vector3(1.5, 0.0, 20.6), m)
  );
  intersectPlaneTestCornersEdgesFaces(
    Vector3.ZERO,
    Matrix3.fromScale(new Vector3(1.5, 0.4, 0.0), m)
  );
  intersectPlaneTestCornersEdgesFaces(
    Vector3.ZERO,
    Matrix3.fromScale(new Vector3(0.0, 0.0, 0.0), m)
  );
  t.end();
});

test.skip('intersectPlane works with this arbitrary box', t => {
  const m = Matrix3.fromScale(new Vector3(1.5, 80.4, 2.6), new Matrix3());
  const n = Matrix3.fromQuaternion(
    Quaternion.fromAxisAngle(new Vector3(0.5, 1.5, -1.2), 1.2),
    new Matrix3()
  );
  Matrix3.multiply(m, n, n);
  intersectPlaneTestCornersEdgesFaces(new Vector3(-5.1, 0.0, 0.1), n);
  t.end();
});

test.skip('intersectPlane fails without box parameter', t => {
  const plane = new Cartesian4(1.0, 0.0, 0.0, 0.0);
  t.throws(() => OrientedBoundingBox.intersectPlane(undefined, plane));
  t.end();
});

test.skip('intersectPlane fails without plane parameter', t => {
  const box = new OrientedBoundingBox(Vector3.IDENTITY, Matrix3.ZERO);
  t.throws(() => OrientedBoundingBox.intersectPlane(box, undefined));
  t.end();
});

function makeRotationY(angle) {
  const cosAngle = Math.cos(angle);
  const sinAngle = Math.sin(angle);
  return new Matrix3(cosAngle, 0.0, sinAngle, 0.0, 1.0, 0.0, -sinAngle, 0.0, cosAngle);
}

function makeRotationZ(angle, result) {
  const cosAngle = Math.cos(angle);
  const sinAngle = Math.sin(angle);
  return new Matrix3(cosAngle, -sinAngle, 0.0, sinAngle, cosAngle, 0.0, 0.0, 0.0, 1.0);
}

// eslint-disable-next-line max-statements
test('distanceSquaredTo', t => {
  const r0 = makeRotationZ(toRadians(-45.0));
  const r1 = makeRotationY(toRadians(45.0));

  const rotation = r1.multiplyRight(r0);
  const scale = new Vector3(2.0, 3.0, 4.0);
  const rotationScale = rotation.scale(scale);

  const center = new Vector3(4.0, 3.0, 2.0);

  const obb = new OrientedBoundingBox(center, rotationScale);

  const halfAxes = obb.halfAxes;
  const xAxis = Matrix3.getColumn(halfAxes, 0, new Vector3());
  const yAxis = Matrix3.getColumn(halfAxes, 1, new Vector3());
  const zAxis = Matrix3.getColumn(halfAxes, 2, new Vector3());

  // from positive x direction
  const cartesian = Vector3.multiplyByScalar(xAxis, 2.0, new Vector3());
  Vector3.add(cartesian, center, cartesian);

  let d = Vector3.distance(cartesian, center) - scale.x;
  let expected = d * d;
  expect(obb.distanceSquaredTo(cartesian)).toEqualEpsilon(expected, CesiumMath.EPSILON10);

  // from negative x direction
  Vector3.multiplyByScalar(xAxis, -2.0, cartesian);
  Vector3.add(cartesian, center, cartesian);

  d = Vector3.distance(cartesian, center) - scale.x;
  expected = d * d;
  expect(obb.distanceSquaredTo(cartesian)).toEqualEpsilon(expected, CesiumMath.EPSILON10);

  // from positive y direction
  Vector3.multiplyByScalar(yAxis, 2.0, cartesian);
  Vector3.add(cartesian, center, cartesian);

  d = Vector3.distance(cartesian, center) - scale.y;
  expected = d * d;
  expect(obb.distanceSquaredTo(cartesian)).toEqualEpsilon(expected, CesiumMath.EPSILON10);

  // from negative y direction
  Vector3.multiplyByScalar(yAxis, -2.0, cartesian);
  Vector3.add(cartesian, center, cartesian);

  d = Vector3.distance(cartesian, center) - scale.y;
  expected = d * d;
  expect(obb.distanceSquaredTo(cartesian)).toEqualEpsilon(expected, CesiumMath.EPSILON10);

  // from positive z direction
  Vector3.multiplyByScalar(zAxis, 2.0, cartesian);
  Vector3.add(cartesian, center, cartesian);

  d = Vector3.distance(cartesian, center) - scale.z;
  expected = d * d;
  expect(obb.distanceSquaredTo(cartesian)).toEqualEpsilon(expected, CesiumMath.EPSILON10);

  // from negative z direction
  Vector3.multiplyByScalar(zAxis, -2.0, cartesian);
  Vector3.add(cartesian, center, cartesian);

  d = Vector3.distance(cartesian, center) - scale.z;
  expected = d * d;
  expect(obb.distanceSquaredTo(cartesian)).toEqualEpsilon(expected, CesiumMath.EPSILON10);

  // from corner point
  Vector3.add(xAxis, yAxis, cartesian);
  Vector3.add(zAxis, cartesian, cartesian);

  const cornerDistance = Vector3.magnitude(cartesian);
  Vector3.add(cartesian, center, cartesian);

  d = Vector3.distance(cartesian, center) - cornerDistance;
  expected = d * d;
  expect(obb.distanceSquaredTo(cartesian)).toEqualEpsilon(expected, CesiumMath.EPSILON10);
  t.end();
});

test('distanceSquaredTo throws without box', t => {
  t.throws(() => new OrientedBoundingBox().distanceSquaredTo(new Vector3()));
  t.end();
});

test('distanceSquaredTo throws without cartesian', t => {
  t.throws(() => new OrientedBoundingBox().distanceSquaredTo(undefined));
  t.end();
});

// eslint-disable-next-line max-statements
test('computePlaneDistances', t => {
  const r0 = makeRotationZ(toRadians(-45.0));
  const r1 = makeRotationY(toRadians(45.0));

  const rotation = Matrix3.multiply(r1, r0, r0);
  const scale = new Vector3(2.0, 3.0, 4.0);
  const rotationScale = Matrix3.multiplyByScale(rotation, scale, rotation);

  const center = new Vector3(4.0, 3.0, 2.0);

  const obb = new OrientedBoundingBox(center, rotationScale);

  const halfAxes = obb.halfAxes;
  const xAxis = Matrix3.getColumn(halfAxes, 0, new Vector3());
  const yAxis = Matrix3.getColumn(halfAxes, 1, new Vector3());
  const zAxis = Matrix3.getColumn(halfAxes, 2, new Vector3());

  // from x direction
  const position = Vector3.multiplyByScalar(xAxis, 2.0, new Vector3());
  Vector3.add(position, center, position);

  const direction = Vector3.negate(xAxis, new Vector3());
  Vector3.normalize(direction, direction);

  const d = Vector3.distance(position, center);
  const expectedNear = d - scale.x;
  const expectedFar = d + scale.x;

  const distances = obb.computePlaneDistances(position, direction);
  expect(distances.start).toEqualEpsilon(expectedNear, CesiumMath.EPSILON14);
  expect(distances.stop).toEqualEpsilon(expectedFar, CesiumMath.EPSILON14);

  // from y direction
  Vector3.multiplyByScalar(yAxis, 2.0, position);
  Vector3.add(position, center, position);

  Vector3.negate(yAxis, direction);
  Vector3.normalize(direction, direction);

  d = Vector3.distance(position, center);
  expectedNear = d - scale.y;
  expectedFar = d + scale.y;

  obb.computePlaneDistances(position, direction, distances);
  expect(distances.start).toEqualEpsilon(expectedNear, CesiumMath.EPSILON14);
  expect(distances.stop).toEqualEpsilon(expectedFar, CesiumMath.EPSILON14);

  // from z direction
  Vector3.multiplyByScalar(zAxis, 2.0, position);
  Vector3.add(position, center, position);

  Vector3.negate(zAxis, direction);
  Vector3.normalize(direction, direction);

  d = Vector3.distance(position, center);
  expectedNear = d - scale.z;
  expectedFar = d + scale.z;

  obb.computePlaneDistances(position, direction, distances);
  expect(distances.start).toEqualEpsilon(expectedNear, CesiumMath.EPSILON14);
  expect(distances.stop).toEqualEpsilon(expectedFar, CesiumMath.EPSILON14);

  // from corner point
  Vector3.add(xAxis, yAxis, position);
  Vector3.add(zAxis, position, position);

  Vector3.negate(position, direction);
  Vector3.normalize(direction, direction);

  const cornerDistance = Vector3.magnitude(position);
  Vector3.add(position, center, position);

  d = Vector3.distance(position, center);
  expectedNear = d - cornerDistance;
  expectedFar = d + cornerDistance;

  obb.computePlaneDistances(position, direction, distances);
  expect(distances.start).toEqualEpsilon(expectedNear, CesiumMath.EPSILON14);
  expect(distances.stop).toEqualEpsilon(expectedFar, CesiumMath.EPSILON14);
  t.end();
});

test('computePlaneDistances throws without a box', t => {
  t.throws(() =>
    new OrientedBoundingBox().computePlaneDistances(undefined, new Vector3(), new Vector3())
  );
  t.end();
});

test('computePlaneDistances throws without a position', t => {
  t.throws(() => new OrientedBoundingBox().computePlaneDistances(undefined, new Vector3()));
  t.end();
});

test('computePlaneDistances throws without a direction', t => {
  t.throws(() => new OrientedBoundingBox().computePlaneDistances(new Vector3(), undefined));
  t.end();
});

/*
test('isOccluded', t => {
  const occluderSphere = new BoundingSphere(new Vector3(0, 0, -1.5), 0.5);
  const occluder = new Occluder(occluderSphere, Vector3.ZERO);

  const radius = 0.25 / Math.sqrt(2.0);
  const halfAxes = Matrix3.multiplyByScale(Matrix3.IDENTITY, new Vector3(radius, radius, radius), new Matrix3());
  const obb = new OrientedBoundingBox(new Vector3(0, 0, -2.75), halfAxes);
  t.equals(obb.isOccluded(occluder), true);

  occluderSphere = new BoundingSphere(new Vector3(0, 0, -2.75), 0.25);
  occluder = new Occluder(occluderSphere, Vector3.ZERO);

  radius = 0.5 / Math.sqrt(2.0);
  halfAxes = Matrix3.multiplyByScale(Matrix3.IDENTITY, new Vector3(radius, radius, radius), new Matrix3());
  obb = new OrientedBoundingBox(new Vector3(0, 0, -1.5), halfAxes);
  t.equals(obb.isOccluded(occluder), false);
  t.end();
});

test('isOccluded throws without a box', t => {
  t.throws(() => OrientedBoundingBox.isOccluded(undefined, new Occluder(new BoundingSphere(), new Vector3())));
  t.end();
});

test('isOccluded throws without a occluder', t => {
  t.throws(() => OrientedBoundingBox.isOccluded(new OrientedBoundingBox(), undefined));
  t.end();
});
*/

test.skip('fromPoints constructs empty box with undefined positions', t => {
  const box = OrientedBoundingBox.fromPoints(undefined);
  t.equals(box.halfAxes, Matrix3.ZERO);
  t.equals(box.center, Vector3.ZERO);
  t.end();
});

test.skip('fromPoints constructs empty box with empty positions', t => {
  const box = OrientedBoundingBox.fromPoints([]);
  t.equals(box.halfAxes, Matrix3.ZERO);
  t.equals(box.center, Vector3.ZERO);
  t.end();
});

test.skip('fromPoints correct scale', t => {
  const box = OrientedBoundingBox.fromPoints(positions);
  t.equals(box.halfAxes, Matrix3.fromScale(new Vector3(2.0, 3.0, 4.0)));
  t.equals(box.center, Vector3.ZERO);
  t.end();
});

test.skip('fromPoints correct translation', t => {
  const translation = new Vector3(10.0, -20.0, 30.0);
  const points = translatePositions(positions, translation);
  const box = OrientedBoundingBox.fromPoints(points);
  t.equals(box.halfAxes, Matrix3.fromScale(new Vector3(2.0, 3.0, 4.0)));
  t.equals(box.center, translation);
  t.end();
});

test.skip('fromPoints rotation about z', t => {
  const result = rotatePositions(positions, Vector3.UNIT_Z, CesiumMath.PI_OVER_FOUR);
  const points = result.points;
  const rotation = result.rotation;
  rotation[1] = -rotation[1];
  rotation[3] = -rotation[3];

  const box = OrientedBoundingBox.fromPoints(points);
  expect(box.halfAxes).toEqualEpsilon(
    Matrix3.multiplyByScale(rotation, new Vector3(3.0, 2.0, 4.0), new Matrix3()),
    CesiumMath.EPSILON15
  );
  expect(box.center).toEqualEpsilon(Vector3.ZERO, CesiumMath.EPSILON15);
  t.end();
});

test.skip('fromPoints rotation about y', t => {
  const result = rotatePositions(positions, Vector3.UNIT_Y, CesiumMath.PI_OVER_FOUR);
  const points = result.points;
  const rotation = result.rotation;
  rotation[2] = -rotation[2];
  rotation[6] = -rotation[6];

  const box = OrientedBoundingBox.fromPoints(points);
  expect(box.halfAxes).toEqualEpsilon(
    Matrix3.multiplyByScale(rotation, new Vector3(4.0, 3.0, 2.0), new Matrix3()),
    CesiumMath.EPSILON15
  );
  expect(box.center).toEqualEpsilon(Vector3.ZERO, CesiumMath.EPSILON15);
  t.end();
});

test.skip('fromPoints rotation about x', t => {
  const result = rotatePositions(positions, Vector3.UNIT_X, CesiumMath.PI_OVER_FOUR);
  const points = result.points;
  const rotation = result.rotation;
  rotation[5] = -rotation[5];
  rotation[7] = -rotation[7];

  const box = OrientedBoundingBox.fromPoints(points);
  expect(box.halfAxes).toEqualEpsilon(
    Matrix3.multiplyByScale(rotation, new Vector3(2.0, 4.0, 3.0), new Matrix3()),
    CesiumMath.EPSILON15
  );
  expect(box.center).toEqualEpsilon(Vector3.ZERO, CesiumMath.EPSILON15);
  t.end();
});

test.skip('fromPoints rotation and translation', t => {
  const result = rotatePositions(positions, Vector3.UNIT_Z, CesiumMath.PI_OVER_FOUR);
  const points = result.points;
  const rotation = result.rotation;
  rotation[1] = -rotation[1];
  rotation[3] = -rotation[3];

  const translation = new Vector3(-40.0, 20.0, -30.0);
  points = translatePositions(points, translation);

  const box = OrientedBoundingBox.fromPoints(points);
  expect(box.halfAxes).toEqualEpsilon(
    Matrix3.multiplyByScale(rotation, new Vector3(3.0, 2.0, 4.0), new Matrix3()),
    CesiumMath.EPSILON14
  );
  expect(box.center).toEqualEpsilon(translation, CesiumMath.EPSILON15);
  t.end();
});

test.skip('fromRectangle sets correct default ellipsoid', t => {
  const rectangle = new Rectangle(-0.9, -1.2, 0.5, 0.7);
  const box1 = OrientedBoundingBox.fromRectangle(rectangle, 0.0, 0.0);
  const box2 = OrientedBoundingBox.fromRectangle(rectangle, 0.0, 0.0, Ellipsoid.WGS84);

  expect(box1.center).toEqualEpsilon(box2.center, CesiumMath.EPSILON15);

  expect(box1.halfAxes).toEqualEpsilon(box2.halfAxes, CesiumMath.EPSILON15);
  t.end();
});

test.skip('fromRectangle sets correct default heights', t => {
  const rectangle = new Rectangle(0.0, 0.0, 0.0, 0.0);
  const box = OrientedBoundingBox.fromRectangle(
    rectangle,
    undefined,
    undefined,
    Ellipsoid.UNIT_SPHERE
  );

  expect(box.center).toEqualEpsilon(new Vector3(1.0, 0.0, 0.0), CesiumMath.EPSILON15);

  const rotScale = Matrix3.ZERO;
  expect(box.halfAxes).toEqualEpsilon(rotScale, CesiumMath.EPSILON15);
  t.end();
});

test.skip('fromRectangle throws without rectangle', t => {
  const ellipsoid = Ellipsoid.UNIT_SPHERE;
  t.throws(() => OrientedBoundingBox.fromRectangle(undefined, 0.0, 0.0, ellipsoid));
  t.end();
});

test.skip('fromRectangle throws with invalid rectangles', t => {
  const ellipsoid = Ellipsoid.UNIT_SPHERE;
  t.throws(() =>
    OrientedBoundingBox.fromRectangle(new Rectangle(-1.0, 1.0, 1.0, -1.0), 0.0, 0.0, ellipsoid)
  );
  t.throws(() =>
    OrientedBoundingBox.fromRectangle(new Rectangle(-2.0, 2.0, -1.0, 1.0), 0.0, 0.0, ellipsoid)
  );
  t.throws(() =>
    OrientedBoundingBox.fromRectangle(new Rectangle(-4.0, -2.0, 4.0, 1.0), 0.0, 0.0, ellipsoid)
  );
  t.throws(() =>
    OrientedBoundingBox.fromRectangle(new Rectangle(-2.0, -2.0, 1.0, 2.0), 0.0, 0.0, ellipsoid)
  );
  t.throws(() =>
    OrientedBoundingBox.fromRectangle(new Rectangle(-1.0, -2.0, 2.0, 2.0), 0.0, 0.0, ellipsoid)
  );
  t.throws(() =>
    OrientedBoundingBox.fromRectangle(new Rectangle(-4.0, -1.0, 4.0, 2.0), 0.0, 0.0, ellipsoid)
  );
  t.end();
});

test.skip('fromRectangle throws with non-revolution ellipsoids', t => {
  const rectangle = new Rectangle(0.0, 0.0, 0.0, 0.0);
  t.throws(() =>
    OrientedBoundingBox.fromRectangle(rectangle, 0.0, 0.0, new Ellipsoid(1.01, 1.0, 1.01))
  );
  t.throws(() =>
    OrientedBoundingBox.fromRectangle(rectangle, 0.0, 0.0, new Ellipsoid(1.0, 1.01, 1.01))
  );
  t.end();
});

test.skip('fromRectangle creates an OrientedBoundingBox without a result parameter', t => {
  const ellipsoid = Ellipsoid.UNIT_SPHERE;
  const rectangle = new Rectangle(0.0, 0.0, 0.0, 0.0);
  const box = OrientedBoundingBox.fromRectangle(rectangle, 0.0, 0.0, ellipsoid);

  expect(box.center).toEqualEpsilon(new Vector3(1.0, 0.0, 0.0), CesiumMath.EPSILON15);

  const rotScale = Matrix3.ZERO;
  expect(box.halfAxes).toEqualEpsilon(rotScale, CesiumMath.EPSILON15);
  t.end();
});

test.skip('fromRectangle creates an OrientedBoundingBox with a result parameter', t => {
  const ellipsoid = Ellipsoid.UNIT_SPHERE;
  const rectangle = new Rectangle(0.0, 0.0, 0.0, 0.0);
  const result = new OrientedBoundingBox();
  const box = OrientedBoundingBox.fromRectangle(rectangle, 0.0, 0.0, ellipsoid, result);
  expect(box).toBe(result);

  expect(box.center).toEqualEpsilon(new Vector3(1.0, 0.0, 0.0), CesiumMath.EPSILON15);

  const rotScale = Matrix3.ZERO;
  expect(box.halfAxes).toEqualEpsilon(rotScale, CesiumMath.EPSILON15);
  t.end();
});

test.skip('fromRectangle for rectangles with heights', t => {
  const d90 = CesiumMath.PI_OVER_TWO;

  let box;

  box = OrientedBoundingBox.fromRectangle(
    new Rectangle(0.0, 0.0, 0.0, 0.0),
    1.0,
    1.0,
    Ellipsoid.UNIT_SPHERE
  );
  expect(box.center).toEqualEpsilon(new Vector3(2.0, 0.0, 0.0), CesiumMath.EPSILON15);
  expect(box.halfAxes).toEqualEpsilon(Matrix3.ZERO, CesiumMath.EPSILON15);

  box = OrientedBoundingBox.fromRectangle(
    new Rectangle(0.0, 0.0, 0.0, 0.0),
    -1.0,
    -1.0,
    Ellipsoid.UNIT_SPHERE
  );
  expect(box.center).toEqualEpsilon(new Vector3(0.0, 0.0, 0.0), CesiumMath.EPSILON15);
  expect(box.halfAxes).toEqualEpsilon(Matrix3.ZERO, CesiumMath.EPSILON15);

  box = OrientedBoundingBox.fromRectangle(
    new Rectangle(0.0, 0.0, 0.0, 0.0),
    -1.0,
    1.0,
    Ellipsoid.UNIT_SPHERE
  );
  expect(box.center).toEqualEpsilon(new Vector3(1.0, 0.0, 0.0), CesiumMath.EPSILON15);
  expect(box.halfAxes).toEqualEpsilon(new Matrix3(0, 0, 1, 0, 0, 0, 0, 0, 0), CesiumMath.EPSILON15);

  box = OrientedBoundingBox.fromRectangle(
    new Rectangle(-d90, -d90, d90, d90),
    0.0,
    1.0,
    Ellipsoid.UNIT_SPHERE
  );
  expect(box.center).toEqualEpsilon(new Vector3(1.0, 0.0, 0.0), CesiumMath.EPSILON15);
  expect(box.halfAxes).toEqualEpsilon(new Matrix3(0, 0, 1, 2, 0, 0, 0, 2, 0), CesiumMath.EPSILON15);

  box = OrientedBoundingBox.fromRectangle(
    new Rectangle(-d90, -d90, d90, d90),
    -1.0,
    -1.0,
    Ellipsoid.UNIT_SPHERE
  );
  expect(box.center).toEqualEpsilon(new Vector3(0.0, 0.0, 0.0), CesiumMath.EPSILON15);
  expect(box.halfAxes).toEqualEpsilon(Matrix3.ZERO, CesiumMath.EPSILON15);

  box = OrientedBoundingBox.fromRectangle(
    new Rectangle(-d90, -d90, d90, d90),
    -1.0,
    0.0,
    Ellipsoid.UNIT_SPHERE
  );
  expect(box.center).toEqualEpsilon(new Vector3(0.5, 0.0, 0.0), CesiumMath.EPSILON15);
  expect(box.halfAxes).toEqualEpsilon(
    new Matrix3(0, 0, 0.5, 1, 0, 0, 0, 1, 0),
    CesiumMath.EPSILON15
  );
  t.end();
});

test.skip('fromRectangle for interesting, degenerate, and edge-case rectangles', t => {
  const d45 = CesiumMath.PI_OVER_FOUR;
  const d30 = CesiumMath.PI_OVER_SIX;
  const d90 = CesiumMath.PI_OVER_TWO;
  const d135 = 3 * CesiumMath.PI_OVER_FOUR;
  const d180 = CesiumMath.PI;
  const sqrt3 = Math.sqrt(3.0);

  let box;

  box = OrientedBoundingBox.fromRectangle(
    new Rectangle(0.0, 0.0, 0.0, 0.0),
    0.0,
    0.0,
    Ellipsoid.UNIT_SPHERE
  );
  expect(box.center).toEqualEpsilon(new Vector3(1.0, 0.0, 0.0), CesiumMath.EPSILON15);
  expect(box.halfAxes).toEqualEpsilon(Matrix3.ZERO, CesiumMath.EPSILON15);

  box = OrientedBoundingBox.fromRectangle(
    new Rectangle(d180, 0.0, -d180, 0.0),
    0.0,
    0.0,
    Ellipsoid.UNIT_SPHERE
  );
  expect(box.center).toEqualEpsilon(new Vector3(-1.0, 0.0, 0.0), CesiumMath.EPSILON15);
  expect(box.halfAxes).toEqualEpsilon(Matrix3.ZERO, CesiumMath.EPSILON15);

  box = OrientedBoundingBox.fromRectangle(
    new Rectangle(d180, 0.0, d180, 0.0),
    0.0,
    0.0,
    Ellipsoid.UNIT_SPHERE
  );
  expect(box.center).toEqualEpsilon(new Vector3(-1.0, 0.0, 0.0), CesiumMath.EPSILON15);
  expect(box.halfAxes).toEqualEpsilon(Matrix3.ZERO, CesiumMath.EPSILON15);

  box = OrientedBoundingBox.fromRectangle(
    new Rectangle(0.0, d90, 0.0, d90),
    0.0,
    0.0,
    Ellipsoid.UNIT_SPHERE
  );
  expect(box.center).toEqualEpsilon(new Vector3(0.0, 0.0, 1.0), CesiumMath.EPSILON15);
  expect(box.halfAxes).toEqualEpsilon(Matrix3.ZERO, CesiumMath.EPSILON15);

  box = OrientedBoundingBox.fromRectangle(
    new Rectangle(0.0, 0.0, d180, 0.0),
    0.0,
    0.0,
    Ellipsoid.UNIT_SPHERE
  );
  expect(box.center).toEqualEpsilon(new Vector3(0.0, 0.5, 0.0), CesiumMath.EPSILON15);
  expect(box.halfAxes).toEqualEpsilon(
    new Matrix3(-1.0, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0),
    CesiumMath.EPSILON15
  );

  box = OrientedBoundingBox.fromRectangle(
    new Rectangle(-d90, -d90, d90, d90),
    0.0,
    0.0,
    Ellipsoid.UNIT_SPHERE
  );
  expect(box.center).toEqualEpsilon(new Vector3(0.5, 0.0, 0.0), CesiumMath.EPSILON15);
  expect(box.halfAxes).toEqualEpsilon(
    new Matrix3(0.0, 0.0, 0.5, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0),
    CesiumMath.EPSILON15
  );

  box = OrientedBoundingBox.fromRectangle(
    new Rectangle(-d90, -d30, d90, d90),
    0.0,
    0.0,
    Ellipsoid.UNIT_SPHERE
  );
  expect(box.center).toEqualEpsilon(new Vector3(0.1875 * sqrt3, 0.0, 0.1875), CesiumMath.EPSILON15);
  expect(box.halfAxes).toEqualEpsilon(
    new Matrix3(0, -sqrt3 / 4, (5 * sqrt3) / 16, 1, 0, 0, 0, 3 / 4, 5 / 16),
    CesiumMath.EPSILON15
  );

  box = OrientedBoundingBox.fromRectangle(
    new Rectangle(-d90, -d90, d90, d30),
    0.0,
    0.0,
    Ellipsoid.UNIT_SPHERE
  );
  expect(box.center).toEqualEpsilon(
    new Vector3(0.1875 * sqrt3, 0.0, -0.1875),
    CesiumMath.EPSILON15
  );
  expect(box.halfAxes).toEqualEpsilon(
    new Matrix3(0, sqrt3 / 4, (5 * sqrt3) / 16, 1, 0, 0, 0, 3 / 4, -5 / 16),
    CesiumMath.EPSILON15
  );

  box = OrientedBoundingBox.fromRectangle(
    new Rectangle(0.0, -d30, d180, d90),
    0.0,
    0.0,
    Ellipsoid.UNIT_SPHERE
  );
  expect(box.center).toEqualEpsilon(new Vector3(0.0, 0.1875 * sqrt3, 0.1875), CesiumMath.EPSILON15);
  expect(box.halfAxes).toEqualEpsilon(
    new Matrix3(-1, 0, 0, 0, -sqrt3 / 4, (5 * sqrt3) / 16, 0, 3 / 4, 5 / 16),
    CesiumMath.EPSILON15
  );

  box = OrientedBoundingBox.fromRectangle(
    new Rectangle(0.0, -d90, d180, d30),
    0.0,
    0.0,
    Ellipsoid.UNIT_SPHERE
  );
  expect(box.center).toEqualEpsilon(
    new Vector3(0.0, 0.1875 * sqrt3, -0.1875),
    CesiumMath.EPSILON15
  );
  expect(box.halfAxes).toEqualEpsilon(
    new Matrix3(-1, 0, 0, 0, sqrt3 / 4, (5 * sqrt3) / 16, 0, 3 / 4, -5 / 16),
    CesiumMath.EPSILON15
  );

  box = OrientedBoundingBox.fromRectangle(
    new Rectangle(-d45, 0.0, d45, 0.0),
    0.0,
    0.0,
    Ellipsoid.UNIT_SPHERE
  );
  expect(box.center).toEqualEpsilon(
    new Vector3((1.0 + Math.SQRT1_2) / 2.0, 0.0, 0.0),
    CesiumMath.EPSILON15
  );
  expect(box.halfAxes).toEqualEpsilon(
    new Matrix3(0.0, 0.0, 0.5 * (1.0 - Math.SQRT1_2), Math.SQRT1_2, 0.0, 0.0, 0.0, 0.0, 0.0),
    CesiumMath.EPSILON15
  );

  box = OrientedBoundingBox.fromRectangle(
    new Rectangle(d135, 0.0, -d135, 0.0),
    0.0,
    0.0,
    Ellipsoid.UNIT_SPHERE
  );
  expect(box.center).toEqualEpsilon(
    new Vector3(-(1.0 + Math.SQRT1_2) / 2.0, 0.0, 0.0),
    CesiumMath.EPSILON15
  );
  expect(box.halfAxes).toEqualEpsilon(
    new Matrix3(0.0, 0.0, -0.5 * (1.0 - Math.SQRT1_2), -Math.SQRT1_2, 0.0, 0.0, 0.0, 0.0, 0.0),
    CesiumMath.EPSILON15
  );

  box = OrientedBoundingBox.fromRectangle(
    new Rectangle(0.0, -d45, 0.0, d45),
    0.0,
    0.0,
    Ellipsoid.UNIT_SPHERE
  );
  expect(box.center).toEqualEpsilon(
    new Vector3((1.0 + Math.SQRT1_2) / 2.0, 0.0, 0.0),
    CesiumMath.EPSILON15
  );
  expect(box.halfAxes).toEqualEpsilon(
    new Matrix3(0.0, 0.0, 0.5 * (1.0 - Math.SQRT1_2), 0.0, 0.0, 0.0, 0.0, Math.SQRT1_2, 0.0),
    CesiumMath.EPSILON15
  );

  box = OrientedBoundingBox.fromRectangle(
    new Rectangle(-d90, 0.0, d90, 0.0),
    0.0,
    0.0,
    Ellipsoid.UNIT_SPHERE
  );
  expect(box.center).toEqualEpsilon(new Vector3(0.5, 0.0, 0.0), CesiumMath.EPSILON15);
  expect(box.halfAxes).toEqualEpsilon(
    new Matrix3(0.0, 0.0, 0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0),
    CesiumMath.EPSILON15
  );

  box = OrientedBoundingBox.fromRectangle(
    new Rectangle(0.0, -d90, 0.0, d90),
    0.0,
    0.0,
    Ellipsoid.UNIT_SPHERE
  );
  expect(box.center).toEqualEpsilon(new Vector3(0.5, 0.0, 0.0), CesiumMath.EPSILON15);
  expect(box.halfAxes).toEqualEpsilon(
    new Matrix3(0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0),
    CesiumMath.EPSILON15
  );

  t.end();
});
