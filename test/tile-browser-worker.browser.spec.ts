import {afterEach, expect, test, vi} from 'vitest';
import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import {ConversionPanel} from '../examples/website/i3s-slpk/src/components/conversion-panel';
import {
  convertSelectedContentsInWorker,
  saveSelectedContentsInWorker
} from '../examples/website/i3s-slpk/src/conversion-worker-client';
import {
  CONVERSION_LIMITS,
  inspectConversionInput
} from '../examples/website/i3s-slpk/src/convert-tileset';
import {transferArchiveChunks} from '../examples/website/i3s-slpk/src/conversion-worker-stream';
import {createInput, setInputValue, readSettledControl} from './utils/tile-browser-conversion';

/** Installs a controllable worker boundary, without duplicating conversion or format coverage. */
function createWorkerHarness() {
  const worker = {
    onmessage: null as Worker['onmessage'],
    onerror: null as Worker['onerror'],
    onmessageerror: null as Worker['onmessageerror'],
    postMessage: vi.fn(),
    terminate: vi.fn()
  };
  const constructor = vi.fn(function (_url: URL, _options: WorkerOptions) {
    return worker;
  });
  vi.stubGlobal('Worker', constructor);
  return {worker, constructor};
}

/** Supplies the same bounded inspected document as the existing converter integration fixtures. */
async function createOperation() {
  const {fetcher, controller} = createInput();
  const inspection = await inspectConversionInput(
    'https://example.invalid/tileset.json',
    controller.signal,
    fetcher
  );
  return {inspection, controller, resourceIds: [inspection.resources[1].resourceId]};
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test('worker client forwards only cloneable selection, reports progress and releases a finalized archive', async () => {
  const {worker, constructor} = createWorkerHarness();
  const {inspection, controller, resourceIds} = await createOperation();
  const progress = vi.fn();
  const result = convertSelectedContentsInWorker(
    inspection,
    resourceIds,
    '3tz',
    controller.signal,
    progress
  );
  expect(constructor.mock.calls[0][1]).toEqual({type: 'module'});
  expect(worker.postMessage).toHaveBeenCalledExactlyOnceWith({
    inspection,
    resourceIds,
    format: '3tz',
    features: undefined
  });
  worker.onmessage!.call(
    worker as any,
    new MessageEvent('message', {data: {type: 'progress', message: 'encode'}})
  );
  expect(progress).toHaveBeenCalledExactlyOnceWith('encode');
  const firstBytes = new Uint8Array([9, 1, 2, 8]);
  for (const [sequence, chunk] of [firstBytes.subarray(1, 3), new Uint8Array([3])].entries()) {
    await worker.onmessage!.call(
      worker as any,
      new MessageEvent('message', {data: {type: 'chunk', sequence, chunk}})
    );
    expect(worker.postMessage).toHaveBeenLastCalledWith({type: 'continue', sequence});
  }
  firstBytes.fill(0); // The acknowledgement follows a Blob snapshot, not a retained mutable view.
  const report = {diagnostics: []};
  worker.onmessage!.call(
    worker as any,
    new MessageEvent('message', {
      data: {
        type: 'result',
        totalBytes: 3,
        name: 'selected-mesh.3tz',
        mimeType: 'application/zip',
        report
      }
    })
  );
  const output = await result;
  expect(output.file.name).toBe('selected-mesh.3tz');
  expect(output.file.type).toBe('application/zip');
  expect(new Uint8Array(await output.file.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  expect(output.report).toEqual(report);
  expect(worker.terminate).toHaveBeenCalledOnce();
  expect(worker.onmessage).toBeNull();
  controller.abort();
  expect(worker.terminate).toHaveBeenCalledOnce();
});

test('cancel terminates synchronous work and suppresses queued progress or success', async () => {
  const {worker} = createWorkerHarness();
  const {inspection, controller, resourceIds} = await createOperation();
  const progress = vi.fn();
  const result = convertSelectedContentsInWorker(
    inspection,
    resourceIds,
    'slpk',
    controller.signal,
    progress
  );
  const receive = worker.onmessage!;
  receive.call(
    worker as any,
    new MessageEvent('message', {data: {type: 'chunk', sequence: 0, chunk: new Uint8Array([1])}})
  );
  controller.abort(new Error('cancel worker'));
  await expect(result).rejects.toThrow('cancel worker');
  receive.call(
    worker as any,
    new MessageEvent('message', {data: {type: 'progress', message: 'late'}})
  );
  receive.call(worker as any, new MessageEvent('message', {data: {type: 'result', totalBytes: 1}}));
  expect(progress).not.toHaveBeenCalled();
  expect(worker.terminate).toHaveBeenCalledOnce();
});

test.each([
  'error',
  'messageerror',
  'runtime',
  'send',
  'acknowledgement',
  'callback'
] as const)('worker client cleans up on %s failure', async failure => {
  const {worker} = createWorkerHarness();
  const {inspection, controller, resourceIds} = await createOperation();
  if (failure === 'send')
    worker.postMessage.mockImplementation(() => {
      throw new Error('clone failed');
    });
  const result = convertSelectedContentsInWorker(
    inspection,
    resourceIds,
    '3tz',
    controller.signal,
    () => {
      throw new Error('callback failed');
    }
  );
  if (failure === 'acknowledgement') {
    worker.postMessage.mockImplementation(() => {
      throw new Error('acknowledgement failed');
    });
    worker.onmessage!.call(
      worker as any,
      new MessageEvent('message', {data: {type: 'chunk', sequence: 0, chunk: new Uint8Array([1])}})
    );
  }
  if (failure === 'error')
    worker.onmessage!.call(
      worker as any,
      new MessageEvent('message', {data: {type: 'error', message: 'unsupported mesh'}})
    );
  if (failure === 'messageerror')
    worker.onmessageerror!.call(worker as any, new MessageEvent('messageerror'));
  if (failure === 'runtime')
    worker.onerror!.call(
      worker as any,
      new ErrorEvent('error', {message: 'worker crashed', cancelable: true})
    );
  if (failure === 'callback')
    worker.onmessage!.call(
      worker as any,
      new MessageEvent('message', {data: {type: 'progress', message: 'encode'}})
    );
  await expect(result).rejects.toBeInstanceOf(Error);
  expect(worker.terminate).toHaveBeenCalledOnce();
  expect(worker.onmessage).toBeNull();
  controller.abort();
  expect(worker.terminate).toHaveBeenCalledOnce();
});

test('already canceled operations allocate no worker', async () => {
  const {constructor} = createWorkerHarness();
  const {inspection, controller, resourceIds} = await createOperation();
  controller.abort();
  await expect(
    convertSelectedContentsInWorker(inspection, resourceIds, '3tz', controller.signal, () => {})
  ).rejects.toMatchObject({name: 'AbortError'});
  expect(constructor).not.toHaveBeenCalled();
});

test('conversion controls terminate workers on cancel and unmount, and allow a fresh retry', async () => {
  const {worker, constructor} = createWorkerHarness();
  const {fetcher} = createInput();
  vi.stubGlobal('fetch', fetcher);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  let unmounted = false;
  try {
    await act(async () => root.render(React.createElement(ConversionPanel, {onPreview: () => {}})));
    await setInputValue(container.querySelector('input')!, 'https://example.invalid/tileset.json');
    await act(async () =>
      container
        .querySelector('form')!
        .dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}))
    );
    await expect
      .poll(() => readSettledControl(() => container.querySelector('#conversion-content')))
      .not.toBeNull();
    const selection = container.querySelector<HTMLSelectElement>('#conversion-content')!;
    selection.value = 'tile-0-content-1';
    await act(async () => selection.dispatchEvent(new Event('change', {bubbles: true})));
    const convert = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent === 'Convert selected content'
    )!;
    await act(async () => convert.click());
    expect(constructor).toHaveBeenCalledOnce();
    await act(async () =>
      Array.from(container.querySelectorAll('button'))
        .find(button => button.textContent === 'Cancel')!
        .click()
    );
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(container.querySelector('[role="status"]')!.textContent).toBe('Canceled');
    expect(container.querySelector('a')).toBeNull();
    expect(container.querySelector('[role="alert"]')).toBeNull();
    await act(async () => convert.click());
    expect(constructor).toHaveBeenCalledTimes(2);
    await act(async () => root.unmount());
    unmounted = true;
    expect(worker.terminate).toHaveBeenCalledTimes(2);
  } finally {
    if (!unmounted) await act(async () => root.unmount());
    container.remove();
  }
});

