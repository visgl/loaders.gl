import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {Tiles3DLoader} from '../../../../3d-tiles/src';
import {
  GLTF_PRIMITIVE_MODES,
  analyzeTileContent,
  mergePreprocessData
} from '../../../src/i3s-converter/helpers/preprocess-3d-tiles';
import {GLTFPrimitiveModeString} from '../../../src/i3s-converter/types';

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
  const targetMeshTypeSet = new Set<GLTFPrimitiveModeString>();
  targetMeshTypeSet.add(GLTF_PRIMITIVE_MODES[0]);
  const targetMetadataClassesSet = new Set<string>();
  targetMetadataClassesSet.add('metadata_class');
  const target = {meshTopologyTypes: targetMeshTypeSet, metadataClasses: targetMetadataClassesSet};

  const meshTypeSet = new Set<GLTFPrimitiveModeString>();
  meshTypeSet.add(GLTF_PRIMITIVE_MODES[4]);
  const metadataClassesSet = new Set<string>();
  metadataClassesSet.add('metadata_class_2');
  mergePreprocessData(target, {
    meshTopologyTypes: meshTypeSet,
    metadataClasses: metadataClassesSet
  });
  t.deepEqual(Array.from(target.meshTopologyTypes), ['POINTS', 'TRIANGLES']);
  t.deepEqual(Array.from(target.metadataClasses), ['metadata_class', 'metadata_class_2']);
  t.end();
});
