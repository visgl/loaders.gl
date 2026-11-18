// SPDX-License-Identifier: MIT
import {afterEach, expect, test, vi} from 'vitest';
import {
  NullWorker,
  processOnWorker,
  processOnWorkerInBatches,
  preloadWorker,
  canProcessOnWorker,
  canProcessOnWorkerInBatches,
  destroyWorkerTasks,
  type WorkerObject
} from '@loaders.gl/core/worker-utils';

const url = new URL('/modules/core/test/worker-utils/fixtures/task-worker.ts', location.href).href;
const worker: WorkerObject = {...NullWorker, worker: url, workerInBatches: true};
afterEach(() => destroyWorkerTasks());

test('task adapter routes named payloads, separate parser options, progress, and context', async () => {
  const onProgress = vi.fn();
  await expect(
    processOnWorker(worker, new Uint8Array([1, 2]), {onProgress}, {}, {source: 'caller'})
  ).resolves.toEqual({
    input: new Uint8Array([1, 2]),
    context: {source: 'caller'}
  });
  expect(onProgress).toHaveBeenCalledExactlyOnceWith({
    phase: 'parse',
    completed: 1,
    total: 1,
    unit: 'items'
  });
});

test('task adapter resolves caller callbacks and preserves their errors', async () => {
  const process = vi.fn(async (input, options, _context, jobContext) => ({
    input,
    marker: options.marker,
    jobContext
  }));
  await expect(
    processOnWorker(worker, 'input', {callback: true, marker: 3}, {process}, {resource: 'file'})
  ).resolves.toEqual({
    input: 'input',
    marker: 3,
    jobContext: {resource: 'file'}
  });
  await expect(
    processOnWorker(
      worker,
      'input',
      {callback: true},
      {
        process: async () => {
          throw new TypeError('callback failed');
        }
      }
    )
  ).rejects.toThrow('callback failed');
  await expect(processOnWorker(worker, 'input', {fail: true})).rejects.toThrow('task failed');
});

test('task adapter copies or transfers inputs as requested', async () => {
  const copied = new Uint8Array([1]);
  await processOnWorker(worker, copied, {inputOwnership: 'copy'});
  expect(copied.byteLength).toBe(1);
  const transferred = new Uint8Array([2]);
  await processOnWorker(worker, transferred);
  expect(transferred.byteLength).toBe(0);
});

test('streaming retains context and state on one handle and reports final progress', async () => {
  const onProgress = vi.fn();
  const results = [];
  for await (const result of processOnWorkerInBatches(
    worker,
    ['a', 'b'],
    {marker: 4, onProgress},
    {},
    {source: 'stream'}
  )) {
    results.push(result);
  }
  expect(onProgress).toHaveBeenLastCalledWith({phase: 'parse', completed: 2, unit: 'batches'});
  expect(results).toEqual([
    {input: 'a', batchIndex: 1, context: {source: 'stream'}, option: 4},
    {input: 'b', batchIndex: 2, context: {source: 'stream'}, option: 4}
  ]);
});

test('aborted queued and active handles preserve reasons and release capacity', async () => {
  const reason = new Error('stop task');
  const active = new AbortController();
  const first = processOnWorker(worker, 'a', {
    delay: 5000,
    maxConcurrency: 1,
    signal: active.signal
  });
  const queued = new AbortController();
  const second = processOnWorker(worker, 'b', {signal: queued.signal});
  queued.abort(reason);
  await expect(second).rejects.toBe(reason);
  active.abort(reason);
  await expect(first).rejects.toBe(reason);
  await expect(processOnWorker(worker, 'c')).resolves.toMatchObject({input: 'c'});
});

test('factories, explicit URL overrides, preload, and teardown use public task lifecycles', async () => {
  const loadWorker = vi.fn(() => new Worker(url, {type: 'module'}));
  const factory = {...worker, loadWorker};
  await processOnWorker(factory, 'factory');
  expect(loadWorker).toHaveBeenCalledOnce();
  await processOnWorker(factory, 'override', {null: {workerUrl: url}});
  expect(loadWorker).toHaveBeenCalledOnce();
  await preloadWorker(worker);
  await destroyWorkerTasks();
  await expect(processOnWorker(worker, 'after teardown')).resolves.toMatchObject({
    input: 'after teardown'
  });
  await expect(
    processOnWorker(worker, 'legacy', {source: 'self.onmessage = () => {}'})
  ).rejects.toThrow('Inline legacy');
});

