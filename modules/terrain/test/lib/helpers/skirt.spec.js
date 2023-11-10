// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import {addSkirt} from '../../../src/lib/helpers/skirt';

test('TerrainLoader-skirting#addSkirt', (t) => {
  const attributes = {
    POSITION: {
      value: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    },
    TEXCOORD_0: {
      value: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8])
    }
  };
  const triangles = new Uint16Array([0, 1, 2, 0, 2, 3]);
  const addSkirtResult = addSkirt(attributes, triangles, 20);
  // prettier-ignore
  t.deepEqual(attributes.POSITION.value, 
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, -17, 4, 5, -14, 10, 11, -8, 1, 2, -17, 4, 5, -14, 7, 8, -11, 7, 8, -11, 10, 11, -8], 
    'Make correct POSITION attribute');
  t.deepEqual(
    attributes.TEXCOORD_0.value,
    [1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 7, 8, 1, 2, 3, 4, 5, 6, 5, 6, 7, 8],
    'Make correct TEXCOORD_0 attribute'
  );
  t.deepEqual(
    addSkirtResult.triangles,
    [0, 1, 2, 0, 2, 3, 0, 5, 1, 5, 0, 4, 3, 7, 0, 7, 3, 6, 1, 9, 2, 9, 1, 8, 2, 11, 3, 11, 2, 10],
    'Make correct indices array of the mesh geometry'
  );
  t.end();
});
