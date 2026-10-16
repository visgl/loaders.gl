// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {act as reactAct} from 'react';
import {createRoot} from 'react-dom/client';
import {afterEach, expect, test, vi} from 'vitest';
import {PMTiles, type Source} from 'pmtiles';
import {tableToIPC} from 'apache-arrow';
import {convertFeaturesToGeoArrowTable} from '@loaders.gl/arrow-geometry/feature-table';
import {GeoTIFFRasterSource} from '@loaders.gl/raster/geotiff/index';
import {createTiffFixture} from '../modules/raster/test/geotiff/lib/tiff/tiff-fixture';
import PMTilesAuthoringApp from '../examples/website/tiles/authoring-app';
import {createPMTilesArchiveInWorker} from '../examples/website/tiles/pmtiles-worker-client';
import {
  PMTILES_EXAMPLE_LIMITS,
  type PMTilesExampleProgress,
  createPMTilesExampleArchive,
  createPMTilesSample,
  readPMTilesExampleInput,
  selectPMTilesExampleTiles
} from '../examples/website/tiles/create-pmtiles';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** Flushes synchronous UI events; asynchronous work retains normal browser scheduling. */
function act(action: () => void): void {
  const scope = globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT?: boolean};
  const previous = scope.IS_REACT_ACT_ENVIRONMENT;
  scope.IS_REACT_ACT_ENVIRONMENT = true;
  try {
    void reactAct(action);
  } finally {
    scope.IS_REACT_ACT_ENVIRONMENT = previous;
  }
}

/** Independent local PMTiles reader. */
async function openArchive(blob: Blob) {
  const data = await blob.arrayBuffer();
  const source: Source = {
    getKey: () => 'authoring-example',
    getBytes: async (offset, length) => ({data: data.slice(offset, offset + length)})
  };
  return new PMTiles(source);
}

const OPTIONS = {
  format: 'geojson' as const,
  tileType: 'mvt' as const,
  bounds: [-180, -85, 180, 85],
  zoom: 1
};

/** Native browser mount with deterministic cleanup. */
async function mountApp() {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  act(() => root.render(React.createElement(PMTilesAuthoringApp)));
  return {
    container,
    dispose: () => {
      act(() => root.unmount());
      container.remove();
    }
  };
}

/** Changes a controlled select through its actual DOM event. */
function selectValue(container: HTMLElement, label: string, value: string): void {
  const select = Array.from(container.querySelectorAll('label'))
    .find(element => element.textContent?.startsWith(label))!
    .querySelector('select')!;
  act(() => {
    select.value = value;
    select.dispatchEvent(new Event('change', {bubbles: true}));
  });
}

/** Changes controlled text through the native setter so React observes the input event. */
function setInput(input: HTMLInputElement, value: string): void {
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
    input.dispatchEvent(new Event('input', {bubbles: true}));
  });
}

test('tile selection respects exact boundaries and rejects expensive or invalid selections before allocation', () => {
  expect(selectPMTilesExampleTiles([-180, 0, 0, 85], 1)).toEqual([{z: 1, x: 0, y: 0}]);
  expect(selectPMTilesExampleTiles([-180, -85, 180, 85], 0)).toEqual([{z: 0, x: 0, y: 0}]);
  expect(selectPMTilesExampleTiles([-180, -85, 180, 85], 3)).toHaveLength(64);
  expect(selectPMTilesExampleTiles([-180, -85, 180, 85], 4)).toHaveLength(256);
  expect(selectPMTilesExampleTiles([0, 0, 0.000001, 0.000001], 24)).toHaveLength(1);
  for (const [bounds, zoom] of [
    [[-180, -85, 180, 85], 9],
    [[10, -1, -10, 1], 1],
    [[0, -90, 1, 1], 1],
    [[0, 0, 1, 90], 1],
    [[NaN, 0, 1, 1], 1],
    [[0, 0, 1, 1], 25],
    [[0, 0, 1, 1], 0.5]
  ] as const)
    expect(() => selectPMTilesExampleTiles(bounds, zoom)).toThrow();
});

