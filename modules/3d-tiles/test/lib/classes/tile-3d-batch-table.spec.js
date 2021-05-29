import test from 'tape-promise/tape';
import {Tile3DBatchTable} from '@loaders.gl/3d-tiles';
import {concatTypedArrays} from '@loaders.gl/math'; // '@math.gl/geometry';
// import {loadTileset} from '../utils/load-utils';

// const WITH_BATCH_TABLE_URL =
//  '@loaders.gl/3d-tiles/test/data//Batched/BatchedWithBatchTable/tileset.json';
// const WITHOUT_BATCH_TABLE_URL =
//   '@loaders.gl/3d-tiles/test/data//Batched/BatchedWithoutBatchTable/tileset.json';
// const NO_BATCH_IDS_URL = '@loaders.gl/3d-tiles/test/data//Batched/BatchedNoBatchIds/tileset.json';

const MOCK_TILESET = {
  _statistics: {
    texturesByteLength: 0
  },
  getFeature(batchId) {
    return {
      batchId
    };
  }
};

MOCK_TILESET._tileset = MOCK_TILESET;

function transpose(matrix) {
  const n = Math.sqrt(matrix.length);
  const transposed = matrix.map((_, i, a) => a[(i % n) * n + Math.floor(i / n)]);
  return transposed;
}

/*
  spyOn(Tile3DBatchTable, '_deprecationWarning');
  spyOn(Batched3DModel3DTileContent, '_deprecationWarning');
*/

test('Tile3DBatchTable#hasProperty throws with invalid batchId', t => {
  const batchTable = new Tile3DBatchTable({}, null, 1);
  t.throws(() => batchTable.hasProperty());
  t.throws(() => batchTable.hasProperty(-1));
  t.throws(() => batchTable.hasProperty(2));
  t.end();
});

test('Tile3DBatchTable#hasProperty throws with undefined name', t => {
  const batchTable = new Tile3DBatchTable({}, null, 1);
  t.throws(() => batchTable.hasProperty(0));
  t.end();
});

test('Tile3DBatchTable#hasProperty', t => {
  const BATCH_TABLE_JSON = {
    height: [0.0]
  };
  const batchTable = new Tile3DBatchTable(BATCH_TABLE_JSON, null, 1);
  t.deepEquals(batchTable.hasProperty(0, 'height'), true);
  t.deepEquals(batchTable.hasProperty(0, 'id'), false);
  t.end();
});

test('Tile3DBatchTable#getPropertyNames throws with invalid batchId', t => {
  const batchTable = new Tile3DBatchTable({}, null, 1);
  t.throws(() => batchTable.getPropertyNames());
  t.throws(() => batchTable.getPropertyNames(-1));
  t.throws(() => batchTable.getPropertyNames(2));
  t.end();
});

test('Tile3DBatchTable#getPropertyNames', t => {
  let batchTable = new Tile3DBatchTable({}, null, 1);
  t.deepEquals(batchTable.getPropertyNames(0), []);

  const BATCH_TABLE_JSON = {
    height: [0.0],
    id: [0]
  };
  batchTable = new Tile3DBatchTable(BATCH_TABLE_JSON, null, 1);
  t.deepEquals(batchTable.getPropertyNames(0), ['height', 'id']);
  t.end();
});

test('Tile3DBatchTable#getPropertyNames works with results argument', t => {
  const BATCH_TABLE_JSON = {
    height: [0.0],
    id: [0]
  };
  const batchTable = new Tile3DBatchTable(BATCH_TABLE_JSON, null, 1);
  const results = [];
  const names = batchTable.getPropertyNames(0, results);
  t.equals(names, results);
  t.deepEquals(names, ['height', 'id']);
  t.end();
});

test('Tile3DBatchTable#getProperty throws with invalid batchId', t => {
  const batchTable = new Tile3DBatchTable({}, null, 1);
  t.throws(() => batchTable.getProperty());
  t.throws(() => batchTable.getProperty(-1));
  t.throws(() => batchTable.getProperty(2));
  t.end();
});

