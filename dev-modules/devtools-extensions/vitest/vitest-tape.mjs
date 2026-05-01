import {isBrowser as checkIsBrowser} from '@probe.gl/env';
import {test as vitestTest, expect} from 'vitest';

const isBrowser = checkIsBrowser();
const isNode = !isBrowser;

function isArrayBufferView(value) {
  return ArrayBuffer.isView(value);
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function normalizeValue(value, seenValues = new WeakSet()) {
  if (isArrayBufferView(value)) {
    return Array.from(value);
  }

  if (Array.isArray(value)) {
    return value.map(item => normalizeValue(item, seenValues));
  }

  if (isPlainObject(value)) {
    if (seenValues.has(value)) {
      return '[Circular]';
    }

    seenValues.add(value);
    const normalizedObject = {};
    for (const [key, entryValue] of Object.entries(value)) {
      normalizedObject[key] = normalizeValue(entryValue, seenValues);
    }
    seenValues.delete(value);
    return normalizedObject;
  }

  return value;
}

function partiallyDeepEqual(actual, expected) {
  const normalizedActual = normalizeValue(actual);
  const normalizedExpected = normalizeValue(expected);

  if (normalizedActual === normalizedExpected) {
    return true;
  }

  if (
    normalizedActual === null ||
    normalizedExpected === null ||
    typeof normalizedActual !== 'object' ||
    typeof normalizedExpected !== 'object'
  ) {
    return false;
  }

  return Object.keys(normalizedActual).every(key => {
    const actualValue = normalizedActual[key];
    const expectedValue = normalizedExpected[key];

    if (Array.isArray(actualValue) && Array.isArray(expectedValue)) {
      return partiallyDeepEqual(actualValue, expectedValue);
    }

    if (
      actualValue !== null &&
      expectedValue !== null &&
      typeof actualValue === 'object' &&
      typeof expectedValue === 'object'
    ) {
      return partiallyDeepEqual(actualValue, expectedValue);
    }

    return actualValue === expectedValue;
  });
}

function formatMessage(messages) {
  return messages
    .map(message => {
      if (typeof message === 'string') {
        return message;
      }
      try {
        return JSON.stringify(message);
      } catch {
        return String(message);
      }
    })
    .join(' ');
}

function isPromiseLike(value) {
  return Boolean(value) && typeof value.then === 'function';
}

function normalizeThrowsArgs(expectedOrMessage, message) {
  if (typeof expectedOrMessage === 'string' && message === undefined) {
    return {message: expectedOrMessage};
  }

  return {
    expected: expectedOrMessage,
    message
  };
}

function usesExplicitEndSignal(callback) {
  const callbackSource = callback
    .toString()
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  return /\.end\s*\(/.test(callbackSource);
}

class VitestTape {
  actualAssertionCount = 0;

  endPromise;

  endResolver = null;

  hasEnded = false;

  planPromise = null;

  planResolver = null;

  plannedAssertionCount;

  teardownCallbacks = [];

  timeoutMilliseconds;

  constructor() {
    this.endPromise = new Promise(resolve => {
      this.endResolver = resolve;
    });
  }

  _assert(value, options = {}) {
    this.countAssertion();
    expect(Boolean(value), options.message).toBe(true);
  }

  assert(value, message) {
    this.ok(value, message);
  }

  comment(...messages) {
    const message = formatMessage(messages);
    if (message) {
      console.log(message);
    }
  }

  deepEqual(actual, expected, message) {
    this.countAssertion();
    expect(partiallyDeepEqual(actual, expected), message).toBe(true);
  }

  deepEquals(actual, expected, message) {
    this.deepEqual(actual, expected, message);
  }

  doesNotThrow(callback, message) {
    this.countAssertion();
    expect(callback, message).not.toThrow();
  }

  async doesNotReject(callbackOrPromise, expectedOrMessage, message) {
    this.countAssertion();
    const {message: normalizedMessage} = normalizeThrowsArgs(expectedOrMessage, message);
    const promise = typeof callbackOrPromise === 'function' ? callbackOrPromise() : callbackOrPromise;
    try {
      await promise;
    } catch (error) {
      expect(error, normalizedMessage).toBeUndefined();
    }
  }

  end() {
    if (this.hasEnded) {
      return;
    }

    this.hasEnded = true;
    this.endResolver?.();
  }

  equal(actual, expected, message) {
    this.countAssertion();
    expect(actual, message).toBe(expected);
  }

  equals(actual, expected, message) {
    this.equal(actual, expected, message);
  }

  error(error, message) {
    this.countAssertion();
    expect(error, message).toBeFalsy();
  }

  fail(message) {
    this.countAssertion();
    throw new Error(message || 'Forced failure');
  }

  false(value, message) {
    this.countAssertion();
    expect(Boolean(value), message).toBe(false);
  }

  is(actual, expected, message) {
    this.equal(actual, expected, message);
  }

  isEqual(actual, expected, message) {
    this.equal(actual, expected, message);
  }

  isEquivalent(actual, expected, message) {
    this.deepEqual(actual, expected, message);
  }

  match(actual, expected, message) {
    this.countAssertion();
    if (typeof expected === 'string') {
      expect(actual, message).toContain(expected);
      return;
    }
    expect(actual, message).toMatch(expected);
  }

  notDeepEqual(actual, expected, message) {
    this.countAssertion();
    expect(partiallyDeepEqual(actual, expected), message).toBe(false);
  }

  notEqual(actual, expected, message) {
    this.countAssertion();
    expect(actual, message).not.toBe(expected);
  }

  notOk(value, message) {
    this.countAssertion();
    expect(Boolean(value), message).toBe(false);
  }

  ok(value, message) {
    this.countAssertion();
    expect(Boolean(value), message).toBe(true);
  }

  pass(message) {
    this.countAssertion();
    expect(true, message).toBe(true);
  }

  plan(assertionCount) {
    this.plannedAssertionCount = assertionCount;
    this.planPromise = new Promise(resolve => {
      this.planResolver = resolve;
    });
    this.resolvePlanIfComplete();
  }

  async rejects(callbackOrPromise, expectedOrMessage, message) {
    this.countAssertion();
    const {expected, message: normalizedMessage} = normalizeThrowsArgs(expectedOrMessage, message);
    const promise = typeof callbackOrPromise === 'function' ? callbackOrPromise() : callbackOrPromise;

    let rejection;
    let rejected = false;
    try {
      await promise;
    } catch (error) {
      rejection = error;
      rejected = true;
    }

    if (expected === undefined) {
      expect(rejected, normalizedMessage).toBe(true);
      return;
    }

    expect(() => {
      throw rejection;
    }, normalizedMessage).toThrow(expected);
  }

  same(actual, expected, message) {
    this.deepEqual(actual, expected, message);
  }

  strictEqual(actual, expected, message) {
    this.equal(actual, expected, message);
  }

  async test(_name, callback) {
    const nestedTest = new VitestTape();
    await nestedTest.run(callback);
  }

  teardown(callback) {
    this.teardownCallbacks.push(callback);
  }

  throws(callback, expectedOrMessage, message) {
    this.countAssertion();
    const {expected, message: normalizedMessage} = normalizeThrowsArgs(expectedOrMessage, message);
    if (expected === undefined) {
      expect(callback, normalizedMessage).toThrow();
      return;
    }
    expect(callback, normalizedMessage).toThrow(expected);
  }

  timeoutAfter(timeoutMilliseconds) {
    this.timeoutMilliseconds = timeoutMilliseconds;
  }

  true(value, message) {
    this.countAssertion();
    expect(Boolean(value), message).toBe(true);
  }

  async run(callback) {
    try {
      const waitsForEnd = usesExplicitEndSignal(callback);
      let callbackResult;

      if (this.timeoutMilliseconds === undefined) {
        callbackResult = callback(this);
        if (isPromiseLike(callbackResult)) {
          await callbackResult;
        }
      } else {
        callbackResult = callback(this);
        await Promise.race([
          callbackResult,
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error(`Test timed out after ${this.timeoutMilliseconds}ms`)),
              this.timeoutMilliseconds
            )
          )
        ]);
      }

      if (waitsForEnd && !isPromiseLike(callbackResult)) {
        if (this.timeoutMilliseconds === undefined) {
          await this.endPromise;
        } else {
          await Promise.race([
            this.endPromise,
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error(`Test timed out after ${this.timeoutMilliseconds}ms`)),
                this.timeoutMilliseconds
              )
            )
          ]);
        }
      }

      if (this.plannedAssertionCount !== undefined) {
        if (this.planPromise && this.actualAssertionCount < this.plannedAssertionCount) {
          if (this.timeoutMilliseconds === undefined) {
            await this.planPromise;
          } else {
            await Promise.race([
              this.planPromise,
              new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error(`Test timed out after ${this.timeoutMilliseconds}ms`)),
                  this.timeoutMilliseconds
                )
              )
            ]);
          }
        }
        expect(this.actualAssertionCount).toBe(this.plannedAssertionCount);
      }
    } finally {
      for (const teardownCallback of this.teardownCallbacks.reverse()) {
        await teardownCallback();
      }
    }
  }

  countAssertion() {
    this.actualAssertionCount++;
    this.resolvePlanIfComplete();
  }

  resolvePlanIfComplete() {
    if (
      this.plannedAssertionCount !== undefined &&
      this.actualAssertionCount >= this.plannedAssertionCount
    ) {
      this.planResolver?.();
      this.planResolver = null;
    }
  }
}

function wrapTest(vitestImplementation) {
  return (name, callback) =>
    vitestImplementation(name, async () => {
      if (!callback) {
        return;
      }

      const tapeTest = new VitestTape();
      const result = tapeTest.run(callback);

      if (isPromiseLike(result)) {
        await result;
      }
    });
}

const test = wrapTest(vitestTest);

test.only = wrapTest(vitestTest.only);
test.skip = wrapTest(vitestTest.skip);

function testIf(condition, name, callback) {
  return condition ? test(name, callback) : test.skip(name, callback);
}

function testIfBrowser(name, callback) {
  return testIf(isBrowser, name, callback);
}

function testIfNode(name, callback) {
  return testIf(isNode, name, callback);
}

export {isBrowser, isNode, test, testIf, testIfBrowser, testIfNode};
export default test;
