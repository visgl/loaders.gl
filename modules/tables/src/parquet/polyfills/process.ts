// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Minimal browser process shim required by transitive Parquet dependencies in a worker. */
export const process = {
  /** Empty environment exposed to dependencies that only probe for process.env. */
  env: {} as Record<string, string | undefined>,
  /** Empty version map exposed to dependencies that only probe for process.versions. */
  versions: {} as Record<string, string | undefined>,
  /** Browser workers do not have a process identifier. */
  pid: 0,
  /** Schedules a Node-style next-tick callback with its arguments. */
  nextTick(callback: (...arguments_: unknown[]) => void, ...arguments_: unknown[]): void {
    queueMicrotask(() => callback(...arguments_));
  }
};
