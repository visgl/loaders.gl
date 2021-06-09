import test from 'tape';
import {Vector3} from '@math.gl/core';
import {GL, computeVertexNormals} from '@loaders.gl/math';

function getNormalsForVertices(vertices, t) {
  const positions = {values: new Float32Array(vertices), size: 3};

  const normals = computeVertexNormals({mode: GL.TRIANGLES, attributes: {positions}});

  t.ok(normals, 'normal attribute was created');

  return normals;
}

// eslint-disable-next-line complexity
test('computeVertexNormals (non-indexed)', (t) => {
  // get normals for a counter clockwise created triangle
  let normals = getNormalsForVertices([-1, 0, 0, 1, 0, 0, 0, 1, 0], t);

  t.ok(
    normals[0] === 0 && normals[1] === 0 && normals[2] === 1,
    'first normal is pointing to screen since the the triangle was created counter clockwise'
  );

  t.ok(
    normals[3] === 0 && normals[4] === 0 && normals[5] === 1,
    'second normal is pointing to screen since the the triangle was created counter clockwise'
  );

  t.ok(
    normals[6] === 0 && normals[7] === 0 && normals[8] === 1,
    'third normal is pointing to screen since the the triangle was created counter clockwise'
  );

  // get normals for a clockwise created triangle
  normals = getNormalsForVertices([1, 0, 0, -1, 0, 0, 0, 1, 0], t);

  t.ok(
    normals[0] === 0 && normals[1] === 0 && normals[2] === -1,
    'first normal is pointing to screen since the the triangle was created clockwise'
  );

  t.ok(
    normals[3] === 0 && normals[4] === 0 && normals[5] === -1,
    'second normal is pointing to screen since the the triangle was created clockwise'
  );

  t.ok(
    normals[6] === 0 && normals[7] === 0 && normals[8] === -1,
    'third normal is pointing to screen since the the triangle was created clockwise'
  );

  normals = getNormalsForVertices([0, 0, 1, 0, 0, -1, 1, 1, 0], t);

  // the triangle is rotated by 45 degrees to the right so the normals of the three vertices
  // should point to (1, -1, 0).normalized(). The simplest solution is to check against a normalized
  // vector (1, -1, 0) but you will get calculation errors because of floating calculations so another
  // valid technique is to create a vector which stands in 90 degrees to the normals and calculate the
  // dot product which is the cos of the angle between them. This should be < floating calculation error
  // which can be taken from Number.EPSILON
  const direction = new Vector3(1, 1, 0).normalize(); // a vector which should have 90 degrees difference to normals
  const difference = direction.dot(new Vector3(normals[0], normals[1], normals[2]));
  t.ok(difference < Number.EPSILON, 'normal is equal to reference vector');

  // get normals for a line should be NAN because you need min a triangle to calculate normals
  normals = getNormalsForVertices([1, 0, 0, -1, 0, 0], t);

  for (let i = 0; i < normals.length; i++) {
    t.ok(!normals[i], "normals can't be calculated which is good");
  }
});

test('computeVertexNormals (indexed)', (t) => {
  const sqrt = 0.5 * Math.sqrt(2);

  const normal = {
    size: 3,
    // prettier-ignore
    values: new Float32Array([
      -1, 0, 0, 1, 0, 0, 1, 0, 0, sqrt, sqrt, 0, sqrt, sqrt, 0, sqrt, sqrt, 0, 1, 0, 0
    ])
  };

  const attributes = {
    positions: {
      size: 3,
      // prettier-ignore
      values: new Float32Array([
        0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5,
        -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5
      ])
    }
  };

  const indices = {size: 1, values: new Uint16Array([0, 2, 1, 2, 3, 1, 4, 6, 5, 6, 7, 5])};

  let computedNormals = computeVertexNormals({mode: GL.TRIANGLES, attributes});
  t.deepEqual(normal, computedNormals, 'Regular geometry: first computed normals are correct');

  // a second time to see if the existing normals get properly deleted
  computedNormals = computeVertexNormals({mode: GL.TRIANGLES, attributes});
  t.deepEqual(normal, computedNormals, 'Regular geometry: second computed normals are correct');

  // indexed geometry
  computedNormals = computeVertexNormals({mode: GL.TRIANGLES, indices, attributes});
  t.deepEqual(normal, computedNormals, 'Indexed geometry: computed normals are correct');

  t.end();
});
