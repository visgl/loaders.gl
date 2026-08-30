import {expect, test} from 'vitest';
import {load} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {
  GLTF_PRIMITIVE_MODES,
  analyzeTileContent,
  mergePreprocessData
} from '../../../src/i3s-converter/helpers/preprocess-3d-tiles';
import {GLTFPrimitiveModeString} from '../../../src/i3s-converter/types';
const FRANKFURT_B3DM_FILE_PATH =
  '@loaders.gl/tile-converter/test/data/Frankfurt/L5/OF/474_5548_-1_lv5_group_0.osgb_3.b3dm';
test('tile-converter(i3s)#analyzeTileContent', async () => {
  const tileContentNoArrayBuffer = await load(FRANKFURT_B3DM_FILE_PATH, Tiles3DLoader);
  const noArrayBufferResult = await analyzeTileContent(tileContentNoArrayBuffer);
  expect(Array.from(noArrayBufferResult.meshTopologyTypes)).toEqual([]);
  const tileContent = await load(FRANKFURT_B3DM_FILE_PATH, Tiles3DLoader, {
    ['3d-tiles']: {loadGLTF: false}
  });
  const result = await analyzeTileContent(tileContent);
  expect(Array.from(result.meshTopologyTypes)).toEqual([GLTF_PRIMITIVE_MODES[4]]);
});
test('tile-converter(i3s)#mergePreprocessData', async () => {
  const targetMeshTypeSet = new Set<GLTFPrimitiveModeString>();
  targetMeshTypeSet.add(GLTF_PRIMITIVE_MODES[0]);
  const targetMetadataClassesSet = new Set<string>();
  targetMetadataClassesSet.add('metadata_class');
  const target = {
    meshTopologyTypes: targetMeshTypeSet,
    metadataClasses: targetMetadataClassesSet
  };
  const meshTypeSet = new Set<GLTFPrimitiveModeString>();
  meshTypeSet.add(GLTF_PRIMITIVE_MODES[4]);
  const metadataClassesSet = new Set<string>();
  metadataClassesSet.add('metadata_class_2');
  mergePreprocessData(target, {
    meshTopologyTypes: meshTypeSet,
    metadataClasses: metadataClassesSet
  });
  expect(Array.from(target.meshTopologyTypes)).toEqual(['POINTS', 'TRIANGLES']);
  expect(Array.from(target.metadataClasses)).toEqual(['metadata_class', 'metadata_class_2']);
});