test.each([
  'mvt',
  'mlt'
] as const)('offline GeoJSON sample produces %s payloads through the public authoring APIs', async tileType => {
  const archive = await openArchive(
    await createPMTilesExampleArchive(
      createPMTilesSample(),
      {...OPTIONS, tileType},
      new AbortController().signal
    )
  );
  expect(await archive.getHeader()).toMatchObject({
    tileType: tileType === 'mvt' ? 1 : 6,
    numAddressedTiles: 2
  });
  expect((await archive.getZxy(1, 0, 0))?.data.byteLength).toBeGreaterThan(0);
});

test.each([
  'mvt',
  'mlt'
] as const)('GeoArrow IPC %s selects scalar attributes and preserves feature IDs', async tileType => {
  const table = convertFeaturesToGeoArrowTable([
    {
      type: 'Feature',
      geometry: {type: 'Point', coordinates: [-90, 40]},
      properties: {id: 7, name: 'sample', nested: {value: 1}}
    }
  ]);
  const blob = new Blob([tableToIPC(table.data).slice().buffer]);
  const archive = await openArchive(
    await createPMTilesExampleArchive(
      blob,
      {...OPTIONS, tileType, format: 'arrow', attributes: ['name'], idColumn: 'id'},
      new AbortController().signal
    )
  );
  expect(await archive.getMetadata()).toEqual({
    vector_layers: [{id: 'features', fields: {name: 'String'}}]
  });
  const {parse} = await import('@loaders.gl/core');
  const loader =
    tileType === 'mvt'
      ? (await import('@loaders.gl/mvt')).MVTLoader
      : (await import('@loaders.gl/mlt')).MLTLoader;
  const tile = await archive.getZxy(1, 0, 0);
  const decoded = await parse(tile!.data, loader, {
    core: {worker: false},
    mvt: {shape: 'geojson-table'},
    mlt: {shape: 'geojson-table'}
  });
  expect(decoded).toMatchObject({features: [{id: 7}]});
});

test('local GeoTIFF exports PNG and finalizes its owned source on success and failure', async () => {
  const latitude = 85.0511287798066;
  const fixture = createTiffFixture({
    width: 2,
    height: 2,
    bits: [8],
    values: [[1, 2, 3, 4]],
    tags: [
      {tag: 33550, type: 12, values: [180, latitude, 0]},
      {tag: 33922, type: 12, values: [0, 0, 0, -180, latitude, 0]},
      {tag: 34735, type: 3, values: [1, 1, 0, 3, 1024, 0, 1, 2, 1025, 0, 1, 1, 2048, 0, 1, 4326]}
    ]
  });
  const finalize = vi.spyOn(GeoTIFFRasterSource.prototype, 'finalize');
  const input = new Blob([fixture.data]);
  const options = {...OPTIONS, format: 'geotiff' as const, tileType: 'png' as const, zoom: 0};
  const archive = await openArchive(
    await createPMTilesExampleArchive(input, options, new AbortController().signal)
  );
  expect((await archive.getHeader()).tileType).toBe(2);
  expect(new Uint8Array((await archive.getZxy(0, 0, 0))!.data).slice(0, 4)).toEqual(
    new Uint8Array([137, 80, 78, 71])
  );
  expect(finalize).toHaveBeenCalledTimes(1);
  await expect(
    createPMTilesExampleArchive(input, {...options, bands: [5]}, new AbortController().signal)
  ).rejects.toThrow();
  expect(finalize).toHaveBeenCalledTimes(2);
});

test('remote reads enforce declared and actual byte budgets and cancel oversized streams', async () => {
  const fetcher = vi.spyOn(globalThis, 'fetch');
  const cancel = vi.fn();
  fetcher.mockResolvedValueOnce(
    new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.enqueue(new Uint8Array([4, 5, 6]));
        },
        cancel
      }),
      {status: 200}
    )
  );
  await expect(
    readPMTilesExampleInput('https://example.invalid/data', new AbortController().signal, 4)
  ).rejects.toThrow('Input exceeds');
  expect(cancel).toHaveBeenCalled();
  fetcher.mockResolvedValueOnce(new Response('small', {headers: {'content-length': '99'}}));
  await expect(
    readPMTilesExampleInput('https://example.invalid/data', new AbortController().signal, 4)
  ).rejects.toThrow('Input exceeds');
  fetcher.mockResolvedValueOnce(new Response('abcd'));
  expect(
    new TextDecoder().decode(
      await readPMTilesExampleInput('https://example.invalid/data', new AbortController().signal, 4)
    )
  ).toBe('abcd');
});

