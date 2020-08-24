import Test from 'tape';

// Tape uses `deep-equal` module which throws exceptions, so replace...
function tapeDeepEqual(a, b, msg, extra) {
  // @ts-ignore
  const that = this; // eslint-disable-line no-invalid-this
  that._assert(deepEqual(a, b), {
    message: msg || 'should be equivalent',
    operator: 'deepEqual',
    actual: a,
    expected: b,
    extra
  });
}

Test.prototype.deepEqual = Test.prototype.deepEquals = Test.prototype.isEquivalent = Test.prototype.same = tapeDeepEqual;

// Compare two objects, partial deep equal
export function deepEqual(a, b) {
  if (a === b) {
    return true;
  }
  // TODO - implement deep equal on view descriptors
  return Object.keys(a).every(key => {
    if (Array.isArray(a[key]) && Array.isArray(b[key])) {
      return deepEqual(a[key], b[key]);
    }
    return a[key] === b[key];
  });
}
