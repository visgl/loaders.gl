import {isBrowser as checkIsBrowser} from '@probe.gl/env';
import {test as vitestTest, vi, type TestFunction, type TestOptions} from 'vitest';

/** True when the current Vitest project is running in a browser-like runtime. */
export const isBrowser = checkIsBrowser();

/** True when the current Vitest project is running in Node.js. */
export const isNode = !isBrowser;

/** Options accepted by Vitest's test registration API. */
export type ConditionalTestOptions = number | TestOptions;

/**
 * Registers a Vitest test when `condition` is true, otherwise registers it as skipped.
 */
export function testIf(
  condition: boolean,
  name: string,
  testFunction: TestFunction,
  options?: ConditionalTestOptions
): void {
  const testImplementation = condition ? vitestTest : vitestTest.skip;

  if (options === undefined) {
    testImplementation(name, testFunction);
    return;
  }

  if (typeof options === 'number') {
    testImplementation(name, testFunction, options);
    return;
  }

  testImplementation(name, options, testFunction);
}

/**
 * Registers a Vitest test only in browser-like runtimes.
 */
export function testIfBrowser(
  name: string,
  testFunction: TestFunction,
  options?: ConditionalTestOptions
): void {
  testIf(isBrowser, name, testFunction, options);
}

/**
 * Registers a Vitest test only in Node.js.
 */
export function testIfNode(
  name: string,
  testFunction: TestFunction,
  options?: ConditionalTestOptions
): void {
  testIf(isNode, name, testFunction, options);
}

/** Deferred promise handles used to orchestrate callback-driven async tests. */
export type Deferred<T> = {
  /** Promise resolved or rejected by the exposed callbacks. */
  promise: Promise<T>;
  /** Resolves the deferred promise. */
  resolve: (value: T | PromiseLike<T>) => void;
  /** Rejects the deferred promise. */
  reject: (reason?: unknown) => void;
};

/** Options controlling how long `waitForCondition()` polls before failing. */
export type WaitForConditionOptions = {
  /** Maximum time to wait before the helper rejects. */
  timeoutMs?: number;
  /** Delay between condition checks. */
  intervalMs?: number;
  /** Optional custom timeout error message. */
  message?: string;
};

/**
 * Creates a deferred promise for explicit orchestration of callback or event-driven tests.
 */
export function createDeferred<T>(): Deferred<T> {
  let resolve!: Deferred<T>['resolve'];
  let reject!: Deferred<T>['reject'];

  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return {promise, resolve, reject};
}

/**
 * Flushes one queued microtask turn.
 */
export async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
}

/**
 * Polls until the supplied condition succeeds or the timeout elapses.
 */
export async function waitForCondition(
  check: () => boolean | Promise<boolean>,
  options: WaitForConditionOptions = {}
): Promise<void> {
  const {timeoutMs = 1_000, intervalMs = 10, message} = options;
  const startTime = Date.now();

  while (!(await check())) {
    if (Date.now() - startTime >= timeoutMs) {
      throw new Error(message || `Timed out waiting for condition after ${timeoutMs}ms`);
    }

    await new Promise<void>(resolve => {
      setTimeout(resolve, intervalMs);
    });
  }
}

/**
 * Runs one test body with fake timers enabled and always restores real timers afterward.
 */
export async function withFakeTimers<T>(testBody: () => T | Promise<T>): Promise<T> {
  vi.useFakeTimers();

  try {
    return await testBody();
  } finally {
    vi.useRealTimers();
  }
}

/**
 * Advances fake timers and then flushes one microtask turn.
 */
export async function advanceTimersAndFlush(milliseconds = 0): Promise<void> {
  await vi.advanceTimersByTimeAsync(milliseconds);
  await flushMicrotasks();
}
