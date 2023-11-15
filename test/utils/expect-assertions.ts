import test, {Test as TapeTest} from 'tape';
import {tapeEquals, tapeEqualsEpsilon} from './tape-assertions';

/**
 * Provides a Jest `expect()` compatible interface
 * @see https://jestjs.io/docs/expect
 */
class TestCase {
  t: TapeTest;
  result: any;

  constructor(t: TapeTest, result: any) {
    this.t = t;
    this.result = result;
  }

  toBe(value) {
    this.t.equals(this.result, value);
  }

  toEqual(value) {
    tapeEquals(this.t, this.result, value);
  }

  toEqualEpsilon(value, epsilon) {
    tapeEqualsEpsilon(this.t, this.result, value, epsilon);
  }

  /**
   * Not a pure strict equal. Deep equal with additional checks per
   * 
   * @param {*} value 
   */
  toStrictEqual(value) {
    this.t.deepEquals(this.result, value);
  }

  /**
   * @param {string} [message]
   */
  toThrow(message) {
    if (message) {
      this.t.throws(() => this.result(), message);
    }
    this.t.throws(() => this.result());
  }

  toHaveLength(length) {
    return this.t.equals(this.result.length, length);
  }
}

const descriptions: string[] = [];
let description = '';
let currentTest: TapeTest;

export function describe(string: string, func: Function) {
  descriptions.push(string);
  description = descriptions.join('#');
  func();
  descriptions.pop();
  description = descriptions.join('#');
}

export function it(message, testfunc) {
  test(`${description}#${message}`, async t => {
    currentTest = t;
    await testfunc();
    t.end();
  });
}

export function expect(value) {
  return new TestCase(currentTest, value);
}
