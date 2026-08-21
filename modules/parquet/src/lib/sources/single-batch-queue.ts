// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** One-slot asynchronous queue that applies backpressure between a producer and ordered output. */
export class SingleBatchQueue<Value> implements AsyncIterable<Value> {
  /** Buffered batch, limited to one value. */
  private value: Value | undefined;
  /** Whether the producer completed successfully. */
  private finished = false;
  /** Producer failure rethrown by the consumer. */
  private error: unknown;
  /** Wakes a consumer waiting for a value. */
  private wakeConsumer: (() => void) | null = null;
  /** Wakes a producer after its buffered value is consumed. */
  private wakeProducer: (() => void) | null = null;

  /** Buffers one value and waits until it has been consumed. */
  async push(value: Value, signal: AbortSignal): Promise<void> {
    throwIfAborted(signal);
    while (this.value !== undefined) {
      await this.waitForWakeup('producer', signal);
    }
    this.value = value;
    this.wakeConsumer?.();
    this.wakeConsumer = null;
    while (this.value !== undefined) {
      await this.waitForWakeup('producer', signal);
    }
  }

  /** Marks the queue complete and wakes its consumer. */
  finish(): void {
    this.finished = true;
    this.wakeConsumer?.();
    this.wakeConsumer = null;
  }

  /** Stores a producer error and wakes its consumer. */
  fail(error: unknown): void {
    this.error = error;
    this.finished = true;
    this.wakeConsumer?.();
    this.wakeConsumer = null;
  }

  /** Returns the ordered asynchronous batch iterator. */
  async *[Symbol.asyncIterator](): AsyncIterator<Value> {
    while (true) {
      if (this.value !== undefined) {
        const value = this.value;
        this.value = undefined;
        this.wakeProducer?.();
        this.wakeProducer = null;
        yield value;
        continue;
      }
      if (this.error !== undefined) {
        throw this.error;
      }
      if (this.finished) {
        return;
      }
      await this.waitForWakeup('consumer');
    }
  }

  /** Waits for a producer or consumer queue transition and supports read cancellation. */
  private waitForWakeup(type: 'producer' | 'consumer', signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const abort = (): void => reject(signal?.reason || new DOMException('Aborted', 'AbortError'));
      const wakeup = (): void => {
        signal?.removeEventListener('abort', abort);
        resolve();
      };
      if (type === 'producer') {
        this.wakeProducer = wakeup;
      } else {
        this.wakeConsumer = wakeup;
      }
      if (signal?.aborted) {
        abort();
      } else {
        signal?.addEventListener('abort', abort, {once: true});
      }
    });
  }
}

/** Throws a standard abort failure when a queued operation has been cancelled. */
function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw signal.reason || new DOMException('Aborted', 'AbortError');
  }
}