test('local size, unsupported URLs, HTTP failures and aborts are explicit', async () => {
  await expect(
    readPMTilesExampleInput(new Blob(['large']), new AbortController().signal, 4)
  ).rejects.toThrow('Input exceeds');
  for (const url of ['file:///input', 'https://user:password@example.invalid/data'])
    await expect(readPMTilesExampleInput(url, new AbortController().signal)).rejects.toThrow(
      'HTTP(S)'
    );
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('missing', {status: 404}));
  await expect(
    readPMTilesExampleInput('https://example.invalid/data', new AbortController().signal)
  ).rejects.toThrow('404');
  const controller = new AbortController();
  controller.abort();
  await expect(
    createPMTilesExampleArchive(createPMTilesSample(), OPTIONS, controller.signal)
  ).rejects.toThrow();
  await expect(
    createPMTilesExampleArchive(
      createPMTilesSample(),
      {...OPTIONS, tileType: 'png'},
      new AbortController().signal
    )
  ).rejects.toThrow('MVT/MLT');
});

test('the form generates real MLT downloads and revokes them when settings change and on unmount', async () => {
  const revoke = vi.spyOn(URL, 'revokeObjectURL');
  const mounted = await mountApp();
  try {
    selectValue(mounted.container, 'Tile format', 'mlt');
    act(() => mounted.container.querySelector('form')!.requestSubmit());
    await expect
      .poll(() => mounted.container.querySelector('a[download]'), {timeout: 15000})
      .toBeTruthy();
    const link = mounted.container.querySelector<HTMLAnchorElement>('a[download]')!;
    expect(link.download).toBe('export-mlt.pmtiles');
    const archive = await openArchive(await (await fetch(link.href)).blob());
    expect((await archive.getHeader()).tileType).toBe(6);
    const previous = link.href;
    selectValue(mounted.container, 'Zoom', '0');
    expect(revoke).toHaveBeenCalledWith(previous);
    expect(mounted.container.querySelector('a[download]')).toBeNull();
    act(() => mounted.container.querySelector('form')!.requestSubmit());
    await expect
      .poll(() => mounted.container.querySelector('a[download]'), {timeout: 15000})
      .toBeTruthy();
    const final = mounted.container.querySelector<HTMLAnchorElement>('a[download]')!.href;
    mounted.dispose();
    expect(revoke).toHaveBeenCalledWith(final);
  } finally {
    if (mounted.container.isConnected) mounted.dispose();
  }
});

test('file drop and picker preserve selection status and reject an oversized tile selection', async () => {
  const mounted = await mountApp();
  try {
    const transfer = new DataTransfer();
    transfer.items.add(new File(['not an IPC file'], 'input.arrow'));
    act(() =>
      mounted.container
        .querySelector('section')!
        .dispatchEvent(
          new DragEvent('drop', {bubbles: true, cancelable: true, dataTransfer: transfer})
        )
    );
    expect(mounted.container.textContent).toContain('input.arrow');
    expect(mounted.container.querySelector('input[type="file"]')).toBeTruthy();
    const inputFormat = Array.from(mounted.container.querySelectorAll('select')).find(select =>
      Array.from(select.options).some(option => option.value === 'arrow')
    )!;
    expect(inputFormat.value).toBe('arrow');
    expect(mounted.container.querySelector('[role="status"]')?.textContent).toBe(
      'Selected input.arrow.'
    );
    const pickerTransfer = new DataTransfer();
    pickerTransfer.items.add(new File(['{}'], 'picked.geojson'));
    const picker = mounted.container.querySelector<HTMLInputElement>('input[type="file"]')!;
    act(() => {
      picker.files = pickerTransfer.files;
      picker.dispatchEvent(new Event('change', {bubbles: true}));
    });
    expect(mounted.container.querySelector('[role="status"]')?.textContent).toBe(
      'Selected picked.geojson.'
    );
    expect(inputFormat.value).toBe('geojson');
    selectValue(mounted.container, 'Zoom', '9');
    act(() => mounted.container.querySelector('form')!.requestSubmit());
    await expect
      .poll(() => mounted.container.querySelector('[role="alert"]')?.textContent)
      .toContain('smaller area');
  } finally {
    mounted.dispose();
  }
});

