import {expect, test} from 'vitest';
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
test('ParseI3sTileContent#should parse tile content', async () => {
  const buildingSceneLayerStructure = await load(I3S_TILE_CONTENT, I3SBuildingSceneLayerLoader);
  expect(buildingSceneLayerStructure).toBeTruthy();
  expect(buildingSceneLayerStructure.header).toBeTruthy();
  expect(buildingSceneLayerStructure.header.id).toBe(0);
  expect(buildingSceneLayerStructure.header.layerType).toBe('Building');
  expect(buildingSceneLayerStructure.sublayers).toBeTruthy();
  const firstSublayer = buildingSceneLayerStructure.sublayers[0];
  const {url, ...dataWithoutUrl} = firstSublayer;
  expect(url).toBeTruthy();
  expect(buildingSceneLayerStructure.sublayers.length).toBe(32);
  expect(dataWithoutUrl).toEqual(BUILDING_SCENE_SUBLAYER_0_EXPECTED);
});
