import {afterEach, expect, test, vi} from 'vitest';
import {createInput, setInputValue, readSettledControl} from './utils/tile-browser-conversion';
import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import {ConversionPanel} from '../examples/website/i3s-slpk/src/components/conversion-panel';
import {fetchFile, load, parse} from '@loaders.gl/core';
import {Tileset3D, traverseTilesetContents} from '@loaders.gl/tiles';
import {createArchiveSource} from '../examples/website/i3s-slpk/src/archive-source';
import {
  inspectConversionInput,
  convertSelectedContent,
  CONVERSION_LIMITS
} from '../examples/website/i3s-slpk/src/convert-tileset';

test.each([
  ['slpk', 'Y'],
  ['slpk', 'Z'],
  ['3tz', 'Y'],
  ['3tz', 'Z']
] as const)('selected browser conversion authors readable %s with %s up-axis without loading siblings', async (format, axis) => {
  const {fetcher, controller} = createInput(false, false, axis);
  const inspection = await inspectConversionInput(
    'https://example.invalid/tileset.json?token=value',
    controller.signal,
    fetcher
  );
  expect(fetcher).toHaveBeenCalledOnce();
  expect(inspection.resources).toHaveLength(3);
  const original = structuredClone(inspection.tileset);
  const messages: string[] = [];
  const result = await convertSelectedContent(
    inspection,
    inspection.resources[1].resourceId,
    format,
    controller.signal,
    message => messages.push(message),
    fetcher
  );
  expect(fetcher.mock.calls.map(call => String(call[0]))).toEqual([
    'https://example.invalid/tileset.json?token=value',
    'https://example.invalid/selected.glb?token=value'
  ]);
  expect(inspection.tileset).toEqual(original);
  expect(result.report.inputResources).toBe(1);
  expect(result.file.name).toBe(`selected-mesh.${format}`);
  expect(messages).toContain('Packaging archive');
  const source = createArchiveSource(result.file);
  source.coreApi = {fetchFile, load, parse} as any;
  const runtime = new Tileset3D(source, {
    loadOptions: {worker: false, gltf: {loadImages: false}, '3d-tiles': {loadGLTF: true}}
  });
  try {
    await runtime.tilesetInitializationPromise;
    expect(Array.from(runtime.root!.boundingVolume.center)[0]).toBeCloseTo(6378237.5, 0);
    expect(Array.from(runtime.root!.boundingVolume.center)[1]).toBeCloseTo(
      axis === 'Y' ? 5 : 5.5,
      0
    );
    expect(Array.from(runtime.root!.boundingVolume.center)[2]).toBeCloseTo(
      axis === 'Y' ? 7.5 : 7,
      0
    );
    let meshContents = 0;
    for await (const item of traverseTilesetContents(runtime)) {
      if (
        item.contents.some(
          content => content.payload?.gltf || content.payload?.attributes?.positions
        )
      )
        meshContents++;
    }
    expect(meshContents).toBe(1);
    if (format === '3tz') expect(source.getMetadata().tileset.root.lodMetricValue).toBe(4.01);
  } finally {
    runtime.destroy();
  }
});

test('conversion rejects unmapped ancestor metadata without returning an archive', async () => {
  for (const [multiple, metadata] of [[false, true]]) {
    const {fetcher, controller} = createInput(multiple, metadata);
    const inspection = await inspectConversionInput(
      'https://example.invalid/tileset.json',
      controller.signal,
      fetcher
    );
    await expect(
      convertSelectedContent(
        inspection,
        inspection.resources[1].resourceId,
        'slpk',
        controller.signal,
        () => {},
        fetcher
      )
    ).rejects.toThrow(multiple ? /exactly one mesh/ : /metadata/);
  }
});

test('conversion rejects invalid selection, URL protocol, canceled input and over-budget transport', async () => {
  const {fetcher, controller} = createInput();
  await expect(
    inspectConversionInput('file:///tileset.json', controller.signal, fetcher)
  ).rejects.toThrow(/HTTP/);
  const inspection = await inspectConversionInput(
    'https://example.invalid/tileset.json',
    controller.signal,
    fetcher
  );
  await expect(
    convertSelectedContent(inspection, 'missing', '3tz', controller.signal, () => {}, fetcher)
  ).rejects.toThrow(/Select/);
  controller.abort(new Error('User canceled'));
  await expect(
    convertSelectedContent(
      inspection,
      inspection.resources[1].resourceId,
      '3tz',
      controller.signal,
      () => {},
      fetcher
    )
  ).rejects.toThrow('User canceled');
  expect(fetcher).toHaveBeenCalledOnce();
  const exceededFetch: typeof fetch = async () =>
    new Response(new Uint8Array(CONVERSION_LIMITS.maxInputBytes + 1));
  await expect(
    convertSelectedContent(
      inspection,
      inspection.resources[1].resourceId,
      '3tz',
      new AbortController().signal,
      () => {},
      exceededFetch
    )
  ).rejects.toThrow(/aggregate input byte budget/);
});

