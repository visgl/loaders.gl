import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {Tiles3DLoader} from '../../../../3d-tiles/src';
import {
  GLTF_PRIMITIVE_MODES,
  analyzeTileContent,
  mergePreprocessData
} from '../../../src/i3s-converter/helpers/preprocess-3d-tiles';
import {GltfPrimitiveModeString} from '../../../src/i3s-converter/types';

const FRANKFURT_B3DM_FILE_PATH =
  '@loaders.gl/tile-converter/test/data/Frankfurt/L5/OF/474_5548_-1_lv5_group_0.osgb_3.b3dm';

test('tile-converter(i3s)#analyzeTileContent', async (t) => {
  const tileContentNoArrayBuffer = await load(FRANKFURT_B3DM_FILE_PATH, Tiles3DLoader);
  const noArrayBufferResult = await analyzeTileContent(tileContentNoArrayBuffer);
  t.deepEqual(Array.from(noArrayBufferResult.meshTopologyTypes), []);

  const tileContent = await load(FRANKFURT_B3DM_FILE_PATH, Tiles3DLoader, {
    ['3d-tiles']: {loadGLTF: false}
  });
  const result = await analyzeTileContent(tileContent);
  t.deepEqual(Array.from(result.meshTopologyTypes), [GLTF_PRIMITIVE_MODES[4]]);
  t.end();
});

test('tile-converter(i3s)#mergePreprocessData', async (t) => {
  const targetSet = new Set<GltfPrimitiveModeString>();
  targetSet.add(GLTF_PRIMITIVE_MODES[0]);
  const target = {meshTopologyTypes: targetSet};

  const newSet = new Set<GltfPrimitiveModeString>();
  newSet.add(GLTF_PRIMITIVE_MODES[4]);
  mergePreprocessData(target, {meshTopologyTypes: newSet});
  t.deepEqual(Array.from(target.meshTopologyTypes), ['POINTS', 'TRIANGLES']);
  t.end();
});
