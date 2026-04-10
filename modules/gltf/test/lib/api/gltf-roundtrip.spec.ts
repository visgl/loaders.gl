/* eslint-disable max-len */
/*
import test from 'tape-promise/tape';

import {GLTFBuilder, GLTFParser} from '@loaders.gl/gltf';

const EXTRA_DATA = {extraData: 1};
const APP_DATA = {vizData: 2};
const EXTENSION_DATA_1 = {extData: 3};
const EXTENSION_DATA_2 = {extData: 4};
const REQUIRED_EXTENSION_1 = 'UBER_extension_1';
const REQUIRED_EXTENSION_2 = 'UBER_extension_2';
const USED_EXTENSION_1 = 'UBER_extension_3';
const USED_EXTENSION_2 = 'UBER_extension_4';

test('GLTF roundtrip#extensions', t => {
  const builder = new GLTFBuilder();
  builder.addApplicationData('viz', APP_DATA);
  builder.addExtraData('test', EXTRA_DATA);

  builder.registerUsedExtension(USED_EXTENSION_1);
  builder.registerRequiredExtension(REQUIRED_EXTENSION_1);
  builder.addExtension(USED_EXTENSION_2, EXTENSION_DATA_1);
  builder.addRequiredExtension(REQUIRED_EXTENSION_2, EXTENSION_DATA_2);

  const arrayBuffer = builder.encodeAsGLB();

  const parser = new GLTFParser();
  parser.parseSync(arrayBuffer);

  const appData = parser.getApplicationData('viz');
  const extraData = parser.getExtraData('test');

  t.ok(appData, 'usedExtensions was found');
  t.ok(extraData, 'extraData was found');

  const usedExtensions = parser.getUsedExtensions();
  const requiredExtensions = parser.getRequiredExtensions();
  const extension1 = parser.getExtension(USED_EXTENSION_2);
  const extension2 = parser.getExtension(REQUIRED_EXTENSION_2);

  t.ok(usedExtensions, 'usedExtensions was found');
  t.ok(requiredExtensions, 'requiredExtensions was found');
  t.ok(extension1, 'extension1 was found');
  t.ok(extension2, 'extension2 was found');

  t.end();
});
*/
