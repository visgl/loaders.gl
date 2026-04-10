/* eslint-disable */
/*
import test from 'tape-promise/tape';
import {GLBParser, GLBBuilder} from '@loaders.gl/gltf';

import TEST_JSON from '@loaders.gl/gltf/test/data/glb/test-data.json';

const TEST_CASES = {
  flat: {
    vertices: [
      [
        12.458602928956001,
        2.7320427081205123,
        0,
        11.504415873922731,
        4.285679511764174,
        0,
        15.282629201197484,
        6.606120324948342,
        0,
        16.236816256230753,
        5.05248352130468,
        0,
        12.458602928956001,
        2.7320427081205123,
        0
      ]
    ]
  },

  nested: {
    vertices: [
      [12.458602928956001, 2.7320427081205123, 0],
      [11.504415873922731, 4.285679511764174, 0],
      [15.282629201197484, 6.606120324948342, 0],
      [16.236816256230753, 5.05248352130468, 0],
      [12.458602928956001, 2.7320427081205123, 0]
    ]
  },

  full: TEST_JSON
};

test('GLB#encode-and-parse', t => {
  for (const tcName in TEST_CASES) {
    const TEST_JSON = TEST_CASES[tcName];

    const arrayBuffer = new GLBBuilder().addApplicationData('extras', TEST_JSON).encodeAsGLB();
    const json = new GLBParser().parseSync(arrayBuffer).getJSON();

    t.ok(Array.isArray(json.buffers), `${tcName} Encoded and parsed GLB - has JSON buffers field`);
    t.ok(
      Array.isArray(json.bufferViews),
      `${tcName} Encoded and parsed GLB - has JSON bufferViews field`
    );
    t.ok(
      Array.isArray(json.accessors),
      `${tcName} Encoded and parsed GLB - has JSON accessors field`
    );

    // t.deepEqual(
    //   toLowPrecision(json.extras),
    //   toLowPrecision(packBinaryJson(TEST_JSON)),
    //   `${tcName} Encoded and parsed GLB did not change data`
    // );
  }

  t.end();
});

test('GLB#encode-and-parse#full', t => {
  const tcName = 'full';
  const TEST_JSON = TEST_CASES[tcName];

  const arrayBuffer = new GLBBuilder().addApplicationData('extras', TEST_JSON).encodeAsGLB();
  const json = new GLBParser().parseSync(arrayBuffer).getJSON();

  // t.comment(JSON.stringify(TEST_JSON, null, 2));
  // t.comment(JSON.stringify(json, null, 2))

  t.ok(Array.isArray(json.buffers), `${tcName} Encoded and parsed GLB - has JSON buffers field`);
  t.ok(
    Array.isArray(json.bufferViews),
    `${tcName} Encoded and parsed GLB - has JSON bufferViews field`
  );
  t.ok(
    Array.isArray(json.accessors),
    `${tcName} Encoded and parsed GLB - has JSON accessors field`
  );

  delete json.buffers;
  delete json.bufferViews;
  delete json.accessors;

  // t.deepEqual(
  //   json.extras.state_updates[0].primitives.tracklets[0],
  //   packBinaryJson(TEST_JSON.state_updates[0].primitives.tracklets[0]),
  //   'Encoded and parsed GLB did not change data'
  // );

  t.end();
});
*/
