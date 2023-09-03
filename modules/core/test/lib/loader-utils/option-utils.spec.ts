/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {normalizeOptions} from '@loaders.gl/core/lib/loader-utils/option-utils';

import {GLTFLoader} from '@loaders.gl/gltf';
import {LASLoader} from '@loaders.gl/las';

const TEST_CASES = [
  {
    loader: GLTFLoader,
    options: {gltf: {compress: false}},
    assert: (t, options) => {
      t.equal(options.gltf.compress, false);
    }
  },
  {
    loader: LASLoader,
    options: {las: {skip: 10}, worker: false},
    assert: (t, options) => {
      t.equal(options.las.skip, 10);
      t.equal(options.worker, false);
    }
  }
];

test('normalizeOptions#normalizeOptions', (t) => {
  for (const tc of TEST_CASES) {
    const options = normalizeOptions(tc.options, tc.loader);
    tc.assert(t, options);
  }
  t.end();
});
