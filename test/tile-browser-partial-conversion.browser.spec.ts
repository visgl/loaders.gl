import {afterEach, expect, test, vi} from 'vitest';
import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import {ConversionPanel} from '../examples/website/i3s-slpk/src/components/conversion-panel';
import {fetchFile, load, parse} from '@loaders.gl/core';
import {Tileset3D, traverseTilesetContents} from '@loaders.gl/tiles';
import {createArchiveSource} from '../examples/website/i3s-slpk/src/archive-source';
import {
  inspectConversionInput,
  convertSelectedContents,
  CONVERSION_LIMITS
} from '../examples/website/i3s-slpk/src/convert-tileset';
import {createInput, setInputValue, readSettledControl} from './utils/tile-browser-conversion';

/** Restores browser globals and spies after each independent control lifecycle. */
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test.each([
  false,
  true
])('multi-selection exports selected leaves in declaration order with shared URL=%s', async sharedUrl => {
  const {fetcher, controller} = createInput(false, false, 'Y', true);
  const inspection = await inspectConversionInput(
    'https://example.invalid/tileset.json',
    controller.signal,
    fetcher
  );
  if (sharedUrl) {
    inspection.tileset.root!.children![1].content!.uri = 'selected.glb';
    Object.assign(inspection.resources[2], {uri: 'selected.glb'});
  }
  const original = structuredClone(inspection.tileset);
  const result = await convertSelectedContents(
    inspection,
    [inspection.resources[2].resourceId, inspection.resources[1].resourceId],
    '3tz',
    controller.signal,
    () => {},
    fetcher
  );
  expect(result.file.name).toBe('selected-meshes.3tz');
  expect(result.report.inputResources).toBe(2);
  expect(result.report.outputResources).toBe(2);
  expect(fetcher.mock.calls.map(call => String(call[0]))).toEqual([
    'https://example.invalid/tileset.json',
    'https://example.invalid/selected.glb',
    sharedUrl ? 'https://example.invalid/selected.glb' : 'https://example.invalid/sibling.glb'
  ]);
  expect(inspection.tileset).toEqual(original);
  const source = createArchiveSource(result.file);
  source.coreApi = {fetchFile, load, parse} as any;
  const runtime = new Tileset3D(source, {loadOptions: {worker: false, gltf: {loadImages: false}}});
  try {
    await runtime.tilesetInitializationPromise;
    expect(Array.from(runtime.root!.boundingVolume.center)).toEqual([6378237.5, 2.5, 4]);
    expect(runtime.root!.children).toHaveLength(2);
    const placements: number[][] = [];
    for await (const item of traverseTilesetContents(runtime))
      if (item.contents.some(content => content.payload?.gltf))
        placements.push(Array.from(item.tile.boundingVolume.center));
    expect(placements).toEqual([
      [6378237.5, 5, 7.5],
      [6378237.5, 0, 0.5]
    ]);
  } finally {
    runtime.destroy();
  }
});

test('multi-selection rejects unsupported selection profiles before content fetch', async () => {
  const {fetcher, controller} = createInput();
  const inspection = await inspectConversionInput(
    'https://example.invalid/tileset.json',
    controller.signal,
    fetcher
  );
  const identifiers = [inspection.resources[1].resourceId, inspection.resources[2].resourceId];
  for (const invalid of [
    [],
    ['missing'],
    [identifiers[0], identifiers[0]],
    Array(65).fill(identifiers[0])
  ])
    await expect(
      convertSelectedContents(inspection, invalid, '3tz', controller.signal, () => {}, fetcher)
    ).rejects.toThrow(/Select/);
  await expect(
    convertSelectedContents(inspection, identifiers, 'slpk', controller.signal, () => {}, fetcher)
  ).rejects.toThrow(/require 3TZ/);
  inspection.tileset.root!.children![0].children = [{content: {uri: 'child.glb'}}];
  await expect(
    convertSelectedContents(inspection, identifiers, '3tz', controller.signal, () => {}, fetcher)
  ).rejects.toThrow(/leaf/);
  expect(fetcher).toHaveBeenCalledOnce();
});

