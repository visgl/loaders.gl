/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {mergeOptions} from '@loaders.gl/core/lib/loader-utils/merge-options';

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

test('mergeOptions#mergeOptions', t => {
  for (const tc of TEST_CASES) {
    const options = mergeOptions(tc.loader, tc.options);
    tc.assert(t, options);
  }
  t.end();
});
