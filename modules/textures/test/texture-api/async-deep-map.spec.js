import test from 'tape-promise/tape';
import {asyncDeepMap} from '@loaders.gl/textures/lib/texture-api/async-deep-map';

const INPUT = {
  a: [1, 2, 3],
  b: 4
};

const OUTPUT = {
  a: [2, 4, 6],
  b: 8
};

test('asyncDeepMap#map', async (t) => {
  t.deepEqual(await asyncDeepMap(INPUT, async (n) => Promise.resolve(n * 2)), OUTPUT);
  t.end();
});
