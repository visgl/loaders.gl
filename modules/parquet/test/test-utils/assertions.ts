import type {Test} from 'tape-promise/tape';

const EPSILON_DEFAULT = 0.01;

export function assertArrayEqualEpsilon(t: Test, a, b, e = EPSILON_DEFAULT) {
  t.equal(a.length, b.length);
  for (let i = 0; i < a.length; ++i) {
    t.ok(Math.abs(a[i] - b[i]) < e);
  }
}