test.each([
  'order',
  'budget',
  'view',
  'empty-result',
  'short-result',
  'unknown'
] as const)('worker client discards partial output on %s protocol failure', async failure => {
  const {worker} = createWorkerHarness();
  const {inspection, controller, resourceIds} = await createOperation();
  const result = convertSelectedContentsInWorker(
    inspection,
    resourceIds,
    '3tz',
    controller.signal,
    () => {}
  );
  const chunk = new Uint8Array([1]);
  if (failure === 'budget')
    Object.defineProperty(chunk, 'byteLength', {value: CONVERSION_LIMITS.maxOutputBytes + 1});
  if (failure === 'short-result') {
    await worker.onmessage!.call(
      worker as any,
      new MessageEvent('message', {data: {type: 'chunk', sequence: 0, chunk}})
    );
  }
  const data =
    failure === 'empty-result' || failure === 'short-result'
      ? {type: 'result', totalBytes: 0}
      : failure === 'unknown'
        ? {type: 'unexpected'}
        : {
            type: 'chunk',
            sequence: failure === 'order' ? 1 : 0,
            chunk: failure === 'view' ? new DataView(chunk.buffer) : chunk
          };
  worker.onmessage!.call(worker as any, new MessageEvent('message', {data}));
  await expect(result).rejects.toThrow();
  expect(worker.terminate).toHaveBeenCalledOnce();
  expect(worker.onmessage).toBeNull();
});

