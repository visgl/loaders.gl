import {afterEach, expect, test, vi} from 'vitest';
import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import {ConversionPanel} from '../examples/website/i3s-slpk/src/components/conversion-panel';
import {convertSelectedContentsInWorker} from '../examples/website/i3s-slpk/src/conversion-worker-client';
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
    worker.onmessage!.call(
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
    worker.onmessage!.call(
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
