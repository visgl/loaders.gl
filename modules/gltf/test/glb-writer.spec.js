import test from 'tape-promise/tape';
import {validateWriter} from 'test/common/conformance';

import {GLBWriter} from '@loaders.gl/gltf';

test('GLBWriter#loader conformance', (t) => {
  validateWriter(t, GLBWriter, 'GLBWriter');
  t.end();
});
