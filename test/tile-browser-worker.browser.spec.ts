import {afterEach, expect, test, vi} from 'vitest';
import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import {ConversionPanel} from '../examples/website/i3s-slpk/src/components/conversion-panel';
import {convertSelectedContentsInWorker} from '../examples/website/i3s-slpk/src/conversion-worker-client';
import {inspectConversionInput} from '../examples/website/i3s-slpk/src/convert-tileset';
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
  const report = {diagnostics: []};
  worker.onmessage!.call(
    worker as any,
    new MessageEvent('message', {
      data: {
        type: 'result',
        buffer: new Uint8Array([1, 2, 3]).buffer,
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
  controller.abort(new Error('cancel worker'));
  await expect(result).rejects.toThrow('cancel worker');
  receive.call(
    worker as any,
    new MessageEvent('message', {data: {type: 'progress', message: 'late'}})
  );
  receive.call(
    worker as any,
    new MessageEvent('message', {data: {type: 'result', buffer: new ArrayBuffer(0)}})
  );
  expect(progress).not.toHaveBeenCalled();
  expect(worker.terminate).toHaveBeenCalledOnce();
});

test.each([
  'error',
  'messageerror',
  'runtime',
  'send',
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
