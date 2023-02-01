// https://github.com/nodejs/node/commit/c1d82ac2ff15594840e2a1b9531b506ae067ed27;

// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

/** @todo replace this ridiculous choice of deepStrictEqual */
// eslint-disable-next-line complexity
export function deepStrictEqual(actual: unknown, expected: unknown, strict?: boolean) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;
    // } else if (actual instanceof Buffer && expected instanceof Buffer) {
    //   return compare(actual, expected) === 0;

    // // 7.2. If the expected value is a Date object, the actual value is
    // // equivalent if it is also a Date object that refers to the same time.
  } else if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();

    // 7.3 If the expected value is a RegExp object, the actual value is
    // equivalent if it is also a RegExp object with the same source and
    // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (actual instanceof RegExp && expected instanceof RegExp) {
    return (
      actual.source === expected.source &&
      actual.global === expected.global &&
      actual.multiline === expected.multiline &&
      actual.lastIndex === expected.lastIndex &&
      actual.ignoreCase === expected.ignoreCase
    );

    // 7.4. Other pairs that do not both pass typeof value == 'object',
    // equivalence is determined by ==.
  } else if (
    (actual === null || typeof actual !== 'object') &&
    (expected === null || typeof expected !== 'object')
  ) {
    // eslint-disable-next-line eqeqeq
    return strict ? actual === expected : actual == expected;

    // 7.5 For all other Object pairs, including Array objects, equivalence is
    // determined by having the same number of owned properties (as verified
    // with Object.prototype.hasOwnProperty.call), the same set of keys
    // (although not necessarily the same order), equivalent values for every
    // corresponding key, and an identical 'prototype' property. Note: this
    // accounts for both named and indexed properties on Arrays.
  }
  return objEquiv(actual, expected, strict);
}

// eslint-disable-next-line @typescript-eslint/unbound-method
const pSlice = Array.prototype.slice;

function isPrimitive(arg) {
  return arg === null || (typeof arg !== 'object' && typeof arg !== 'function');
}

function isArguments(object) {
  // eslint-disable-next-line eqeqeq
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

// eslint-disable-next-line complexity
function objEquiv(a: unknown, b: unknown, strict) {
  if (a === null || a === undefined || b === null || b === undefined) return false;
  // if one is a primitive, the other must be same
  if (isPrimitive(a) || isPrimitive(b)) return a === b;
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
  const aIsArgs = isArguments(a);
  const bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs)) return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return deepStrictEqual(a, b, strict);
  }
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  let key;
  let i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length !== kb.length) return false;
  // the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  // ~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] !== kb[i]) return false;
  }
  // equivalent values for every corresponding key, and
  // ~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!deepStrictEqual(a[key], b[key], strict)) return false;
  }
  return true;
}
