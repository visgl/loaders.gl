const EPSILON_DEFAULT = 0.01;

export function assertArrayEqualEpsilon(assert, a, b, e) {
  if (!e) {
    e = EPSILON_DEFAULT;
  }

  assert.equal(a.length, b.length);
  for (let i = 0; i < a.length; ++i) {
    assert.ok(Math.abs(a[i] - b[i]) < e);
  }
}
