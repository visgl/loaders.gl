// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {asyncDeepMap} from '../../src/lib/texture-api/async-deep-map';

const INPUT = {
  a: [1, 2, 3],
  b: 4
};

const OUTPUT = {
  a: [2, 4, 6],
  b: 8
};

test('asyncDeepMap#map', async (t) => {
  // @ts-expect-error
  t.deepEqual(await asyncDeepMap(INPUT, async (n) => Promise.resolve(2 * n)), OUTPUT);
  t.end();
});
