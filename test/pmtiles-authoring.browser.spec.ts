// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {act as reactAct} from 'react';
import {createRoot} from 'react-dom/client';
import {afterEach, expect, test, vi} from 'vitest';
import {PMTiles, type Source} from 'pmtiles';
import {tableToIPC} from 'apache-arrow';
import {convertFeaturesToGeoArrowTable} from '@loaders.gl/arrow-geometry/feature-table';
import {GeoTIFFRasterSource} from '@loaders.gl/geotiff';
import {createTiffFixture} from '../modules/geotiff/test/lib/tiff/tiff-fixture';
import PMTilesAuthoringApp from '../examples/website/tiles/authoring-app';
import {
  createPMTilesExampleArchive,
  createPMTilesSample,
  readPMTilesExampleInput,
  selectPMTilesExampleTiles
} from '../examples/website/tiles/create-pmtiles';

afterEach(() => vi.restoreAllMocks());

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
  for (const [bounds, zoom] of [
    [[-180, -85, 180, 85], 4],
    [[10, -1, -10, 1], 1],
    [[0, -90, 1, 1], 1],
    [[0, 0, 1, 90], 1],
    [[NaN, 0, 1, 1], 1],
    [[0, 0, 1, 1], 9],
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
    await expect.poll(() => mounted.container.querySelector('a[download]')).toBeTruthy();
    const link = mounted.container.querySelector<HTMLAnchorElement>('a[download]')!;
    expect(link.download).toBe('export-mlt.pmtiles');
    const archive = await openArchive(await (await fetch(link.href)).blob());
    expect((await archive.getHeader()).tileType).toBe(6);
    const previous = link.href;
    selectValue(mounted.container, 'Zoom', '0');
    expect(revoke).toHaveBeenCalledWith(previous);
    expect(mounted.container.querySelector('a[download]')).toBeNull();
    act(() => mounted.container.querySelector('form')!.requestSubmit());
    await expect.poll(() => mounted.container.querySelector('a[download]')).toBeTruthy();
    const final = mounted.container.querySelector<HTMLAnchorElement>('a[download]')!.href;
    mounted.dispose();
    expect(revoke).toHaveBeenCalledWith(final);
  } finally {
    if (mounted.container.isConnected) mounted.dispose();
  }
});

test('file drop selects the local format and an oversized selection produces a visible error', async () => {
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
    selectValue(mounted.container, 'Zoom', '8');
    act(() => mounted.container.querySelector('form')!.requestSubmit());
    await expect
      .poll(() => mounted.container.querySelector('[role="alert"]')?.textContent)
      .toContain('smaller area');
  } finally {
    mounted.dispose();
  }
});

test('cancel and unmount stop pending URL body reads without creating stale downloads', async () => {
  const fetcher = vi.spyOn(globalThis, 'fetch');
  const cancel = vi.fn();
  fetcher.mockImplementation(async () => new Response(new ReadableStream({cancel})));
  const mounted = await mountApp();
  try {
    selectValue(mounted.container, 'Source', 'url');
    setInput(
      mounted.container.querySelector('input[type="url"]')!,
      'https://example.invalid/data.geojson'
    );
    act(() => mounted.container.querySelector('form')!.requestSubmit());
    await expect.poll(() => fetcher.mock.calls.length).toBe(1);
    act(() =>
      Array.from(mounted.container.querySelectorAll('button'))
        .find(button => button.textContent === 'Cancel')!
        .click()
    );
    await expect
      .poll(() => mounted.container.querySelector('[role="status"]')?.textContent)
      .toBe('Conversion cancelled.');
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(mounted.container.querySelector('a[download]')).toBeNull();
    act(() => mounted.container.querySelector('form')!.requestSubmit());
    await expect.poll(() => fetcher.mock.calls.length).toBe(2);
    mounted.dispose();
    await expect.poll(() => cancel.mock.calls.length).toBe(2);
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
