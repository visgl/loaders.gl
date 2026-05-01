import {isBrowser as checkIsBrowser} from '@probe.gl/env';
import {test as vitestTest, expect} from 'vitest';

type TestCallback = (test: Test) => void | Promise<void>;

type MatchPattern = RegExp | string;

/** True when the current Vitest project is running in a browser-like runtime. */
export const isBrowser = checkIsBrowser();

/** True when the current Vitest project is running in Node.js. */
export const isNode = !isBrowser;

function isArrayBufferView(value: unknown): value is ArrayBufferView {
  return ArrayBuffer.isView(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function normalizeValue(value: unknown, seenValues: WeakSet<object> = new WeakSet()): unknown {
  if (isArrayBufferView(value)) {
    return Array.from(value as ArrayLike<number>);
  }

  if (Array.isArray(value)) {
    return value.map(item => normalizeValue(item, seenValues));
  }

  if (isPlainObject(value)) {
    if (seenValues.has(value)) {
      return '[Circular]';
    }

    seenValues.add(value);
    const normalizedObject: Record<string, unknown> = {};
    for (const [key, entryValue] of Object.entries(value)) {
      normalizedObject[key] = normalizeValue(entryValue, seenValues);
    }
    seenValues.delete(value);
    return normalizedObject;
  }

  return value;
}

function partiallyDeepEqual(actual: unknown, expected: unknown): boolean {
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
    const actualValue = (normalizedActual as Record<string, unknown>)[key];
    const expectedValue = (normalizedExpected as Record<string, unknown>)[key];

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

function formatMessage(messages: unknown[]): string {
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

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return Boolean(value) && typeof (value as Promise<unknown>).then === 'function';
}

function normalizeThrowsArgs(
  expectedOrMessage?: MatchPattern | (new (...args: never[]) => Error) | string,
  message?: string
): {
  expected?: MatchPattern | (new (...args: never[]) => Error);
  message?: string;
} {
  if (typeof expectedOrMessage === 'string' && message === undefined) {
    return {message: expectedOrMessage};
  }

  return {
    expected: expectedOrMessage as MatchPattern | (new (...args: never[]) => Error) | undefined,
    message
  };
}

function usesExplicitEndSignal(callback: TestCallback): boolean {
  const callbackSource = callback
    .toString()
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  return /\.end\s*\(/.test(callbackSource);
}

export interface Test {
  _assert(
    value: unknown,
    options?: {message?: string; operator?: string; actual?: unknown; expected?: unknown; extra?: unknown}
  ): void;
  assert(value: unknown, message?: string): void;
  comment(...messages: unknown[]): void;
  deepEqual(actual: unknown, expected: unknown, message?: string): void;
  deepEquals(actual: unknown, expected: unknown, message?: string): void;
  doesNotReject(
    callbackOrPromise: Promise<unknown> | (() => Promise<unknown>),
    expectedOrMessage?: MatchPattern | (new (...args: never[]) => Error) | string,
    message?: string
  ): Promise<void>;
  doesNotThrow(callback: () => unknown, message?: string): void;
  end(): void;
  equal(actual: unknown, expected: unknown, message?: string): void;
  equals(actual: unknown, expected: unknown, message?: string): void;
  error(error: unknown, message?: string): void;
  fail(message?: string): never;
  false(value: unknown, message?: string): void;
  is(actual: unknown, expected: unknown, message?: string): void;
  isEqual(actual: unknown, expected: unknown, message?: string): void;
  isEquivalent(actual: unknown, expected: unknown, message?: string): void;
  match(actual: string, expected: MatchPattern, message?: string): void;
  notDeepEqual(actual: unknown, expected: unknown, message?: string): void;
  notEqual(actual: unknown, expected: unknown, message?: string): void;
  notOk(value: unknown, message?: string): void;
  ok(value: unknown, message?: string): void;
  pass(message?: string): void;
  plan(assertionCount: number): void;
  rejects(
    callbackOrPromise: Promise<unknown> | (() => Promise<unknown>),
    expectedOrMessage?: MatchPattern | (new (...args: never[]) => Error) | string,
    message?: string
  ): Promise<void>;
  same(actual: unknown, expected: unknown, message?: string): void;
  strictEqual(actual: unknown, expected: unknown, message?: string): void;
  test(name: string, callback: TestCallback): Promise<void>;
  teardown(callback: () => void | Promise<void>): void;
  throws(
    callback: () => unknown,
    expectedOrMessage?: MatchPattern | (new (...args: never[]) => Error) | string,
    message?: string
  ): void;
  timeoutAfter(timeoutMilliseconds: number): void;
  true(value: unknown, message?: string): void;
}

class VitestTape implements Test {
  private actualAssertionCount: number = 0;
  private endPromise: Promise<void>;
  private endResolver: (() => void) | null = null;
  private hasEnded: boolean = false;
  private planPromise: Promise<void> | null = null;
  private planResolver: (() => void) | null = null;
  private plannedAssertionCount?: number;
  private teardownCallbacks: Array<() => void | Promise<void>> = [];
  private timeoutMilliseconds?: number;

  constructor() {
    this.endPromise = new Promise(resolve => {
      this.endResolver = resolve;
    });
  }

  _assert(
    value: unknown,
    options: {message?: string; operator?: string; actual?: unknown; expected?: unknown; extra?: unknown} = {}
  ): void {
    this.countAssertion();
    expect(Boolean(value), options.message).toBe(true);
  }

  assert(value: unknown, message?: string): void {
    this.ok(value, message);
  }

  comment(...messages: unknown[]): void {
    const message = formatMessage(messages);
    if (message) {
      // eslint-disable-next-line no-console
      console.log(message);
    }
  }

  deepEqual(actual: unknown, expected: unknown, message?: string): void {
    this.countAssertion();
    expect(partiallyDeepEqual(actual, expected), message).toBe(true);
  }

  deepEquals(actual: unknown, expected: unknown, message?: string): void {
    this.deepEqual(actual, expected, message);
  }

  doesNotThrow(callback: () => unknown, message?: string): void {
    this.countAssertion();
    expect(callback, message).not.toThrow();
  }

  async doesNotReject(
    callbackOrPromise: Promise<unknown> | (() => Promise<unknown>),
    expectedOrMessage?: MatchPattern | (new (...args: never[]) => Error) | string,
    message?: string
  ): Promise<void> {
    this.countAssertion();
    const {message: normalizedMessage} = normalizeThrowsArgs(expectedOrMessage, message);
    const promise = typeof callbackOrPromise === 'function' ? callbackOrPromise() : callbackOrPromise;
    try {
      await promise;
    } catch (error) {
      expect(error, normalizedMessage).toBeUndefined();
    }
  }

  end(): void {
    if (this.hasEnded) {
      return;
    }

    this.hasEnded = true;
    this.endResolver?.();
  }

  equal(actual: unknown, expected: unknown, message?: string): void {
    this.countAssertion();
    expect(actual, message).toBe(expected);
  }

  equals(actual: unknown, expected: unknown, message?: string): void {
    this.equal(actual, expected, message);
  }

  error(error: unknown, message?: string): void {
    this.countAssertion();
    expect(error, message).toBeFalsy();
  }

  fail(message?: string): never {
    this.countAssertion();
    throw new Error(message || 'Forced failure');
  }

  false(value: unknown, message?: string): void {
    this.countAssertion();
    expect(Boolean(value), message).toBe(false);
  }

  is(actual: unknown, expected: unknown, message?: string): void {
    this.equal(actual, expected, message);
  }

  isEqual(actual: unknown, expected: unknown, message?: string): void {
    this.equal(actual, expected, message);
  }

  isEquivalent(actual: unknown, expected: unknown, message?: string): void {
    this.deepEqual(actual, expected, message);
  }

  match(actual: string, expected: MatchPattern, message?: string): void {
    this.countAssertion();
    if (typeof expected === 'string') {
      expect(actual, message).toContain(expected);
      return;
    }
    expect(actual, message).toMatch(expected);
  }

  notDeepEqual(actual: unknown, expected: unknown, message?: string): void {
    this.countAssertion();
    expect(partiallyDeepEqual(actual, expected), message).toBe(false);
  }

  notEqual(actual: unknown, expected: unknown, message?: string): void {
    this.countAssertion();
    expect(actual, message).not.toBe(expected);
  }

  notOk(value: unknown, message?: string): void {
    this.countAssertion();
    expect(Boolean(value), message).toBe(false);
  }

  ok(value: unknown, message?: string): void {
    this.countAssertion();
    expect(Boolean(value), message).toBe(true);
  }

  pass(message?: string): void {
    this.countAssertion();
    expect(true, message).toBe(true);
  }

  plan(assertionCount: number): void {
    this.plannedAssertionCount = assertionCount;
    this.planPromise = new Promise(resolve => {
      this.planResolver = resolve;
    });
    this.resolvePlanIfComplete();
  }

  async rejects(
    callbackOrPromise: Promise<unknown> | (() => Promise<unknown>),
    expectedOrMessage?: MatchPattern | (new (...args: never[]) => Error) | string,
    message?: string
  ): Promise<void> {
    this.countAssertion();
    const {expected, message: normalizedMessage} = normalizeThrowsArgs(expectedOrMessage, message);
    const promise = typeof callbackOrPromise === 'function' ? callbackOrPromise() : callbackOrPromise;

    let rejection: unknown;
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
    }, normalizedMessage).toThrow(expected as MatchPattern);
  }

  same(actual: unknown, expected: unknown, message?: string): void {
    this.deepEqual(actual, expected, message);
  }

  strictEqual(actual: unknown, expected: unknown, message?: string): void {
    this.equal(actual, expected, message);
  }

  async test(_name: string, callback: TestCallback): Promise<void> {
    const nestedTest = new VitestTape();
    await nestedTest.run(callback);
  }

  teardown(callback: () => void | Promise<void>): void {
    this.teardownCallbacks.push(callback);
  }

  throws(
    callback: () => unknown,
    expectedOrMessage?: MatchPattern | (new (...args: never[]) => Error) | string,
    message?: string
  ): void {
    this.countAssertion();
    const {expected, message: normalizedMessage} = normalizeThrowsArgs(expectedOrMessage, message);
    if (expected === undefined) {
      expect(callback, normalizedMessage).toThrow();
      return;
    }
    expect(callback, normalizedMessage).toThrow(expected as MatchPattern);
  }

  timeoutAfter(timeoutMilliseconds: number): void {
    this.timeoutMilliseconds = timeoutMilliseconds;
  }

  true(value: unknown, message?: string): void {
    this.countAssertion();
    expect(Boolean(value), message).toBe(true);
  }

  async run(callback: TestCallback): Promise<void> {
    try {
      const waitsForEnd = usesExplicitEndSignal(callback);
      let callbackResult: void | Promise<void>;

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

      if (waitsForEnd) {
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

  private countAssertion(): void {
    this.actualAssertionCount++;
    this.resolvePlanIfComplete();
  }

  private resolvePlanIfComplete(): void {
    if (
      this.plannedAssertionCount !== undefined &&
      this.actualAssertionCount >= this.plannedAssertionCount
    ) {
      this.planResolver?.();
      this.planResolver = null;
    }
  }
}

export type TapeTestFunction = {
  (name: string, callback: TestCallback): ReturnType<typeof vitestTest>;
  only: (name: string, callback: TestCallback) => ReturnType<typeof vitestTest.only>;
  skip: (name: string, callback?: TestCallback) => ReturnType<typeof vitestTest.skip>;
};

function wrapTest(
  vitestImplementation: typeof vitestTest | typeof vitestTest.only
): (name: string, callback?: TestCallback) => ReturnType<typeof vitestImplementation> {
  return ((name: string, callback?: TestCallback) =>
    vitestImplementation(name, async () => {
      if (!callback) {
        return;
      }

      const tapeTest = new VitestTape();
      const result = tapeTest.run(callback);

      if (isPromiseLike(result)) {
        await result;
      }
    })) as (name: string, callback?: TestCallback) => ReturnType<typeof vitestImplementation>;
}

const test = wrapTest(vitestTest) as TapeTestFunction;

test.only = wrapTest(vitestTest.only);
test.skip = wrapTest(vitestTest.skip);

/**
 * Registers a tape-style test when `condition` is true, otherwise registers it as skipped.
 */
export function testIf(
  condition: boolean,
  name: string,
  callback: TestCallback
): ReturnType<TapeTestFunction['skip']> | ReturnType<TapeTestFunction> {
  return condition ? test(name, callback) : test.skip(name, callback);
}

/**
 * Registers a tape-style test only in browser-like runtimes.
 */
export function testIfBrowser(
  name: string,
  callback: TestCallback
): ReturnType<TapeTestFunction['skip']> | ReturnType<TapeTestFunction> {
  return testIf(isBrowser, name, callback);
}

/**
 * Registers a tape-style test only in Node.js.
 */
export function testIfNode(
  name: string,
  callback: TestCallback
): ReturnType<TapeTestFunction['skip']> | ReturnType<TapeTestFunction> {
  return testIf(isNode, name, callback);
}

export {test};
export default test;
