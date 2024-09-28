import Test from 'tape';

// Tape uses `deep-equal` module which throws exceptions, so replace...
function tapeDeepEqual(a: any, b: any, msg: string, extra?: any) {
  // @ts-ignore this has type "any"
  // eslint-disable-next-line no-invalid-this
  this._assert(deepEqual(a, b), {
    message: msg || 'should be equivalent',
    operator: 'deepEqual',
    actual: a,
    expected: b,
    extra
  });
}

Test.prototype.deepEqual =
  Test.prototype.deepEquals =
  Test.prototype.isEquivalent =
  Test.prototype.same =
    tapeDeepEqual;

// Compare two objects, partial deep equal
export function deepEqual(a: any, b: any): boolean {
  if (a === b) {
    return true;
  }
  // TODO - implement deep equal on view descriptors
  return Object.keys(a).every((key) => {
    if (Array.isArray(a[key]) && Array.isArray(b[key])) {
      return deepEqual(a[key], b[key]);
    }
    return a[key] === b[key];
  });
}