test('worker producer transfers byte views and waits for each acknowledgement before pulling', async () => {
  const events: string[] = [];
  let closed = false;
  /** Records iterator lifetime without decoding or packaging another fixture. */
  async function* chunks() {
    try {
      events.push('pull:0');
      yield new Uint8Array([9, 1, 2, 8]).subarray(1, 3);
      events.push('pull:1');
      yield new Uint8Array([3]);
    } finally {
      closed = true;
    }
  }
  const delivered: Uint8Array[] = [];
  const scope = {
    onmessage: null as Worker['onmessage'],
    postMessage: vi.fn((message: any, transfer: Transferable[]) => {
      delivered.push(structuredClone(message, {transfer}).chunk);
      expect(message.chunk.buffer.byteLength).toBe(0);
    })
  };
  const result = transferArchiveChunks(chunks(), scope as any);
  await expect.poll(() => delivered.length).toBe(1);
  expect(events).toEqual(['pull:0']);
  expect(Array.from(delivered[0])).toEqual([1, 2]);
  scope.onmessage!.call(
    scope as any,
    new MessageEvent('message', {data: {type: 'continue', sequence: 0}})
  );
  await expect.poll(() => delivered.length).toBe(2);
  expect(events).toEqual(['pull:0', 'pull:1']);
  expect(closed).toBe(false);
  scope.onmessage!.call(
    scope as any,
    new MessageEvent('message', {data: {type: 'continue', sequence: 1}})
  );
  await expect(result).resolves.toBe(3);
  expect(closed).toBe(true);
  expect(scope.onmessage).toBeNull();
});

