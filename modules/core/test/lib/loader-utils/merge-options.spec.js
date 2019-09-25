/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {mergeOptions} from '@loaders.gl/core/lib/loader-utils/merge-options';

import {GLTFLoader} from '@loaders.gl/gltf';

test('mergeOptions#mergeOptions', t => {
  const options = mergeOptions(GLTFLoader, {gltf: {parserVersion: 2}});
  t.ok(options.gltf.parserVersion, 2);
  t.end();
});