test('Tile3DBatchTable#getProperty throws with undefined name', t => {
  const batchTable = new Tile3DBatchTable({}, null, 1);
  t.throws(() => batchTable.getProperty(0));
  t.end();
});

test('Tile3DBatchTable#getProperty', t => {
  let batchTable = new Tile3DBatchTable({}, null, 1);
  t.equals(batchTable.getProperty(0, 'height'), undefined);

  const BATCH_TABLE_JSON = {
    height: [1.0]
  };
  batchTable = new Tile3DBatchTable(BATCH_TABLE_JSON, null, 1);
  t.deepEquals(batchTable.getProperty(0, 'height'), 1.0);
  t.equals(batchTable.getProperty(0, 'id'), undefined);
  t.end();
});

test('Tile3DBatchTable#setProperty throws with invalid batchId', t => {
  const batchTable = new Tile3DBatchTable({}, null, 1);
  t.throws(() => batchTable.setProperty());
  t.throws(() => batchTable.setProperty(-1));
  t.throws(() => batchTable.setProperty(2));
  t.end();
});

test('Tile3DBatchTable#setProperty throws with undefined name', t => {
  const batchTable = new Tile3DBatchTable({}, null, 1);
  t.throws(() => batchTable.setProperty(0));
  t.end();
});

test('Tile3DBatchTable#setProperty without existing batch table', t => {
  // Check that a batch table is created with a height of 1.0 for the first resource and undefined for the others
  const batchTable = new Tile3DBatchTable({}, null, 3);
  batchTable.setProperty(0, 'height', 1.0);

  t.deepEquals(batchTable._properties.height.length, 3);
  t.deepEquals(batchTable.getProperty(0, 'height'), 1.0);
  t.equals(batchTable.getProperty(1, 'height'), undefined);
  t.equals(batchTable.getProperty(2, 'height'), undefined);
  t.end();
});

test('Tile3DBatchTable#setProperty with existing batch table', t => {
  const BATCH_TABLE_JSON = {
    height: [1.0, 2.0]
  };
  const batchTable = new Tile3DBatchTable(BATCH_TABLE_JSON, null, 2);
  batchTable.setProperty(0, 'height', 3.0);

  t.deepEquals(batchTable.getProperty(0, 'height'), 3.0);
  t.deepEquals(batchTable.getProperty(1, 'height'), 2.0);
  t.end();
});

test('Tile3DBatchTable#setProperty with object value', t => {
  const BATCH_TABLE_JSON = {
    info: [
      {name: 'building0', year: 2000},
      {name: 'building1', year: 2001}
    ]
  };
  const batchTable = new Tile3DBatchTable(BATCH_TABLE_JSON, null, 2);
  batchTable.setProperty(0, 'info', {name: 'building0_new', year: 2002});

  t.deepEquals(batchTable.getProperty(0, 'info'), {name: 'building0_new', year: 2002});
  t.deepEquals(batchTable.getProperty(1, 'info'), {name: 'building1', year: 2001});
  t.end();
});

test('Tile3DBatchTable#setProperty with array value', t => {
  const BATCH_TABLE_JSON = {
    rooms: [
      ['room1', 'room2'],
      ['room3', 'room4']
    ]
  };
  const batchTable = new Tile3DBatchTable(BATCH_TABLE_JSON, null, 2);
  batchTable.setProperty(0, 'rooms', ['room1_new', 'room2']);

  t.deepEquals(batchTable.getProperty(0, 'rooms'), ['room1_new', 'room2']);
  t.deepEquals(batchTable.getProperty(1, 'rooms'), ['room3', 'room4']);
  t.end();
});

test('Tile3DBatchTable#throws if the binary property does not specify a componentType', t => {
  const BATCH_TABLE_JSON = {
    propertyScalar: {
      byteOffset: 0,
      type: 'SCALAR'
    }
  };
  const batchTableBinary = new Float64Array([0, 1]);
  t.throws(() => new Tile3DBatchTable(BATCH_TABLE_JSON, batchTableBinary, 2));
  t.end();
});