test('cancel and unmount terminate pending workers, discard late output and permit retry', async () => {
  const worker = createWorkerHarness();
  const mounted = await mountApp();
  try {
    selectValue(mounted.container, 'Source', 'url');
    setInput(
      mounted.container.querySelector('input[type="url"]')!,
      'https://example.invalid/data.geojson'
    );
    act(() => mounted.container.querySelector('form')!.requestSubmit());
    expect(worker.postMessage).toHaveBeenCalledExactlyOnceWith({
      input: 'https://example.invalid/data.geojson',
      options: expect.objectContaining(OPTIONS)
    });
    const receive = worker.onmessage!;
    // A page task runs while conversion is pending; Cancel does not need a worker acknowledgement.
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    act(() =>
      Array.from(mounted.container.querySelectorAll('button'))
        .find(button => button.textContent === 'Cancel')!
        .click()
    );
    await expect
      .poll(() => mounted.container.querySelector('[role="status"]')?.textContent)
      .toBe('Conversion cancelled.');
    expect(worker.terminate).toHaveBeenCalledOnce();
    receive(new MessageEvent('message', {data: {type: 'result', archive: new Blob(['late'])}}));
    expect(mounted.container.querySelector('a[download]')).toBeNull();
    act(() => mounted.container.querySelector('form')!.requestSubmit());
    expect(worker.constructor).toHaveBeenCalledTimes(2);
    mounted.dispose();
    expect(worker.terminate).toHaveBeenCalledTimes(2);
  } finally {
    if (mounted.container.isConnected) mounted.dispose();
  }
});

test('HTTP(S) GeoJSON source bytes feed the same archive pipeline', async () => {
  const fetcher = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(await createPMTilesSample().arrayBuffer()));
  const archive = await openArchive(
    await createPMTilesExampleArchive(
      'https://example.invalid/data?format=geojson',
      OPTIONS,
      new AbortController().signal
    )
  );
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect((await archive.getHeader()).numAddressedTiles).toBe(2);
});

test('the authoring form fits a laptop panel and stacks without overflow on mobile', async () => {
  const mounted = await mountApp();
  try {
    mounted.container.style.width = '900px';
    const app = mounted.container.querySelector('section')!;
    const form = mounted.container.querySelector('form')!;
    expect(getComputedStyle(form).gridTemplateColumns.split(' ')).toHaveLength(3);
    expect(app.getBoundingClientRect().height).toBeLessThanOrEqual(550);
    mounted.container.style.width = '360px';
    expect(getComputedStyle(form).gridTemplateColumns.split(' ')).toHaveLength(1);
    expect(app.scrollWidth).toBeLessThanOrEqual(360);
  } finally {
    mounted.dispose();
  }
});

/** Installs only the worker transport boundary; format behavior is covered by real workers below. */
function createWorkerHarness() {
  const worker = {
    onmessage: null as ((event: MessageEvent) => void) | null,
    onerror: null as ((event: ErrorEvent) => void) | null,
    onmessageerror: null as (() => void) | null,
    postMessage: vi.fn(),
    terminate: vi.fn(),
    constructor: vi.fn()
  };
  worker.constructor.mockImplementation(function () {
    return worker;
  });
  vi.stubGlobal('Worker', worker.constructor);
  return worker;
}