test.each([
  'sequence',
  'type',
  'send'
] as const)('worker producer closes its iterator on %s failure', async failure => {
  let closed = false;
  /** Provides one chunk with an observable early-return cleanup. */
  async function* chunks() {
    try {
      yield new Uint8Array([1]);
    } finally {
      closed = true;
    }
  }
  const scope = {
    onmessage: null as Worker['onmessage'],
    postMessage: vi.fn(() => {
      if (failure === 'send') throw new Error('transfer failed');
    })
  };
  const result = transferArchiveChunks(chunks(), scope as any);
  const assertion = expect(result).rejects.toThrow();
  if (failure !== 'send') {
    await expect.poll(() => scope.postMessage.mock.calls.length).toBe(1);
    scope.onmessage!.call(
      scope as any,
      new MessageEvent('message', {
        data: {
          type: failure === 'type' ? 'invalid' : 'continue',
          sequence: failure === 'sequence' ? 1 : 0
        }
      })
    );
  }
  await assertion;
  expect(closed).toBe(true);
  expect(scope.onmessage).toBeNull();
});

/** Provides explicit gates for destination backpressure and file finalization. */
function createDeferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(complete => {
    resolve = complete;
  });
  return {promise, resolve};
}

/** Supplies terminal metadata without re-encoding a conversion fixture. */
function sendCompletion(worker: ReturnType<typeof createWorkerHarness>['worker'], totalBytes = 2) {
  return worker.onmessage!.call(
    worker as any,
    new MessageEvent('message', {
      data: {
        type: 'result',
        totalBytes,
        name: 'selected-mesh.3tz',
        mimeType: 'application/zip',
        report: {diagnostics: []}
      }
    })
  );
}

test.each([
  false,
  true
])('direct save awaits writes and close, releases its lock, and retains no Blob parts with transfer=%s', async transfer => {
  const {worker} = createWorkerHarness();
  const {inspection, controller, resourceIds} = await createOperation();
  const writeGate = createDeferred();
  const closeGate = createDeferred();
  const received: number[][] = [];
  const write = vi.fn(async (chunk: Uint8Array<ArrayBuffer>) => {
    received.push(Array.from(chunk));
    if (transfer) structuredClone(chunk, {transfer: [chunk.buffer]});
    await writeGate.promise;
  });
  const close = vi.fn(() => closeGate.promise);
  const destination = new WritableStream({write, close});
  const blob = vi.spyOn(globalThis, 'Blob').mockImplementation(() => {
    throw new Error('Archive Blob retention');
  });
  const result = saveSelectedContentsInWorker(
    inspection,
    resourceIds,
    '3tz',
    controller.signal,
    () => {},
    destination
  );
  const pendingWrite = worker.onmessage!.call(
    worker as any,
    new MessageEvent('message', {
      data: {type: 'chunk', sequence: 0, chunk: new Uint8Array([9, 1, 2, 8]).subarray(1, 3)}
    })
  );
  await expect.poll(() => write.mock.calls.length).toBe(1);
  expect(worker.postMessage).toHaveBeenCalledOnce();
  expect(received).toEqual([[1, 2]]);
  expect(destination.locked).toBe(true);
  writeGate.resolve();
  await pendingWrite;
  expect(worker.postMessage).toHaveBeenLastCalledWith({type: 'continue', sequence: 0});
  await sendCompletion(worker);
  await expect.poll(() => close.mock.calls.length).toBe(1);
  let completed = false;
  void result.then(() => {
    completed = true;
  });
  expect(completed).toBe(false);
  closeGate.resolve();
  await expect(result).resolves.toEqual({size: 2, report: {diagnostics: []}});
  expect(blob).not.toHaveBeenCalled();
  expect(destination.locked).toBe(false);
  expect(worker.terminate).toHaveBeenCalledOnce();
});

