import test from 'tape';
import {tapeEqualsEpsilon} from './expect-assertions';

class TestCase {
  constructor(t, result) {
    this.t = t;
    this.result = result;
  }
  toBe(value) {
    this.t.equals(value);
  }
  toEqual(value) {
    this.t.equals(value);
  }
  toEqualEpsilon(value, epsilon) {
    tapeEqualsEpsilon(this.t, value, epsilon);
  }
  toThrow() {
    this.t.throws(() => this.result());
  }
}

let currentTest;

export function it(message, testfunc) {
  test(message, t => {
    currentTest = t;
    testfunc();
    t.end();
  });
}

export function expect(value) {
  return new TestCase(currentTest, value);
}
