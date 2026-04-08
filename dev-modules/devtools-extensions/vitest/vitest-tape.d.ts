type TestCallback = (test: Test) => void | Promise<void>;

type MatchPattern = RegExp | string;

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

export type TapeTestFunction = {
  (name: string, callback: TestCallback): unknown;
  only: (name: string, callback: TestCallback) => unknown;
  skip: (name: string, callback?: TestCallback) => unknown;
};

declare const test: TapeTestFunction;

export {test};
export default test;