test('direct save cancellation during a pending write aborts without acknowledging or closing', async () => {
  const {worker} = createWorkerHarness();
  const {inspection, controller, resourceIds} = await createOperation();
  const gate = createDeferred();
  const abort = vi.fn();
  const close = vi.fn();
  const write = vi.fn(() => gate.promise);
  const destination = new WritableStream({write, abort, close});
  const result = saveSelectedContentsInWorker(
    inspection,
    resourceIds,
    '3tz',
    controller.signal,
    () => {},
    destination
  );
  const assertion = expect(result).rejects.toThrow('cancel file');
  const pendingWrite = worker.onmessage!.call(
    worker as any,
    new MessageEvent('message', {
      data: {
        type: 'chunk',
        sequence: 0,
        chunk: new Uint8Array([1, 2])
      }
    })
  );
  await expect.poll(() => write.mock.calls.length).toBe(1);
  const reason = new Error('cancel file');
  controller.abort(reason);
  expect(worker.terminate).toHaveBeenCalledOnce();
  gate.resolve();
  await pendingWrite;
  await assertion;
  expect(worker.postMessage).toHaveBeenCalledOnce();
  expect(close).not.toHaveBeenCalled();
  expect(abort).toHaveBeenCalledExactlyOnceWith(reason);
  expect(destination.locked).toBe(false);
});

test.each([
  'write',
  'close',
  'worker',
  'constructor',
  'callback',
  'cancel-commit',
  'abort'
] as const)('direct save reports %s failure and releases the destination', async failure => {
  const {worker, constructor} = createWorkerHarness();
  const {inspection, controller, resourceIds} = await createOperation();
  const abort = vi.fn(() => {
    if (failure === 'abort') throw new Error('cleanup failed');
  });
  const close = vi.fn(() => {
    if (failure === 'close') throw new Error('close failed');
  });
  const destination = new WritableStream({
    write: () => {
      if (failure === 'write') throw new Error('write failed');
    },
    abort,
    close
  });
  if (failure === 'constructor')
    constructor.mockImplementation(function () {
      throw new Error('constructor failed');
    });
  const result = saveSelectedContentsInWorker(
    inspection,
    resourceIds,
    '3tz',
    controller.signal,
    message => {
      if (message === 'Saving archive') {
        if (failure === 'callback') throw new Error('callback failed');
        if (failure === 'cancel-commit') controller.abort(new Error('cancel-commit failed'));
      }
    },
    destination
  );
  const assertion = expect(result).rejects.toThrow(
    failure === 'abort' ? 'worker failed' : `${failure} failed`
  );
  if (failure !== 'constructor') {
    await worker.onmessage!.call(
      worker as any,
      new MessageEvent('message', {
        data: {
          type: 'chunk',
          sequence: 0,
          chunk: new Uint8Array([1, 2])
        }
      })
    );
    if (failure === 'worker' || failure === 'abort')
      await worker.onmessage!.call(
        worker as any,
        new MessageEvent('message', {data: {type: 'error', message: 'worker failed'}})
      );
    else if (failure !== 'write') await sendCompletion(worker);
  }
  await assertion;
  expect(destination.locked).toBe(false);
  if (failure !== 'close') expect(close).not.toHaveBeenCalled();
  if (failure !== 'constructor') expect(worker.terminate).toHaveBeenCalledOnce();
});

test('an already canceled direct save aborts its fresh destination without allocating a worker', async () => {
  const {constructor} = createWorkerHarness();
  const {inspection, controller, resourceIds} = await createOperation();
  const abort = vi.fn();
  const destination = new WritableStream({abort});
  controller.abort();
  await expect(
    saveSelectedContentsInWorker(
      inspection,
      resourceIds,
      '3tz',
      controller.signal,
      () => {},
      destination
    )
  ).rejects.toMatchObject({name: 'AbortError'});
  expect(constructor).not.toHaveBeenCalled();
  expect(abort).toHaveBeenCalledExactlyOnceWith(controller.signal.reason);
  expect(destination.locked).toBe(false);
});