test('Tile3DBatchTable#throws if the binary property does not specify a type', t => {
  const BATCH_TABLE_JSON = {
    propertyScalar: {
      byteOffset: 0,
      componentType: 'DOUBLE'
    }
  };
  const batchTableBinary = new Float64Array([0, 1]);
  t.throws(() => new Tile3DBatchTable(BATCH_TABLE_JSON, batchTableBinary, 2));
  t.end();
});

test('Tile3DBatchTable#throws if a binary property exists but there is no batchTableBinary', t => {
  const BATCH_TABLE_JSON = {
    propertyScalar: {
      byteOffset: 0,
      componentType: 'DOUBLE',
      type: 'SCALAR'
    }
  };
  t.throws(() => new Tile3DBatchTable(BATCH_TABLE_JSON, null, 2));
  t.end();
});

// eslint-disable-next-line max-statements
test('Tile3DBatchTable#getProperty and setProperty work for binary properties', t => {
  const propertyScalarBinary = new Float64Array([0, 1]);
  const propertyVec2Binary = new Float32Array([2, 3, 4, 5]);
  const propertyVec3Binary = new Int32Array([6, 7, 8, 9, 10, 11]);
  const propertyVec4Binary = new Uint32Array([12, 13, 14, 15, 16, 17, 18, 19]);
  const propertyMat2Binary = new Int16Array([20, 21, 22, 23, 24, 25, 26, 27]);
  // prettier-ignore
  const propertyMat3Binary = new Uint16Array([
    28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45
  ]);
  // prettier-ignore
  const propertyMat4Binary = new Uint8Array([
    46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
    64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77
  ]);

  const buffers = [
    propertyScalarBinary,
    propertyVec2Binary,
    propertyVec3Binary,
    propertyVec4Binary,
    propertyMat2Binary,
    propertyMat3Binary,
    propertyMat4Binary
  ];
  const batchTableBinary = concatTypedArrays(buffers);
  const BATCH_TABLE_JSON = {
    propertyScalar: {
      byteOffset: 0,
      componentType: 'DOUBLE',
      type: 'SCALAR'
    },
    propertyVec2: {
      byteOffset: 16,
      componentType: 'FLOAT',
      type: 'VEC2'
    },
    propertyVec3: {
      byteOffset: 32,
      componentType: 'INT',
      type: 'VEC3'
    },
    propertyVec4: {
      byteOffset: 56,
      componentType: 'UNSIGNED_INT',
      type: 'VEC4'
    },
    propertyMat2: {
      byteOffset: 88,
      componentType: 'SHORT',
      type: 'MAT2'
    },
    propertyMat3: {
      byteOffset: 104,
      componentType: 'UNSIGNED_SHORT',
      type: 'MAT3'
    },
    propertyMat4: {
      byteOffset: 140,
      componentType: 'UNSIGNED_BYTE',
      type: 'MAT4'
    }
  };

  const batchTable = new Tile3DBatchTable(BATCH_TABLE_JSON, batchTableBinary, 2);

  t.deepEquals(batchTable.getProperty(1, 'propertyScalar'), 1);
  t.deepEquals(batchTable.getProperty(1, 'propertyVec2'), [4, 5]);
  t.deepEquals(batchTable.getProperty(1, 'propertyVec3'), [9, 10, 11]);
  t.deepEquals(batchTable.getProperty(1, 'propertyVec4'), [16, 17, 18, 19]);
  t.deepEquals(batchTable.getProperty(1, 'propertyMat2'), transpose([24, 26, 25, 27])); // data is column major
  t.deepEquals(
    batchTable.getProperty(1, 'propertyMat3'),
    transpose([37, 40, 43, 38, 41, 44, 39, 42, 45]) // data is column major
  );
  // prettier-ignore
  t.deepEquals(
    batchTable.getProperty(1, 'propertyMat4'),
    transpose([62, 66, 70, 74, 63, 67, 71, 75, 64, 68, 72, 76, 65, 69, 73, 77])
  ); // Constructor is row-major, data is column major

  batchTable.setProperty(1, 'propertyScalar', 2);
  batchTable.setProperty(1, 'propertyVec2', [5, 6]);
  batchTable.setProperty(1, 'propertyVec3', [10, 11, 12]);
  batchTable.setProperty(1, 'propertyVec4', [17, 18, 19, 20]);
  batchTable.setProperty(1, 'propertyMat2', transpose([25, 27, 26, 28]));
  batchTable.setProperty(1, 'propertyMat3', transpose([38, 41, 44, 39, 42, 45, 40, 43, 46]));
  // prettier-ignore
  batchTable.setProperty(1, 'propertyMat4', transpose([
    63, 67, 71, 75, 64, 68, 72, 76, 65, 69, 73, 77, 66, 70, 74, 78
  ]));

  t.deepEquals(batchTable.getProperty(1, 'propertyScalar'), 2);
  t.deepEquals(batchTable.getProperty(1, 'propertyVec2'), [5, 6]);
  t.deepEquals(batchTable.getProperty(1, 'propertyVec3'), [10, 11, 12]);
  t.deepEquals(batchTable.getProperty(1, 'propertyVec4'), [17, 18, 19, 20]);
  t.deepEquals(batchTable.getProperty(1, 'propertyMat2'), transpose([25, 27, 26, 28]));
  t.deepEquals(
    batchTable.getProperty(1, 'propertyMat3'),
    transpose([38, 41, 44, 39, 42, 45, 40, 43, 46])
  );
  // prettier-ignore
  t.deepEquals(batchTable.getProperty(1, 'propertyMat4'), transpose([
    63, 67, 71, 75, 64, 68, 72, 76, 65, 69, 73, 77, 66, 70, 74, 78
  ]));

  t.end();
});

