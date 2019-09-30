/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateWriter} from 'test/common/conformance';

import {parse, encodeSync} from '@loaders.gl/core';
import {GLTFLoader, GLTFWriter, GLTFScenegraph} from '@loaders.gl/gltf';

const EXTRA_DATA = {extraData: 1};
const APP_DATA = {vizData: 2};
const EXTENSION_DATA_1 = {extData: 3};
const EXTENSION_DATA_2 = {extData: 4};
const REQUIRED_EXTENSION_1 = 'UBER_extension_1';
const REQUIRED_EXTENSION_2 = 'UBER_extension_2';
const USED_EXTENSION_1 = 'UBER_extension_3';
const USED_EXTENSION_2 = 'UBER_extension_4';

test('GLTFWriter#loader conformance', t => {
  validateWriter(t, GLTFWriter, 'GLTFWriter');
  t.end();
});

test('GLTFWriter#encode', async t => {
  const gltfBuilder = new GLTFScenegraph();
  gltfBuilder.addApplicationData('viz', APP_DATA);
  gltfBuilder.addExtraData('test', EXTRA_DATA);

  gltfBuilder.registerUsedExtension(USED_EXTENSION_1);
  gltfBuilder.registerRequiredExtension(REQUIRED_EXTENSION_1);
  gltfBuilder.addExtension(USED_EXTENSION_2, EXTENSION_DATA_1);
  gltfBuilder.addRequiredExtension(REQUIRED_EXTENSION_2, EXTENSION_DATA_2);

  const arrayBuffer = encodeSync(gltfBuilder.gltf, GLTFWriter);

  const gltf = await parse(arrayBuffer, GLTFLoader, {gltf: {postProcess: false}});
  const gltfScenegraph = new GLTFScenegraph(gltf);

  const appData = gltfScenegraph.getApplicationData('viz');
  const extraData = gltfScenegraph.getExtraData('test');

  t.ok(appData, 'usedExtensions was found');
  t.ok(extraData, 'extraData was found');

  const usedExtensions = gltfScenegraph.getUsedExtensions();
  const requiredExtensions = gltfScenegraph.getRequiredExtensions();
  const extension1 = gltfScenegraph.getExtension(USED_EXTENSION_2);
  const extension2 = gltfScenegraph.getExtension(REQUIRED_EXTENSION_2);

  t.ok(usedExtensions, 'usedExtensions was found');
  t.ok(requiredExtensions, 'requiredExtensions was found');
  t.ok(extension1, 'extension1 was found');
  t.ok(extension2, 'extension2 was found');

  t.end();
});