test('direct save finishes an already started commit despite later cancellation', async () => {
  const {worker} = createWorkerHarness();
  const {inspection, controller, resourceIds} = await createOperation();
  const closeGate = createDeferred();
  const close = vi.fn(() => closeGate.promise);
  const destination = new WritableStream({close});
  const result = saveSelectedContentsInWorker(
    inspection,
    resourceIds,
    '3tz',
    controller.signal,
    () => {},
    destination
  );
  await worker.onmessage!.call(
    worker as any,
    new MessageEvent('message', {data: {type: 'chunk', sequence: 0, chunk: new Uint8Array([1, 2])}})
  );
  await sendCompletion(worker);
  await expect.poll(() => close.mock.calls.length).toBe(1);
  controller.abort(); // Native file close is already committing and cannot be rolled back.
  closeGate.resolve();
  await expect(result).resolves.toMatchObject({size: 2});
  expect(destination.locked).toBe(false);
});

test('direct save rejects completion before the pending chunk write finishes', async () => {
  const {worker} = createWorkerHarness();
  const {inspection, controller, resourceIds} = await createOperation();
  const gate = createDeferred();
  const close = vi.fn();
  const destination = new WritableStream({write: () => gate.promise, close});
  const result = saveSelectedContentsInWorker(
    inspection,
    resourceIds,
    '3tz',
    controller.signal,
    () => {},
    destination
  );
  const assertion = expect(result).rejects.toThrow('before acknowledgement');
  const pendingWrite = worker.onmessage!.call(
    worker as any,
    new MessageEvent('message', {data: {type: 'chunk', sequence: 0, chunk: new Uint8Array([1, 2])}})
  );
  await sendCompletion(worker);
  gate.resolve();
  await pendingWrite;
  await assertion;
  expect(close).not.toHaveBeenCalled();
  expect(worker.postMessage).toHaveBeenCalledOnce();
  expect(destination.locked).toBe(false);
});

/** Opens and selects the tiny inspected document for native save control checks. */
async function createSaveControls() {
  const {fetcher} = createInput();
  vi.stubGlobal('fetch', fetcher);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(React.createElement(ConversionPanel, {onPreview: vi.fn()})));
    await setInputValue(container.querySelector('input')!, 'https://example.invalid/tileset.json');
    await act(async () => {
      container
        .querySelector('form')!
        .dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
    });
    await expect
      .poll(() => readSettledControl(() => container.querySelector('#conversion-content')))
      .not.toBeNull();
    const selection = container.querySelector<HTMLSelectElement>('#conversion-content')!;
    selection.value = 'tile-0-content-1';
    await act(async () => selection.dispatchEvent(new Event('change', {bubbles: true})));
    return {
      container,
      /** Finds a button by its user-visible action. */
      button: (label: string) =>
        Array.from(container.querySelectorAll('button')).find(
          button => button.textContent === label
        ),
      /** Releases the mounted panel and its active operation. */
      dispose: async () => {
        await act(async () => root.unmount());
        container.remove();
      }
    };
  } catch (error) {
    await act(async () => root.unmount());
    container.remove();
    throw error;
  }
}