/*
test('Tile3DBatchTable#renders tileset with batch table', async t => {
  const tileset = await loadTileset(t, WITH_BATCH_TABLE_URL);
  const content = tileset.root.content;

  // Each feature in the b3dm file has an id property from 0 to 9,
  // check that the 2nd resource has an id of 2
  t.deepEquals(content.getFeature(2).getProperty('id'), 2);

  // Check that a property can be an array
  t.deepEquals(content.getFeature(2).getProperty('rooms'), ['room2_a', 'room2_b', 'room2_c']);

  // Check that a property can be an object
  t.deepEquals(content.getFeature(2).getProperty('info'), {name: 'building2', year: 2});

  // Cesium3DTilesTester.expectRenderTileset(scene, tileset);

  t.end();
});

test('Tile3DBatchTable#renders tileset without batch table', async t => {
  const tileset = await loadTileset(t, WITHOUT_BATCH_TABLE_URL);
  const content = tileset.root.content;

  t.equals(content.getFeature(2).getProperty('id'), undefined);

  // Cesium3DTilesTester.expectRenderTileset(scene, tileset);

  t.end();
});

test('Tile3DBatchTable#renders when vertex texture fetch is not supported', async t => {
  // Disable VTF
  // const maximumVertexTextureImageUnits = ContextLimits.maximumVertexTextureImageUnits;
  // ContextLimits._maximumVertexTextureImageUnits = 0;

  const tileset = await loadTileset(t, WITHOUT_BATCH_TABLE_URL);
  const content = tileset.root.content;
  t.ok(content.featuresLength > 0);

  // Cesium3DTilesTester.expectRenderTileset(scene, tileset);

  // Re-enable VTF
  // ContextLimits._maximumVertexTextureImageUnits = maximumVertexTextureImageUnits;

  t.end();
});

test('Tile3DBatchTable#renders with featuresLength greater than maximumTextureSize', async t => {
  // Set maximum texture size to 4 temporarily. Batch length of b3dm file is 10.
  // const maximumTextureSize = ContextLimits.maximumTextureSize;
  // ContextLimits._maximumTextureSize = 4;

  const tileset = await loadTileset(t, WITHOUT_BATCH_TABLE_URL);
  const content = tileset.root.content;
  t.ok(content.featuresLength > 0);

  // t.ok(content.featuresLength > ContextLimits._maximumTextureSize);

  // Cesium3DTilesTester.expectRenderTileset(scene, tileset);
  // Reset maximum texture size
  // ContextLimits._maximumTextureSize = maximumTextureSize;

  t.end();
});

test('Tile3DBatchTable#renders with featuresLength of zero', async t => {
  const tileset = await loadTileset(t, NO_BATCH_IDS_URL);
  t.ok(tileset);

  // Cesium3DTilesTester.expectRender(scene, tileset);

  // expect(scene).toPickAndCall(function(result) {
  //   t.notEquals(result, undefined);
  //   t.equals(result.primitive, tileset);
  // });

  t.end();
});

function expectRenderTranslucent(tileset) {
  const batchTable = tileset.root.content.batchTable;

  // Get initial color
  let opaqueColor;
  Cesium3DTilesTester.expectRender(scene, tileset, rgba => {
    opaqueColor = rgba;
  });

  // Render translucent
  batchTable.setAllColor(new Color(1.0, 1.0, 1.0, 0.5));
  Cesium3DTilesTester.expectRender(scene, tileset, rgba => {
    expect(rgba).not.toEqual(opaqueColor);
  });

  // Render restored to opaque
  batchTable.setAllColor(Color.WHITE);
  Cesium3DTilesTester.expectRender(scene, tileset, rgba => {
    t.deepEquals(rgba, opaqueColor);
  });

  // Generate both translucent and opaque commands
  batchTable.setColor(0, new Color(1.0, 1.0, 1.0, 0.5));
  Cesium3DTilesTester.expectRender(scene, tileset);

  // Fully transparent
  batchTable.setAllColor(new Color(1.0, 1.0, 1.0, 0.0));
  Cesium3DTilesTester.expectRenderBlank(scene, tileset);
}

test('Tile3DBatchTable#renders translucent style', async t => {
  const tileset = await loadTileset(t, WITHOUT_BATCH_TABLE_URL);
  expectRenderTranslucent(tileset);

  t.end();
});

test('Tile3DBatchTable#renders translucent style when vertex texture fetch is not supported', async t => {
  // Disable VTF
  const maximumVertexTextureImageUnits = ContextLimits.maximumVertexTextureImageUnits;
  ContextLimits._maximumVertexTextureImageUnits = 0;
  const tileset = await loadTileset(t, WITHOUT_BATCH_TABLE_URL);
  expectRenderTranslucent(tileset);
  // Re-enable VTF
  ContextLimits._maximumVertexTextureImageUnits = maximumVertexTextureImageUnits;
  t.end();
});
*/

