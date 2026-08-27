import {expect, test} from 'vitest';
import {load} from '@loaders.gl/core';
import {getImageData} from '@loaders.gl/images';
import {loadI3STileContent} from './test-utils/load-utils';
import {I3SLoader} from '@loaders.gl/i3s';
test('I3SLoader#Load tile content', async () => {
  const content = await loadI3STileContent({
    i3s: {
      useCompressedTextures: false
    },
    loadOptions: {
      core: {worker: false}
    }
  });
  expect(content).toBeTruthy();
  expect(content.attributes).toBeTruthy();
  expect(content.attributes.positions).toBeTruthy();
  expect(content.attributes.positions.value.length).toBe(76914);
  expect(content.attributes.normals).toBeTruthy();
  expect(content.attributes.normals.value.length).toBe(76914);
  expect(content.attributes.colors).toBeTruthy();
  expect(content.attributes.colors.value.length).toBe(102552);
  expect(content.attributes.texCoords).toBeTruthy();
  expect(content.attributes.texCoords.value.length).toBe(51276);
  expect(content.texture).toBeFalsy();
  expect(content.material).toBeTruthy();
  const texture = content.material.pbrMetallicRoughness.baseColorTexture.texture.source.image;
  const textureData = getImageData(texture);
  expect(texture).toBeTruthy();
  expect(textureData.data.byteLength).toBe(131072);
});
test('I3SLoader#DRACO geometry', async () => {
  const content = await loadI3STileContent({
    i3s: {useDracoGeometry: true},
    loadOptions: {
      core: {worker: false}
    }
  });
  expect(content).toBeTruthy();
  expect(content.attributes).toBeTruthy();
  expect(content.attributes.positions).toBeTruthy();
  expect(content.attributes.positions.value.length).toBe(888);
  expect(content.attributes.normals).toBeFalsy();
  expect(content.attributes.colors).toBeTruthy();
  expect(content.attributes.colors.value.length).toBe(1184);
  expect(content.attributes.texCoords).toBeTruthy();
  expect(content.attributes.texCoords.value.length).toBe(592);
});
test('I3SLoader#slpk is not supported', async () => {
  const slpkUrl = '@loaders.gl/i3s/test/data/DA12_subset.slpk';
  const message = 'Files with .slpk extention currently are not supported by I3SLoader';
  try {
    await load(slpkUrl, I3SLoader, {});
  } catch (err) {
    // @ts-expect-error
    expect(err.message).toBe(message);
  }
});
test('I3SLoader#point cloud is not supported', async () => {
  const pointCloudUrl = '@loaders.gl/i3s/test/data/point-cloud/SceneServer/layers/0';
  const message = 'Point Cloud layers currently are not supported by I3SLoader';
  try {
    await load(pointCloudUrl, I3SLoader, {});
  } catch (err) {
    // @ts-expect-error
    expect(err.message).toBe(message);
  }
});
