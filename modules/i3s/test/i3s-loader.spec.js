/* global ImageBitmap */

import test from 'tape-promise/tape';
import {isBrowser} from '@loaders.gl/core';
import {loadI3STileContent, loadI3STile} from './test-utils/load-utils';

test('I3SLoader#Load tile content', async t => {
  const content = await loadI3STileContent();
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
  t.ok(content.texture);
  t.ok(content.attributes.faceRange);
  t.equal(content.attributes.faceRange.value.length, 244);
  t.ok(content.attributes.featureIds);
  t.equal(content.attributes.featureIds.value.length, 76914);

  t.ok(content.texture);
  // ImageLoader returns different things on browser and Node
  if (isBrowser) {
    t.ok(content.texture instanceof ImageBitmap || content.texture.compressed);
  } else {
    t.equal(content.texture.data.byteLength, 131072);
  }
  t.end();
});

test('I3SLoader#DRACO geometry', async t => {
  const content = await loadI3STileContent({i3s: {useDracoGeometry: true}});
  t.ok(content);
  t.ok(content.attributes);
  t.ok(content.attributes.positions);
  t.equal(content.attributes.positions.value.length, 1854);
  t.notOk(content.attributes.normals);
  t.ok(content.attributes.colors);
  t.equal(content.attributes.colors.value.length, 2472);
  t.ok(content.attributes.texCoords);
  t.equal(content.attributes.texCoords.value.length, 1236);

  t.end();
});

test('I3SLoader parsing featureAttributes by default', async t => {
  const tile = await loadI3STile();
  t.ok(tile);
  t.ok(tile.header.userData.layerFeaturesAttributes);
  t.equal(tile.header.userData.layerFeaturesAttributes.length, 0);
  t.end();
});

test('I3SLoader parsing featureAttributes disabled', async t => {
  const tile = await loadI3STile({i3s: {loadFeatureAttributes: false}});
  t.ok(tile);
  t.notOk(tile.header.userData.layerFeaturesAttributes);
  t.end();
});

test('I3SLoader parsing featureAttributes enabled', async t => {
  const tile = await loadI3STile({i3s: {loadFeatureAttributes: true}});
  t.ok(tile);
  t.ok(tile.header.userData.layerFeaturesAttributes);
  t.equal(tile.header.userData.layerFeaturesAttributes.length, 0);
  t.end();
});
