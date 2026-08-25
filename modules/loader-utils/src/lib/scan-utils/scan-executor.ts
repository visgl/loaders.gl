// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** A lazily executed ordered unit of scan work. */
export type ScanTask<Value> = {
  /** Executes the task and returns its values as an asynchronous iterable. */
  readonly run: (signal: AbortSignal) => AsyncIterable<Value> | Promise<AsyncIterable<Value>>;
};

/** Options for bounded, ordered scan-task execution. */
export type ScanExecutorOptions = {
  /** Maximum number of tasks executing concurrently. Defaults to four. */
  readonly concurrency?: number;
  /** Signal used to cancel discovery, queued tasks, and active tasks. */
  readonly signal?: AbortSignal;
};

const DEFAULT_SCAN_CONCURRENCY = 4;

/**
 * Executes scan tasks concurrently while yielding values in task order.
 *
 * Each task has a one-value buffer. This preserves deterministic output without allowing a slow
 * earlier task to cause every later task to materialize its complete result in memory.
 */
export async function* executeScanTasks<Value>(
  tasks: AsyncIterable<ScanTask<Value>>,
  options: ScanExecutorOptions = {}
): AsyncIterable<Value> {
  const concurrency = normalizeScanConcurrency(options.concurrency);
  const execution = createScanExecution(options.signal);
  const signal = execution.signal;
  throwIfScanAborted(signal);
  const iterator = tasks[Symbol.asyncIterator]();
  const scheduledTasks = new Map<number, ScanTaskState<Value>>();
  let nextTaskIndex = 0;
  let nextOutputIndex = 0;
  let tasksComplete = false;
  let discoveryError: unknown;

  const scheduleNext = async (): Promise<void> => {
    if (tasksComplete) return;
    const next = await iterator.next();
    if (next.done) {
      tasksComplete = true;
      return;
    }
    const queue = new ScanValueQueue<Value>();
    const task = next.value;
    const execution = executeScanTask(task, queue, signal);
    scheduledTasks.set(nextTaskIndex++, {queue, execution});
  };

  const fillSlots = async (): Promise<void> => {
    try {
      while (scheduledTasks.size < concurrency && !tasksComplete) await scheduleNext();
    } catch (error) {
      discoveryError = error;
      tasksComplete = true;
    }
  };

  try {
    await scheduleNext();
    let discoveryPromise = fillSlots();
    while (scheduledTasks.size > 0) {
      const scheduledTask = scheduledTasks.get(nextOutputIndex);
      if (!scheduledTask) throw new Error('Scan executor internal task ordering error');
      for await (const value of scheduledTask.queue) {
        throwIfScanAborted(signal);
        yield value;
      }
      await scheduledTask.execution;
      scheduledTasks.delete(nextOutputIndex++);
      await discoveryPromise;
      if (discoveryError !== undefined) throw discoveryError;
      discoveryPromise = fillSlots();
    }
    await discoveryPromise;
    if (discoveryError !== undefined) throw discoveryError;
  } finally {
    execution.abortController.abort();
    execution.removeSignalListener();
    await iterator.return?.();
    await Promise.allSettled([...scheduledTasks.values()].map(task => task.execution));
  }
}

/** Creates an internal cancellation scope for one scan execution. */
function createScanExecution(signal?: AbortSignal): {
  abortController: AbortController;
  signal: AbortSignal;
  removeSignalListener: () => void;
} {
  const abortController = new AbortController();
  const abort = (): void => abortController.abort(signal?.reason);
  if (signal?.aborted) abort();
  else signal?.addEventListener('abort', abort, {once: true});
  return {
    abortController,
    signal: abortController.signal,
    removeSignalListener: () => signal?.removeEventListener('abort', abort)
  };
}

type ScanTaskState<Value> = {
  readonly queue: ScanValueQueue<Value>;
  readonly execution: Promise<void>;
};

/** Runs one task and forwards its values into a bounded queue. */
async function executeScanTask<Value>(
  task: ScanTask<Value>,
  queue: ScanValueQueue<Value>,
  signal?: AbortSignal
): Promise<void> {
  try {
    for await (const value of await task.run(signal || new AbortController().signal)) {
      await queue.push(value, signal);
    }
    queue.finish();
  } catch (error) {
    queue.fail(error);
  }
}

/** One-slot asynchronous queue used to apply backpressure between scan tasks and output. */
class ScanValueQueue<Value> implements AsyncIterable<Value> {
  private value!: Value;
  private hasValue = false;
  private finished = false;
  private error: unknown;
  private wakeConsumer: (() => void) | null = null;
  private wakeProducer: (() => void) | null = null;

  /** Buffers one value and waits until it has been consumed. */
  async push(value: Value, signal?: AbortSignal): Promise<void> {
    throwIfScanAborted(signal);
    while (this.hasValue) await this.waitForWakeup('producer', signal);
    this.value = value;
    this.hasValue = true;
    this.wakeConsumer?.();
    this.wakeConsumer = null;
    while (this.hasValue) await this.waitForWakeup('producer', signal);
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

  /** Iterates values in task order. */
  async *[Symbol.asyncIterator](): AsyncIterator<Value> {
    while (true) {
      if (this.hasValue) {
        const value = this.value;
        this.hasValue = false;
        this.wakeProducer?.();
        this.wakeProducer = null;
        yield value;
        continue;
      }
      if (this.error !== undefined) throw this.error;
      if (this.finished) return;
      await this.waitForWakeup('consumer');
    }
  }

  /** Waits for a queue transition while respecting cancellation. */
  private waitForWakeup(type: 'producer' | 'consumer', signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const abort = (): void => reject(signal?.reason || new DOMException('Aborted', 'AbortError'));
      const wakeup = (): void => {
        signal?.removeEventListener('abort', abort);
        resolve();
      };
      if (type === 'producer') this.wakeProducer = wakeup;
      else this.wakeConsumer = wakeup;
      if (signal?.aborted) abort();
      else signal?.addEventListener('abort', abort, {once: true});
    });
  }
}

/** Validates and normalizes scan concurrency. */
function normalizeScanConcurrency(value: number | undefined): number {
  const concurrency = value ?? DEFAULT_SCAN_CONCURRENCY;
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error(`scan concurrency must be a positive integer, received ${String(value)}`);
  }
  return concurrency;
}

/** Throws the caller's cancellation reason when a scan has been aborted. */
function throwIfScanAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw signal.reason || new DOMException('Aborted', 'AbortError');
}
