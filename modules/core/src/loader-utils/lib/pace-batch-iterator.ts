// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Options for pacing a batch stream by delivered row count. */
export type BatchPacingOptions<BatchT> = {
  /** Maximum average delivery rate between batches. Zero disables pacing. */
  batchMaxRowsPerSecond?: number;
  /** Returns the number of data rows, or undefined for control messages. */
  getRowCount: (batch: BatchT) => number | undefined;
  /** Cancels delivery, including a pending timer. */
  signal?: AbortSignal;
};

/** Validates the configured batch delivery rate before starting a parser. */
export function validateBatchDeliveryRate(rate: number): void {
  if (!Number.isFinite(rate) || rate < 0) {
    throw new RangeError('core.batchMaxRowsPerSecond must be a finite nonnegative number');
  }
}

/** Delivers the first nonempty batch immediately and spaces subsequent data by row count. */
export async function* paceBatchIterator<BatchT>(
  batches: AsyncIterable<BatchT> | Iterable<BatchT>,
  {batchMaxRowsPerSecond = 0, getRowCount, signal}: BatchPacingOptions<BatchT>
): AsyncIterable<BatchT> {
  validateBatchDeliveryRate(batchMaxRowsPerSecond);
  signal?.throwIfAborted();
  if (batchMaxRowsPerSecond === 0) {
    yield* batches;
    return;
  }
  let deadline = 0;
  for await (const batch of batches) {
    signal?.throwIfAborted();
    const rowCount = getRowCount(batch);
    if (rowCount !== undefined && rowCount > 0) {
      let remaining = deadline - performance.now();
      while (remaining > 0) {
        await waitForBatch(Math.min(Math.ceil(remaining), 2 ** 31 - 1), signal);
        remaining = deadline - performance.now();
      }
      signal?.throwIfAborted();
      deadline = performance.now() + (rowCount / batchMaxRowsPerSecond) * 1000;
    }
    yield batch;
    signal?.throwIfAborted();
  }
}

/** Waits for a delivery timer or cancellation and removes its listener in either case. */
function waitForBatch(delay: number, signal?: AbortSignal): Promise<void> {
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      resolve();
    }, delay);
    function abort(): void {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      reject(signal?.reason);
    }
    signal?.addEventListener('abort', abort, {once: true});
  });
}