test('worker client sends cloneable inputs and cleans up after a bounded result', async () => {
  const worker = createWorkerHarness();
  const controller = new AbortController();
  const input = createPMTilesSample();
  const pending = createPMTilesArchiveInWorker(input, OPTIONS, controller.signal);
  expect(worker.constructor).toHaveBeenCalledWith(expect.any(URL), {type: 'module'});
  expect(structuredClone(worker.postMessage.mock.calls[0][0])).toEqual({input, options: OPTIONS});
  const archive = new Blob(['archive'], {type: 'application/vnd.pmtiles'});
  worker.onmessage!(new MessageEvent('message', {data: {type: 'result', archive}}));
  expect(await pending).toBe(archive);
  expect(worker.terminate).toHaveBeenCalledOnce();
  expect(worker.onmessage).toBeNull();
  expect(worker.onerror).toBeNull();
  expect(worker.onmessageerror).toBeNull();
  controller.abort();
  expect(worker.terminate).toHaveBeenCalledOnce();
});

test.each([
  'error',
  'crash',
  'messageerror',
  'post',
  'invalid',
  'oversized'
] as const)('worker client rejects %s and releases computation', async failure => {
  const worker = createWorkerHarness();
  if (failure === 'post')
    worker.postMessage.mockImplementation(() => {
      throw new Error('post failed');
    });
  const pending = createPMTilesArchiveInWorker(
    createPMTilesSample(),
    OPTIONS,
    new AbortController().signal
  );
  const rejected = expect(pending).rejects.toThrow();
  if (failure === 'error')
    worker.onmessage!(
      new MessageEvent('message', {data: {type: 'error', message: 'parse failed'}})
    );
  else if (failure === 'crash')
    worker.onerror!(new ErrorEvent('error', {message: 'crashed', cancelable: true}));
  else if (failure === 'messageerror') worker.onmessageerror!();
  else if (failure !== 'post')
    worker.onmessage!(
      new MessageEvent('message', {
        data: {
          type: 'result',
          archive:
            failure === 'oversized'
              ? Object.defineProperty(new Blob(['x'], {type: 'application/vnd.pmtiles'}), 'size', {
                  value: 2 ** 32
                })
              : null
        }
      })
    );
  await rejected;
  expect(worker.terminate).toHaveBeenCalledOnce();
  expect(worker.onmessage).toBeNull();
});

test('pre-aborted input allocates no worker and startup failures reject', async () => {
  const worker = createWorkerHarness();
  const controller = new AbortController();
  controller.abort();
  await expect(
    createPMTilesArchiveInWorker(createPMTilesSample(), OPTIONS, controller.signal)
  ).rejects.toThrow();
  expect(worker.constructor).not.toHaveBeenCalled();
  worker.constructor.mockImplementation(() => {
    throw new Error('startup failed');
  });
  await expect(
    createPMTilesArchiveInWorker(createPMTilesSample(), OPTIONS, new AbortController().signal)
  ).rejects.toThrow('startup failed');
});

test('real worker converts GeoArrow IPC into MVT and serializes conversion failures', async () => {
  const table = convertFeaturesToGeoArrowTable([
    {
      type: 'Feature',
      geometry: {type: 'Point', coordinates: [-90, 40]},
      properties: {name: 'worker'}
    }
  ]);
  const archive = await openArchive(
    await createPMTilesArchiveInWorker(
      new Blob([tableToIPC(table.data).slice().buffer]),
      {...OPTIONS, format: 'arrow'},
      new AbortController().signal
    )
  );
  expect(await archive.getHeader()).toMatchObject({tileType: 1, numAddressedTiles: 1});
  expect(await archive.getMetadata()).toMatchObject({vector_layers: [{fields: {name: 'String'}}]});
  await expect(
    createPMTilesArchiveInWorker(new Blob(['invalid JSON']), OPTIONS, new AbortController().signal)
  ).rejects.toThrow();
});