test('multi-selection discards output on a later read failure or cancellation', async () => {
  {
    const {fetcher, controller} = createInput();
    const inspection = await inspectConversionInput(
      'https://example.invalid/tileset.json',
      controller.signal,
      fetcher
    );
    await expect(
      convertSelectedContents(
        inspection,
        [inspection.resources[1].resourceId, inspection.resources[2].resourceId],
        '3tz',
        controller.signal,
        () => {},
        fetcher
      )
    ).rejects.toThrow(/Unselected resource fetched/);
  }
  const {fetcher, controller} = createInput(false, false, 'Y', true);
  const inspection = await inspectConversionInput(
    'https://example.invalid/tileset.json',
    controller.signal,
    fetcher
  );
  await expect(
    convertSelectedContents(
      inspection,
      [inspection.resources[1].resourceId, inspection.resources[2].resourceId],
      '3tz',
      controller.signal,
      phase => {
        if (phase === 'Packaging archive') controller.abort(new Error('cancel archive'));
      },
      fetcher
    )
  ).rejects.toThrow('cancel archive');
});

test('conversion controls allow explicit multi-selection only with 3TZ', async () => {
  const {fetcher} = createInput(false, false, 'Y', true);
  vi.stubGlobal('fetch', fetcher);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
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
    expect(selection.multiple).toBe(true);
    expect(selection.selectedOptions).toHaveLength(0);
    selection.options[1].selected = true;
    selection.options[2].selected = true;
    await act(async () => selection.dispatchEvent(new Event('change', {bubbles: true})));
    const convert = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent === 'Convert selected content'
    )!;
    expect(convert.disabled).toBe(true);
    const format = container.querySelector<HTMLSelectElement>('#conversion-format')!;
    expect(format.options[0].disabled).toBe(true);
    format.value = '3tz';
    await act(async () => format.dispatchEvent(new Event('change', {bubbles: true})));
    expect(convert.disabled).toBe(false);
    await act(async () => convert.click());
    await expect
      .poll(() => readSettledControl(() => container.querySelector('a')?.download))
      .toBe('selected-meshes.3tz');
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});

test('multi-selection enforces the aggregate transport budget before decoding a later response', async () => {
  const {fetcher, controller} = createInput(false, false, 'Y', true);
  const inspection = await inspectConversionInput(
    'https://example.invalid/tileset.json',
    controller.signal,
    fetcher
  );
  const limitedFetch: typeof fetch = async (input, options) => {
    if (String(input).includes('sibling.glb'))
      return new Response(new Uint8Array(CONVERSION_LIMITS.maxInputBytes));
    return fetcher(input, options);
  };
  await expect(
    convertSelectedContents(
      inspection,
      [inspection.resources[1].resourceId, inspection.resources[2].resourceId],
      '3tz',
      controller.signal,
      () => {},
      limitedFetch
    )
  ).rejects.toThrow(/remaining limit/);
});

// UI lifecycle coverage uses an inline executor; real module workers are qualified separately.
vi.mock('../examples/website/i3s-slpk/src/conversion-worker-client', async importOriginal => {
  const original =
    await importOriginal<
      typeof import('../examples/website/i3s-slpk/src/conversion-worker-client')
    >();
  const {convertSelectedContents} = await import(
    '../examples/website/i3s-slpk/src/convert-tileset'
  );
  return {
    ...original,
    convertSelectedContentsInWorker: (
      ...arguments_: Parameters<
        typeof import('../examples/website/i3s-slpk/src/conversion-worker-client').convertSelectedContentsInWorker
      >
    ) => {
      const [inspection, resourceIds, format, signal, onProgress, features] = arguments_;
      return convertSelectedContents(
        inspection,
        resourceIds,
        format,
        signal,
        onProgress,
        fetch,
        features
      );
    }
  };
});
