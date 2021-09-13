import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {I3SBuildingSceneLayerLoader} from '@loaders.gl/i3s';

const BUILDING_SCENE_SUBLAYER_0_EXPECTED = {
  id: 31,
  layerType: '3DObject',
  name: 'TelephoneDevices',
  alias: 'TelephoneDevices',
  visibility: true,
  modelName: 'TelephoneDevices',
  discipline: 'Electrical'
};

const I3S_TILE_CONTENT =
  '@loaders.gl/i3s/test/data/BuildingSceneLayer/BuildingSceneLayerTileset.json';

test('ParseI3sTileContent#should parse tile content', async (t) => {
  const buildingSceneLayerStructure = await load(I3S_TILE_CONTENT, I3SBuildingSceneLayerLoader);

  t.ok(buildingSceneLayerStructure);
  t.ok(buildingSceneLayerStructure.header);
  t.equal(buildingSceneLayerStructure.header.id, 0);
  t.equal(buildingSceneLayerStructure.header.layerType, 'Building');
  t.ok(buildingSceneLayerStructure.sublayers);

  const firstSublayer = buildingSceneLayerStructure.sublayers[0];
  const {url, ...dataWithoutUrl} = firstSublayer;

  t.ok(url);
  t.equal(buildingSceneLayerStructure.sublayers.length, 32);
  t.deepEqual(dataWithoutUrl, BUILDING_SCENE_SUBLAYER_0_EXPECTED);

  t.end();
});
