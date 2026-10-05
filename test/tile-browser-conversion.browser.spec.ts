import {afterEach, expect, test, vi} from 'vitest';
import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import {ConversionPanel} from '../examples/website/i3s-slpk/src/components/conversion-panel';
import {Matrix4} from '@math.gl/core';
import {GLTFScenegraph, GLTFWriter} from '@loaders.gl/gltf';
import {fetchFile, load, parse} from '@loaders.gl/core';
import {Tileset3D, traverseTilesetContents} from '@loaders.gl/tiles';
import {createArchiveSource} from '../examples/website/i3s-slpk/src/archive-source';
import {
  inspectConversionInput,
  convertSelectedContent,
  CONVERSION_LIMITS
} from '../examples/website/i3s-slpk/src/convert-tileset';

/** Generates a sub-kilobyte self-contained triangle, optionally with a second scene placement. */
function createTriangle(twoPrimitives = false): ArrayBuffer {
  const scene = new GLTFScenegraph({json: {asset: {version: '2.0'}}});
  const mesh = scene.addMesh({
    attributes: {POSITION: {value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), size: 3}},
    indices: new Uint16Array([0, 1, 2])
  });
  const nodes = [scene.addNode({meshIndex: mesh})];
  if (twoPrimitives) nodes.push(scene.addNode({meshIndex: mesh}));
  scene.setDefaultScene(scene.addScene({nodeIndices: nodes}));
  scene.createBinaryChunk();
  return GLTFWriter.encodeSync!(scene.gltf);
}

/** Supplies two content slots and a sibling under composed ECEF translations, without real network. */
function createInput(twoPrimitives = false, metadata = false, axis: 'Y' | 'Z' = 'Y') {
  const document = {
    asset: {version: '1.1', gltfUpAxis: axis},
    geometricError: 4,
    root: {
      boundingVolume: {region: [-0.001, -0.001, 0.001, 0.001, 0, 200]},
      geometricError: 4,
      transform: Array.from(new Matrix4().translate([6378237, 0, 0])),
      ...(metadata ? {metadata: {class: 'unsupported'}} : {}),
      children: [
        {
          boundingVolume: {sphere: [0, 0, 0, 1]},
          geometricError: 2,
          transform: Array.from(new Matrix4().translate([0, 5, 7])),
          contents: [{uri: 'excluded.glb'}, {uri: 'selected.glb'}]
        },
        {boundingVolume: {sphere: [0, 0, 0, 1]}, geometricError: 0, content: {uri: 'sibling.glb'}}
      ]
    }
  };
  const fetcher = vi.fn<typeof fetch>(async input => {
    const url = String(input);
    if (url.includes('tileset.json')) return new Response(JSON.stringify(document));
    if (url.includes('selected.glb')) return new Response(createTriangle(twoPrimitives));
    throw new Error(`Unselected resource fetched: ${url}`);
  });
  const controller = new AbortController();
  return {fetcher, controller};
}

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

test('conversion rejects multiple primitives and unmapped ancestor metadata without returning an archive', async () => {
  for (const [multiple, metadata] of [
    [true, false],
    [false, true]
  ]) {
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
  ).rejects.toThrow(/byte remaining limit/);
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

/** Changes a controlled browser input through its native setter and bubbling input event. */
async function setInputValue(element: HTMLInputElement, value: string): Promise<void> {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(element, value);
  await act(async () => {
    element.dispatchEvent(new Event('input', {bubbles: true}));
  });
}

/** Flushes browser I/O and React updates before polling the rendered controls. */
async function readSettledControl<ValueT>(read: () => ValueT): Promise<ValueT> {
  await act(async () => {
    await new Promise<void>(resolve => setTimeout(resolve, 10));
  });
  return read();
}

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
