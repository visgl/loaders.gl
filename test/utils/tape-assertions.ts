import {equals, withEpsilon} from '@math.gl/core';
import type {Test as TapeTest} from '@loaders.gl/devtools-extensions/tape-test-utils';

// FOR TAPE TESTING
// Use tape assert to compares using a.equals(b)
// Usage test(..., t => { tapeEquals(t, a, b, ...); });
export function tapeEquals(t: TapeTest, a: any, b: any, msg?: string, extra?: any) {
  /* eslint-disable no-invalid-this */
  let valid = false;
  if (a.equals) {
    valid = a.equals(b);
  } else if (b.equals) {
    valid = b.equals(a);
  } else {
    valid = equals(a, b);
  }
  t._assert(valid, {
    message: msg || 'should be equal',
    operator: 'equal',
    actual: a,
    expected: b,
    extra
  });
}

// eslint-disable-next-line max-params
export function tapeEqualsEpsilon(
  t: TapeTest,
  a: any,
  b: any,
  epsilon: number,
  msg?: string,
  extra?: any
) {
  return withEpsilon(epsilon, () => tapeEquals(t, a, b, msg, extra));
}