test('cancellation during packaging discards a completed conversion result', async () => {
  const {fetcher, controller} = createInput();
  const inspection = await inspectConversionInput(
    'https://example.invalid/tileset.json',
    controller.signal,
    fetcher
  );
  await expect(
    convertSelectedContent(
      inspection,
      inspection.resources[1].resourceId,
      '3tz',
      controller.signal,
      phase => {
        if (phase === 'Packaging archive') controller.abort(new Error('Canceled packaging'));
      },
      fetcher
    )
  ).rejects.toThrow('Canceled packaging');
});

/** Restores browser globals and spies used by the focused control lifecycle checks. */
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test('conversion controls require explicit selection, preview both outputs and revoke replaced downloads', async () => {
  const {fetcher} = createInput();
  vi.stubGlobal('fetch', fetcher);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const revoke = vi.spyOn(URL, 'revokeObjectURL');
  const preview = vi.fn();
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(React.createElement(ConversionPanel, {onPreview: preview})));
    await setInputValue(container.querySelector('input')!, 'https://example.invalid/tileset.json');
    await act(async () => {
      container
        .querySelector('form')!
        .dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
    });
    await expect
      .poll(() => readSettledControl(() => container.querySelector('#conversion-content')))
      .not.toBeNull();
    expect(container.querySelector<HTMLSelectElement>('#conversion-content')!.value).toBe('');
    expect(container.querySelector('a')).toBeNull();
    for (const format of ['slpk', '3tz']) {
      const selection = container.querySelector<HTMLSelectElement>('#conversion-content')!;
      selection.value = 'tile-0-content-1';
      await act(async () => {
        selection.dispatchEvent(new Event('change', {bubbles: true}));
      });
      const output = container.querySelector<HTMLSelectElement>('#conversion-format')!;
      output.value = format;
      await act(async () => {
        output.dispatchEvent(new Event('change', {bubbles: true}));
      });
      const button = Array.from(container.querySelectorAll('button')).find(
        element => element.textContent === 'Convert selected content'
      )!;
      await act(async () => {
        button.click();
      });
      await expect
        .poll(() => readSettledControl(() => container.querySelector('a')?.download))
        .toBe(`selected-mesh.${format}`);
      const url = container.querySelector('a')!.href;
      const previewButton = Array.from(container.querySelectorAll('button')).find(
        element => element.textContent === 'Preview generated archive'
      )!;
      await act(async () => {
        previewButton.click();
      });
      expect(preview.mock.calls.at(-1)![0].name).toBe(`selected-mesh.${format}`);
      if (format === 'slpk') {
        await setInputValue(
          container.querySelector('input')!,
          'https://example.invalid/tileset.json?fresh=1'
        );
        expect(revoke).toHaveBeenCalledWith(url);
        expect(container.querySelector('a')).toBeNull();
        await act(async () => {
          container
            .querySelector('form')!
            .dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
        });
        await expect
          .poll(() => readSettledControl(() => container.querySelector('#conversion-content')))
          .not.toBeNull();
      }
    }
  } finally {
    const url = container.querySelector('a')?.href;
    await act(async () => root.unmount());
    if (url) expect(revoke).toHaveBeenCalledWith(url);
    container.remove();
  }
});

test('conversion controls ignore late inspection results after cancel and abort on unmount', async () => {
  let releaseResponse!: (response: Response) => void;
  const pending = new Promise<Response>(resolve => {
    releaseResponse = resolve;
  });
  const fetcher = vi.fn<typeof fetch>(() => pending);
  vi.stubGlobal('fetch', fetcher);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  let unmounted = false;
  try {
    await act(async () => root.render(React.createElement(ConversionPanel, {onPreview: () => {}})));
    await setInputValue(container.querySelector('input')!, 'https://example.invalid/tileset.json');
    await act(async () => {
      container
        .querySelector('form')!
        .dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
    });
    const signal = fetcher.mock.calls[0][1]!.signal!;
    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find(element => element.textContent === 'Cancel')!
        .click();
    });
    expect(signal.aborted).toBe(true);
    await act(async () => {
      releaseResponse(new Response('invalid JSON'));
      await pending;
    });
    expect(container.querySelector('[role="status"]')!.textContent).toBe('Canceled');
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.querySelector('a')).toBeNull();
    await act(async () => {
      container
        .querySelector('form')!
        .dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
      root.unmount();
    });
    unmounted = true;
    expect(fetcher.mock.calls.at(-1)![1]!.signal!.aborted).toBe(true);
  } finally {
    if (!unmounted) await act(async () => root.unmount());
    container.remove();
  }
});

test('conversion observes malformed root initialization before output setup can fail', async () => {
  const {fetcher, controller} = createInput();
  const inspection = await inspectConversionInput(
    'https://example.invalid/tileset.json',
    controller.signal,
    fetcher
  );
  // Both errors are deliberate: root normalization must be observed before validating output LOD.
  (inspection.tileset.root as any).boundingVolume = null;
  (inspection.tileset.root as any).geometricError = -1;
  await expect(
    convertSelectedContent(
      inspection,
      inspection.resources[1].resourceId,
      '3tz',
      controller.signal,
      () => {},
      fetcher
    )
  ).rejects.toThrow('boundingVolume must be defined');
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