test('routing requires explicit opt-in and custom streaming capability', () => {
  expect(canProcessOnWorker(worker)).toBe(false);
  expect(canProcessOnWorker(worker, {worker: true})).toBe(true);
  expect(canProcessOnWorker({...worker, worker: false}, {worker: true})).toBe(false);
  expect(canProcessOnWorkerInBatches(worker, {worker: true})).toBe(true);
  expect(canProcessOnWorkerInBatches(worker, {worker: true, null: {workerUrl: url}})).toBe(false);
  expect(
    canProcessOnWorkerInBatches(worker, {
      worker: true,
      workerInBatches: true,
      null: {workerUrl: url}
    })
  ).toBe(true);
});

test('callback setup preserves copied input and caller-owned context buffers', async () => {
  const input = new Uint8Array([7]);
  const contextBuffer = new Uint8Array([9]);
  const result = await processOnWorker(
    worker,
    input,
    {callback: true, inputOwnership: 'copy'},
    {
      process: async (value, _options, _context, jobContext) => ({
        value,
        contextBuffer: jobContext?.contextBuffer
      })
    },
    {contextBuffer}
  );
  expect(result).toEqual({value: new Uint8Array([7]), contextBuffer: new Uint8Array([9])});
  expect(input.byteLength).toBe(1);
  expect(contextBuffer.byteLength).toBe(1);
});

test.runIf(typeof SharedArrayBuffer !== 'undefined')(
  'callback setup does not apply shared payload ownership to the private MessagePort',
  async () => {
    const input = new Uint8Array(new SharedArrayBuffer(1));
    input[0] = 5;
    const result = await processOnWorker(
      worker,
      input,
      {callback: true, inputOwnership: 'share'},
      {
        process: async value => value
      }
    );
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result[0]).toBe(5);
    expect(input.byteLength).toBe(1);
  }
);

test.each([
  false,
  true
])('cross-origin worker entrypoints use a same-origin module shim (null factory: %s)', async withFactory => {
  const requestedUrl = 'https://worker.example.invalid/parser.js';
  let constructedUrl = '';
  let moduleSource: Blob | undefined;
  const createUrl = URL.createObjectURL.bind(URL);
  const objectUrl = vi.spyOn(URL, 'createObjectURL').mockImplementation(blob => {
    if (blob instanceof Blob) moduleSource = blob;
    return createUrl(blob);
  });
  const constructor = vi.spyOn(globalThis, 'Worker').mockImplementation(function (target) {
    constructedUrl = String(target);
    throw new Error('captured module worker');
  } as any);
  try {
    const descriptor = {
      ...worker,
      worker: requestedUrl,
      ...(withFactory ? {loadWorker: () => null} : {})
    };
    await expect(processOnWorker(descriptor, 'input')).rejects.toThrow('captured module worker');
    expect(constructedUrl).toMatch(/^blob:/);
    const firstUrl = constructedUrl;
    await expect(processOnWorker(descriptor, 'second')).rejects.toThrow('captured module worker');
    if (withFactory) expect(constructedUrl).toBe(firstUrl);
    else expect(constructedUrl).not.toBe(firstUrl);
    expect(await moduleSource!.text()).toBe(`import ${JSON.stringify(requestedUrl)};`);
    if (!withFactory) {
      await expect(fetch(firstUrl)).rejects.toThrow();
      await expect(fetch(constructedUrl)).rejects.toThrow();
    }
    await destroyWorkerTasks();
    await expect(fetch(constructedUrl)).rejects.toThrow();
  } finally {
    constructor.mockRestore();
    objectUrl.mockRestore();
  }
});

test('cancelling a task signals caller callbacks and ignores late failures', async () => {
  const controller = new AbortController();
  let beginCallback!: () => void;
  const began = new Promise<void>(resolve => {
    beginCallback = resolve;
  });
  let rejectCallback!: (reason: unknown) => void;
  let callbackSignal: AbortSignal | undefined;
  const callbackSettled = vi.fn();
  const request = processOnWorker(
    worker,
    'input',
    {callback: true, signal: controller.signal},
    {
      process: async (_input, options, context) => {
        callbackSignal = context?.signal;
        context?.throwIfAborted?.();
        expect(options?.signal).toBeUndefined();
        beginCallback();
        try {
          return await new Promise((_resolve, reject) => {
            rejectCallback = reject;
          });
        } finally {
          callbackSettled();
        }
      }
    }
  );
  await began;
  const reason = new Error('cancel nested work');
  controller.abort(reason);
  await expect(request).rejects.toBe(reason);
  expect(callbackSignal?.aborted).toBe(true);
  expect(callbackSignal?.reason).toBe(reason);
  rejectCallback(new Error('late callback failure'));
  await vi.waitFor(() => expect(callbackSettled).toHaveBeenCalledOnce());
});

