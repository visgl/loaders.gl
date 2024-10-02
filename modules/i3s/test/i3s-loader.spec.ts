import test from 'tape-promise/tape';
import {isBrowser, load} from '@loaders.gl/core';
import {loadI3STileContent} from './test-utils/load-utils';
import {I3SLoader} from '@loaders.gl/i3s';

test('I3SLoader#Load tile content', async (t) => {
  const content = await loadI3STileContent({
    loadOptions: {
      core: {worker: false}
    }
  });
  t.ok(content);
  t.ok(content.attributes);
  t.ok(content.attributes.positions);
  t.equal(content.attributes.positions.value.length, 76914);
  t.ok(content.attributes.normals);
  t.equal(content.attributes.normals.value.length, 76914);
  t.ok(content.attributes.colors);
  t.equal(content.attributes.colors.value.length, 102552);
  t.ok(content.attributes.texCoords);
  t.equal(content.attributes.texCoords.value.length, 51276);
  t.notOk(content.texture);
  t.ok(content.material);
  // ImageLoader returns different things on browser and Node
  const texture = content.material.pbrMetallicRoughness.baseColorTexture.texture.source.image;
  if (isBrowser) {
    t.ok(texture);
  } else {
    t.equal(texture.data.byteLength, 131072);
  }
  t.end();
});

test('I3SLoader#DRACO geometry', async (t) => {
  const content = await loadI3STileContent({
    i3s: {useDracoGeometry: true},
    loadOptions: {
      core: {worker: false}
    }
  });
  t.ok(content);
  t.ok(content.attributes);
  t.ok(content.attributes.positions);
  t.equal(content.attributes.positions.value.length, 888);
  t.notOk(content.attributes.normals);
  t.ok(content.attributes.colors);
  t.equal(content.attributes.colors.value.length, 1184);
  t.ok(content.attributes.texCoords);
  t.equal(content.attributes.texCoords.value.length, 592);

  t.end();
});

test('I3SLoader#slpk is not supported', async (t) => {
  const slpkUrl = '@loaders.gl/i3s/test/data/DA12_subset.slpk';
  const message = 'Files with .slpk extention currently are not supported by I3SLoader';
  try {
    await load(slpkUrl, I3SLoader, {});
  } catch (err) {
    // @ts-expect-error
    t.equal(err.message, message);
  }
  t.end();
});

test('I3SLoader#point cloud is not supported', async (t) => {
  const pointCloudUrl = '@loaders.gl/i3s/test/data/point-cloud/SceneServer/layers/0';
  const message = 'Point Cloud layers currently are not supported by I3SLoader';

  try {
    await load(pointCloudUrl, I3SLoader, {});
  } catch (err) {
    // @ts-expect-error
    t.equal(err.message, message);
  }
  t.end();
});