test('Tile3DBatchTable#isExactClass throws with invalid batchId', t => {
  const batchTable = new Tile3DBatchTable({}, null, 1);
  t.throws(() => batchTable.isExactClass());
  t.throws(() => batchTable.isExactClass(2, 'door'));
  t.throws(() => batchTable.isExactClass(-1, 'door'));
  t.end();
});

test('Tile3DBatchTable#isExactClass throws with undefined className', t => {
  const batchTable = new Tile3DBatchTable({}, null, 1);
  t.throws(() => batchTable.isExactClass(0));
  t.end();
});

test('Tile3DBatchTable#isClass throws with invalid batchId', t => {
  const batchTable = new Tile3DBatchTable({}, null, 1);
  t.throws(() => batchTable.isClass());
  t.throws(() => batchTable.isClass(2, 'door'));
  t.throws(() => batchTable.isClass(-1, 'door'));
  t.end();
});

test('Tile3DBatchTable#isClass throws with undefined className', t => {
  const batchTable = new Tile3DBatchTable({}, null, 1);
  t.throws(() => batchTable.isClass(0));
  t.end();
});

test('Tile3DBatchTable#getExactClassName throws with invalid batchId', t => {
  const batchTable = new Tile3DBatchTable({}, null, 1);
  t.throws(() => batchTable.getExactClassName());
  t.throws(() => batchTable.getExactClassName(1000));
  t.throws(() => batchTable.getExactClassName(-1));
  t.end();
});

/*
test('Tile3DBatchTable#destroys', async t => {
  const tileset = await loadTileset(t, WITHOUT_BATCH_TABLE_URL);

  const content = tileset.root.content;
  const batchTable = content.batchTable;
  t.deepEquals(batchTable.isDestroyed(), false);
  // scene.primitives.remove(tileset);
  t.deepEquals(batchTable.isDestroyed(), true);
  t.end();
});
*/