test.each([
  'slpk',
  '3tz'
] as const)('save controls choose %s before worker startup and publish only after file close', async format => {
  const {worker, constructor} = createWorkerHarness();
  const closeGate = createDeferred();
  const write = vi.fn();
  const close = vi.fn(() => closeGate.promise);
  const destination = new WritableStream<Uint8Array<ArrayBuffer>>({write, close});
  const createWritable = vi.fn(async () => destination);
  const picker = vi.fn(async () => {
    expect(constructor).not.toHaveBeenCalled();
    return {name: `custom.${format}`, createWritable};
  });
  vi.stubGlobal('showSaveFilePicker', picker);
  const controls = await createSaveControls();
  const objectUrl = vi.spyOn(URL, 'createObjectURL');
  try {
    const output = controls.container.querySelector<HTMLSelectElement>('#conversion-format')!;
    output.value = format;
    await act(async () => output.dispatchEvent(new Event('change', {bubbles: true})));
    await act(async () => controls.button('Convert and save to file')!.click());
    expect(picker).toHaveBeenCalledExactlyOnceWith({
      suggestedName: `selected-mesh.${format}`,
      types: [
        {
          accept: {
            [format === 'slpk'
              ? 'application/octet-stream'
              : 'application/vnd.maxar.archive.3tz+zip']: [`.${format}`]
          }
        }
      ]
    });
    expect(createWritable).toHaveBeenCalledOnce();
    await act(async () => {
      await worker.onmessage!.call(
        worker as any,
        new MessageEvent('message', {
          data: {type: 'chunk', sequence: 0, chunk: new Uint8Array([1, 2])}
        })
      );
      await sendCompletion(worker);
    });
    expect(close).toHaveBeenCalledOnce();
    expect(controls.button('Cancel')!.disabled).toBe(true);
    expect(controls.container.querySelector('[role="status"]')!.textContent).toBe('Saving archive');
    await act(async () => controls.button('Cancel')!.click());
    await act(async () => closeGate.resolve());
    await expect
      .poll(() =>
        readSettledControl(() => controls.container.querySelector('[role="status"]')!.textContent)
      )
      .toBe(`Saved custom.${format}: 2 bytes`);
    expect(write).toHaveBeenCalledExactlyOnceWith(new Uint8Array([1, 2]), expect.anything());
    expect(objectUrl).not.toHaveBeenCalled();
    expect(controls.container.querySelector('a')).toBeNull();
    expect(controls.button('Preview generated archive')).toBeUndefined();
    expect(destination.locked).toBe(false);
  } finally {
    closeGate.resolve();
    await controls.dispose();
  }
});

test.each([
  'dismiss',
  'create-error',
  'cancel-create',
  'unsupported'
] as const)('save controls handle %s without starting conversion or publishing output', async mode => {
  const {constructor} = createWorkerHarness();
  const gate = createDeferred();
  const abort = vi.fn();
  const destination = new WritableStream({abort});
  const createWritable = vi.fn(async () => {
    if (mode === 'create-error') throw new Error('Cannot open destination');
    await gate.promise;
    return destination;
  });
  vi.stubGlobal(
    'showSaveFilePicker',
    mode === 'unsupported'
      ? undefined
      : vi.fn(async () => {
          if (mode === 'dismiss') throw new DOMException('Dismissed', 'AbortError');
          return {name: 'custom.slpk', createWritable};
        })
  );
  const controls = await createSaveControls();
  try {
    if (mode === 'unsupported') {
      expect(controls.button('Convert and save to file')).toBeUndefined();
      expect(controls.button('Convert selected content')!.disabled).toBe(false);
    } else {
      await act(async () => controls.button('Convert and save to file')!.click());
      if (mode === 'cancel-create') {
        await act(async () => controls.button('Cancel')!.click());
        await act(async () => gate.resolve());
        await expect.poll(() => abort.mock.calls.length).toBe(1);
        expect(destination.locked).toBe(false);
      }
      expect(controls.container.querySelector('[role="status"]')!.textContent).toBe(
        mode === 'create-error' ? 'Failed' : 'Canceled'
      );
      expect(controls.container.querySelector('[role="alert"]')?.textContent ?? '').toBe(
        mode === 'create-error' ? 'Cannot open destination' : ''
      );
    }
    expect(constructor).not.toHaveBeenCalled();
    expect(controls.container.querySelector('a')).toBeNull();
  } finally {
    gate.resolve();
    await controls.dispose();
  }
});

test('download cancellation after terminal metadata discards the collected archive', async () => {
  const {worker} = createWorkerHarness();
  const {inspection, controller, resourceIds} = await createOperation();
  const result = convertSelectedContentsInWorker(
    inspection,
    resourceIds,
    '3tz',
    controller.signal,
    () => {}
  );
  const assertion = expect(result).rejects.toThrow('Canceled before publication');
  await worker.onmessage!.call(
    worker as any,
    new MessageEvent('message', {data: {type: 'chunk', sequence: 0, chunk: new Uint8Array([1, 2])}})
  );
  const completion = sendCompletion(worker);
  controller.abort(new Error('Canceled before publication'));
  await completion;
  await assertion;
  expect(worker.terminate).toHaveBeenCalledOnce();
});
