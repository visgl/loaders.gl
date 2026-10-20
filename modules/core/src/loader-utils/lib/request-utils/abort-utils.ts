// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Waits for work or caller cancellation, preserving reasons and observing obsolete failures. */
export function waitForPromiseWithSignal<ValueT>(
  promise: Promise<ValueT>,
  signal?: AbortSignal
): Promise<ValueT> {
  if (!signal) return promise;
  if (signal.aborted) {
    void promise.catch(() => {});
    return Promise.reject(signal.reason);
  }
  return new Promise((resolve, reject) => {
    const abort = () => {
      signal.removeEventListener('abort', abort);
      reject(signal.reason);
    };
    signal.addEventListener('abort', abort, {once: true});
    void promise.then(
      value => {
        signal.removeEventListener('abort', abort);
        resolve(value);
      },
      error => {
        signal.removeEventListener('abort', abort);
        reject(error);
      }
    );
  });
}

/** Runs work with an owned signal, cancels remaining work on failure, and releases parent listeners. */
export function waitForPromiseWithSignals<ValueT>(
  operation: (signal: AbortSignal) => Promise<ValueT>,
  signals: (AbortSignal | undefined)[]
): Promise<ValueT> {
  const controller = new AbortController();
  const listeners: [AbortSignal, () => void][] = [];
  const cleanup = () => {
    for (const [signal, listener] of listeners) signal.removeEventListener('abort', listener);
  };
  for (const signal of signals) {
    if (!signal) continue;
    const listener = () => controller.abort(signal.reason);
    listeners.push([signal, listener]);
    signal.addEventListener('abort', listener, {once: true});
    if (signal.aborted) listener();
  }
  try {
    controller.signal.throwIfAborted();
    return waitForPromiseWithSignal(operation(controller.signal), controller.signal)
      .catch(error => {
        controller.abort(error);
        throw error;
      })
      .finally(cleanup);
  } catch (error) {
    controller.abort(error);
    cleanup();
    return Promise.reject(error);
  }
}
