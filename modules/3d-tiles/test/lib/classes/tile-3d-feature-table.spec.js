import test from 'tape-promise/tape';
import {Tile3DFeatureTable} from '@loaders.gl/3d-tiles';
import {GL} from '@loaders.gl/math'; // '@math.gl/geometry';

test('Tile3DFeatureTable#loads from JSON', (t) => {
  const featureTable = new Tile3DFeatureTable({
    TEST: [0, 1, 2, 3, 4, 5]
  });
  featureTable.featuresLength = 3;
  const all = featureTable.getGlobalProperty('TEST', GL.UNSIGNED_BYTE);
  t.deepEquals(all, [0, 1, 2, 3, 4, 5]);
  const feature = featureTable.getProperty('TEST', GL.UNSIGNED_BYTE, 2, 1, new Array(2));
  t.deepEquals(feature, [2, 3]);
  const properties = featureTable.getPropertyArray('TEST', GL.UNSIGNED_BYTE, 2);
  t.deepEquals(properties, [0, 1, 2, 3, 4, 5]);
  t.end();
});

test('Tile3DFeatureTable#loads from binary', (t) => {
  const featureTable = new Tile3DFeatureTable(
    {
      TEST: {
        byteOffset: 4
      }
    },
    new Uint8Array([0, 0, 0, 0, 0, 1, 2, 3, 4, 5])
  );
  featureTable.featuresLength = 3;
  const all = featureTable.getGlobalProperty('TEST', GL.UNSIGNED_BYTE, 6);
  t.deepEquals(all, [0, 1, 2, 3, 4, 5]);
  const feature = featureTable.getProperty('TEST', GL.UNSIGNED_BYTE, 2, 1, new Array(2));
  t.deepEquals(feature, [2, 3]);
  const properties = featureTable.getPropertyArray('TEST', GL.UNSIGNED_BYTE, 2);
  t.deepEquals(properties, [0, 1, 2, 3, 4, 5]);
  t.end();
});