test('real worker encodes GeoTIFF PNG with its worker canvas', async () => {
  const latitude = 85.0511287798066;
  const fixture = createTiffFixture({
    width: 2,
    height: 2,
    bits: [8],
    values: [[1, 2, 3, 4]],
    tags: [
      {tag: 33550, type: 12, values: [180, latitude, 0]},
      {tag: 33922, type: 12, values: [0, 0, 0, -180, latitude, 0]},
      {tag: 34735, type: 3, values: [1, 1, 0, 3, 1024, 0, 1, 2, 1025, 0, 1, 1, 2048, 0, 1, 4326]}
    ]
  });
  const archive = await openArchive(
    await createPMTilesArchiveInWorker(
      new Blob([fixture.data]),
      {...OPTIONS, format: 'geotiff', tileType: 'png', zoom: 0},
      new AbortController().signal
    )
  );
  expect((await archive.getHeader()).tileType).toBe(2);
  expect(new Uint8Array((await archive.getZxy(0, 0, 0))!.data).slice(0, 4)).toEqual(
    new Uint8Array([137, 80, 78, 71])
  );
});

test('real worker fetches a same-origin HTTP dataset without page transport', async () => {
  const fetcher = vi.spyOn(globalThis, 'fetch');
  const url = new URL(
    '/__loaders_gl_test_fixtures__/test/data/pmtiles-authoring.geojson',
    window.location.href
  ).href;
  const archive = await openArchive(
    await createPMTilesArchiveInWorker(url, OPTIONS, new AbortController().signal)
  );
  expect(fetcher).not.toHaveBeenCalled();
  expect(await archive.getHeader()).toMatchObject({tileType: 1, numAddressedTiles: 1});
});

test('export byte ceilings allow up to four GiB without allocating large fixtures', async () => {
  expect(PMTILES_EXAMPLE_LIMITS.inputBytes).toBe(2 ** 32 - 1);
  expect(PMTILES_EXAMPLE_LIMITS.outputBytes).toBe(2 ** 32 - 1);
  const sparse = Object.defineProperty(new Blob(['small']), 'size', {value: 1024 ** 3});
  expect((await readPMTilesExampleInput(sparse, new AbortController().signal)).byteLength).toBe(5);
  const input = Object.defineProperty(new Blob(['x']), 'size', {value: 2 ** 32});
  await expect(readPMTilesExampleInput(input, new AbortController().signal)).rejects.toThrow(
    'Input exceeds'
  );
});

test('Finish packages completed addresses with accurate progress and bounds', async () => {
  const updates: PMTilesExampleProgress[] = [];
  let finishRequested = false;
  const archive = await openArchive(
    await createPMTilesExampleArchive(
      createPMTilesSample(),
      OPTIONS,
      new AbortController().signal,
      {
        onProgress(progress) {
          updates.push(progress);
          if (progress.completedTiles === 1) finishRequested = true;
        },
        shouldFinish: () => finishRequested
      }
    )
  );
  expect(updates.map(progress => progress.phase)).toEqual(
    expect.arrayContaining(['reading', 'parsing', 'tiles', 'packaging', 'complete'])
  );
  expect(updates.at(-1)).toMatchObject({phase: 'complete', completedTiles: 1, totalTiles: 4});
  expect(updates.at(-1)!.bytesRead).toBe(createPMTilesSample().size);
  expect(updates.at(-1)!.outputBytes).toBeGreaterThan(0);
  expect(await archive.getHeader()).toMatchObject({numAddressedTiles: 1, minLon: -180, maxLon: 0});
  expect(await archive.getZxy(1, 1, 1)).toBeUndefined();
});

test('progress updates keep the worker alive and Finish emits a cloneable control message', async () => {
  const worker = createWorkerHarness();
  const finishController = new AbortController();
  const onProgress = vi.fn();
  const pending = createPMTilesArchiveInWorker(
    createPMTilesSample(),
    OPTIONS,
    new AbortController().signal,
    {finishSignal: finishController.signal, onProgress}
  );
  const progress = {
    phase: 'tiles',
    completedTiles: 1,
    totalTiles: 4,
    bytesRead: 123,
    outputBytes: 0,
    currentTile: '1/0/0'
  };
  worker.onmessage!(new MessageEvent('message', {data: {type: 'progress', progress}}));
  expect(onProgress).toHaveBeenCalledWith(progress);
  expect(worker.terminate).not.toHaveBeenCalled();
  finishController.abort();
  expect(worker.postMessage).toHaveBeenLastCalledWith({type: 'finish'});
  const archive = new Blob(['archive'], {type: 'application/vnd.pmtiles'});
  worker.onmessage!(new MessageEvent('message', {data: {type: 'result', archive}}));
  expect(await pending).toBe(archive);
  expect(worker.terminate).toHaveBeenCalledOnce();
});