test('shutdown cancels active requests and allows a fresh runner', async () => {
  let beginCallback!: () => void;
  const began = new Promise<void>(resolve => {
    beginCallback = resolve;
  });
  const request = processOnWorker(
    worker,
    'input',
    {callback: true},
    {
      process: async (_input, _options, context) => {
        beginCallback();
        return await new Promise((_resolve, reject) => {
          context?.signal?.addEventListener('abort', () => reject(context.signal?.reason), {
            once: true
          });
        });
      }
    }
  );
  const rejection = expect(request).rejects.toThrow('shutdown request');
  await began;
  await destroyWorkerTasks(new Error('shutdown request'));
  await rejection;
  await expect(processOnWorker(worker, 'fresh')).resolves.toMatchObject({input: 'fresh'});
});

test('relative worker entrypoints honor the document base URL', async () => {
  const base = vi
    .spyOn(document, 'baseURI', 'get')
    .mockReturnValue('https://worker.example.invalid/nested/');
  let constructedUrl = '';
  let moduleSource: Blob | undefined;
  const createUrl = URL.createObjectURL.bind(URL);
  const objectUrl = vi.spyOn(URL, 'createObjectURL').mockImplementation(blob => {
    if (blob instanceof Blob) moduleSource = blob;
    return createUrl(blob);
  });
  const constructor = vi.spyOn(globalThis, 'Worker').mockImplementation(function (target) {
    constructedUrl = String(target);
    throw new Error('captured relative worker');
  } as any);
  try {
    await expect(processOnWorker({...worker, worker: './parser.js'}, 'input')).rejects.toThrow(
      'captured relative worker'
    );
    expect(await moduleSource!.text()).toBe(
      'import "https://worker.example.invalid/nested/parser.js";'
    );
  } finally {
    constructor.mockRestore();
    objectUrl.mockRestore();
    base.mockRestore();
  }
});

test('worker transport preserves explicit null parser options', async () => {
  const options = {callback: true, core: {fetch: null, CDN: null}, nullable: {value: null}};
  await expect(
    processOnWorker(worker, 'input', options, {
      process: async (_input, parserOptions) => ({
        core: parserOptions?.core,
        nullable: parserOptions?.nullable
      })
    })
  ).resolves.toEqual({core: {fetch: null, CDN: null}, nullable: {value: null}});
  expect(options.core).toEqual({fetch: null, CDN: null});
});

test('queued streaming cancellation requests input cleanup without awaiting a blocked return', async () => {
  const descriptor = {...worker};
  const active = new AbortController();
  const queued = new AbortController();
  const reason = new Error('cancel queued stream');
  const first = processOnWorker(descriptor, 'active', {
    delay: 5000,
    maxConcurrency: 1,
    signal: active.signal
  });
  const firstRejection = expect(first).rejects.toBe(reason);
  const input: AsyncIterableIterator<string> = {
    [Symbol.asyncIterator]() {
      return this;
    },
    next: vi.fn(async () => ({done: false as const, value: 'unused'})),
    return: vi.fn(async () => await new Promise<IteratorResult<string>>(() => {}))
  };
  try {
    const iterator = processOnWorkerInBatches(descriptor, input, {signal: queued.signal})[
      Symbol.asyncIterator
    ]();
    const rejection = expect(iterator.next()).rejects.toBe(reason);
    queued.abort(reason);
    await rejection;
    expect(input.next).not.toHaveBeenCalled();
    expect(input.return).toHaveBeenCalledOnce();
  } finally {
    active.abort(reason);
    await firstRejection;
  }
});

test('stream initialization errors preserve their cause and close input despite cleanup rejection', async () => {
  const reason = new Error('worker startup failed');
  const input: AsyncIterableIterator<string> = {
    [Symbol.asyncIterator]() {
      return this;
    },
    next: vi.fn(async () => ({done: false as const, value: 'unused'})),
    return: vi.fn(async () => {
      throw new Error('input cleanup failed');
    })
  };
  const descriptor = {
    ...worker,
    loadWorker: () => {
      throw reason;
    }
  };
  const iterator = processOnWorkerInBatches(descriptor, input)[Symbol.asyncIterator]();
  await expect(iterator.next()).rejects.toBe(reason);
  expect(input.next).not.toHaveBeenCalled();
  expect(input.return).toHaveBeenCalledOnce();
});

test('stream option validation failures close input before it is consumed', async () => {
  const input: AsyncIterableIterator<string> = {
    [Symbol.asyncIterator]() {
      return this;
    },
    next: vi.fn(async () => ({done: false as const, value: 'unused'})),
    return: vi.fn(async () => ({done: true as const, value: undefined}))
  };
  const iterator = processOnWorkerInBatches(worker, input, {unsupported: [() => {}]})[
    Symbol.asyncIterator
  ]();
  await expect(iterator.next()).rejects.toMatchObject({name: 'DataCloneError'});
  expect(input.next).not.toHaveBeenCalled();
  expect(input.return).toHaveBeenCalledOnce();
});