test('the form displays measured progress and Finish preserves work while Cancel stays available', async () => {
  const worker = createWorkerHarness();
  const mounted = await mountApp();
  try {
    act(() => mounted.container.querySelector('form')!.requestSubmit());
    const progress = {
      phase: 'tiles',
      completedTiles: 1,
      totalTiles: 4,
      bytesRead: 2048,
      outputBytes: 0,
      currentTile: '1/0/0'
    };
    act(() => worker.onmessage!(new MessageEvent('message', {data: {type: 'progress', progress}})));
    expect(
      mounted.container.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')
    ).toBe('1');
    expect(mounted.container.textContent).toContain('2.0 KiB');
    expect(mounted.container.textContent).toContain('1/0/0');
    const finishButton = Array.from(mounted.container.querySelectorAll('button')).find(
      button => button.textContent === 'Finish & download'
    )!;
    act(() => finishButton.click());
    expect(worker.postMessage).toHaveBeenLastCalledWith({type: 'finish'});
    expect(worker.terminate).not.toHaveBeenCalled();
    expect(mounted.container.textContent).toContain('Completing in-flight work');
    expect(
      Array.from(mounted.container.querySelectorAll('button')).some(
        button => button.textContent === 'Cancel' && !button.disabled
      )
    ).toBe(true);
    const archive = new Blob(['partial'], {type: 'application/vnd.pmtiles'});
    act(() => worker.onmessage!(new MessageEvent('message', {data: {type: 'result', archive}})));
    await expect
      .poll(() => mounted.container.querySelector('[role="status"]')?.textContent)
      .toContain('Partial archive ready');
    expect(mounted.container.querySelector('a[download]')).not.toBeNull();
  } finally {
    mounted.dispose();
  }
});

test('a real worker receives Finish between tile boundaries and emits a readable partial archive', async () => {
  const finishController = new AbortController();
  const updates: PMTilesExampleProgress[] = [];
  const input = new Blob([
    JSON.stringify({
      type: 'FeatureCollection',
      features: [
        {type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: [-179.5, 85]}}
      ]
    })
  ]);
  const archive = await openArchive(
    await createPMTilesArchiveInWorker(input, {...OPTIONS, zoom: 8}, new AbortController().signal, {
      finishSignal: finishController.signal,
      onProgress(progress) {
        updates.push(progress);
        if (progress.completedTiles > 0) finishController.abort();
      }
    })
  );
  expect(updates.at(-1)).toMatchObject({phase: 'complete', totalTiles: 65536});
  expect(updates.at(-1)!.completedTiles).toBeGreaterThan(0);
  expect(updates.at(-1)!.completedTiles).toBeLessThan(65536);
  expect(await archive.getHeader()).toMatchObject({numAddressedTiles: 1});
  expect((await archive.getZxy(8, 0, 0))?.data.byteLength).toBeGreaterThan(0);
});

test('malformed progress and Finish transport failures reject and terminate the worker', async () => {
  for (const failure of ['progress', 'finish']) {
    const worker = createWorkerHarness();
    const finishController = new AbortController();
    const pending = createPMTilesArchiveInWorker(
      createPMTilesSample(),
      OPTIONS,
      new AbortController().signal,
      {finishSignal: finishController.signal}
    );
    const rejected = expect(pending).rejects.toThrow();
    if (failure === 'progress')
      worker.onmessage!(
        new MessageEvent('message', {
          data: {type: 'progress', progress: {phase: 'tiles', totalTiles: 4, completedTiles: 5}}
        })
      );
    else {
      worker.postMessage.mockImplementation(() => {
        throw new Error('Finish failed');
      });
      finishController.abort();
    }
    await rejected;
    expect(worker.terminate).toHaveBeenCalledOnce();
  }
});
