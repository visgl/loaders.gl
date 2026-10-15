import {beforeAll, expect, test, vi} from 'vitest';
import {parse} from '@loaders.gl/core';
import {GLBLoader} from '@loaders.gl/gltf';
import {BlobFile} from '@loaders.gl/loader-utils';
import {Tiles3DArchive} from '@loaders.gl/3d-tiles';
import {parseSLPKArchive, I3SAttributeLoader} from '@loaders.gl/i3s';
import {
  inspectI3SConversionInput,
  convertSelectedI3SContents
} from '../examples/website/i3s-slpk/src/i3s-conversion-input';
import {
  createI3SConversionFixture,
  createI3SFixtureFetcher
} from './utils/tile-browser-i3s-conversion';

let fixture: Awaited<ReturnType<typeof createI3SConversionFixture>>;
beforeAll(async () => {
  fixture = await createI3SConversionFixture();
});

test('I3S inspection reads only bounded metadata and preserves inherited query parameters', async () => {
  const fetcher = createI3SFixtureFetcher(fixture.resources);
  const inspection = await inspectI3SConversionInput(
    'https://example.invalid/layers/0?token=secret&f=json',
    new AbortController().signal,
    fetcher
  );
  expect(inspection.resources.map(resource => resource.resourceId)).toEqual(['1']);
  expect(
    fetcher.mock.calls.every(
      call => !String(call[0]).includes('/geometries/') && !String(call[0]).includes('/attributes/')
    )
  ).toBe(true);
  expect(
    fetcher.mock.calls
      .slice(1)
      .every(call => new URL(String(call[0])).searchParams.get('token') === 'secret')
  ).toBe(true);
  expect(structuredClone(inspection)).toEqual(inspection);
});

test.each([
  'url',
  'slpk'
] as const)('selected %s I3S input produces readable 3TZ and SLPK without mutating inspection', async profile => {
  const fetcher = createI3SFixtureFetcher(fixture.resources);
  const inspection = await inspectI3SConversionInput(
    profile === 'url' ? 'https://example.invalid/layers/0' : fixture.file,
    new AbortController().signal,
    fetcher
  );
  const snapshot = structuredClone(inspection);
  for (const format of ['3tz', 'slpk'] as const) {
    const output = await convertSelectedI3SContents(
      inspection,
      ['1'],
      format,
      new AbortController().signal,
      () => {},
      fetcher,
      fixture.features,
      2
    );
    expect(output.report.inputResources).toBe(1);
    expect(output.file.name).toBe(`selected-mesh.${format}`);
    const file = new BlobFile(output.file);
    try {
      if (format === '3tz') {
        const archive = new Tiles3DArchive(file);
        const document = JSON.parse(
          new TextDecoder().decode(await archive.getFile('tileset.json'))
        );
        expect(document.root.geometricError).toBe(2.01);
        expect(document.root.children).toHaveLength(1);
        const glb = await parse(
          await archive.getFile(document.root.children[0].content.uri),
          GLBLoader
        );
        expect(glb.json.images[0].mimeType).toBe('image/png');
        expect(glb.json.extensionsRequired).toContain('KHR_draco_mesh_compression');
        expect(glb.json.extensions.EXT_structural_metadata.propertyTables[0].count).toBe(1);
      } else {
        const archive = await parseSLPKArchive(file);
        const layer = JSON.parse(new TextDecoder().decode(await archive.getFile('', 'http')));
        const index = layer.attributeStorageInfo.findIndex(attribute => attribute.name === 'label');
        const loader = await I3SAttributeLoader.preload();
        const values = await loader.parse(
          await archive.getFile(`nodes/1/attributes/f_${index}/0`, 'http'),
          {attributeName: 'label', attributeType: 'String', i3s: {attributeValues: 'exact'}}
        );
        expect(values.label).toEqual(['東京']);
      }
    } finally {
      await file.close();
    }
  }
  expect(inspection).toEqual(snapshot);
});

test('I3S conversion requires explicit feature mapping and metric error before emitting output', async () => {
  const fetcher = createI3SFixtureFetcher(fixture.resources);
  const inspection = await inspectI3SConversionInput(
    fixture.file,
    new AbortController().signal,
    fetcher
  );
  await expect(
    convertSelectedI3SContents(
      inspection,
      ['1'],
      '3tz',
      new AbortController().signal,
      () => {},
      fetcher,
      fixture.features
    )
  ).rejects.toThrow(/geometric error/);
  await expect(
    convertSelectedI3SContents(
      inspection,
      ['1'],
      'slpk',
      new AbortController().signal,
      () => {},
      fetcher
    )
  ).rejects.toMatchObject({code: 'I3S_MESH_SOURCE_FEATURE_MAPPING_REQUIRED'});
  await expect(
    convertSelectedI3SContents(
      inspection,
      ['missing'],
      'slpk',
      new AbortController().signal,
      () => {},
      fetcher,
      fixture.features
    )
  ).rejects.toThrow(/Select/);
});

test('unsupported layer, oversized local file and canceled inspection fail before conversion', async () => {
  const controller = new AbortController();
  controller.abort(new Error('Canceled inspection'));
  await expect(inspectI3SConversionInput(fixture.file, controller.signal)).rejects.toThrow(
    'Canceled inspection'
  );
  const oversized = new File([], 'large.slpk');
  Object.defineProperty(oversized, 'size', {value: 16 * 1024 * 1024 + 1});
  await expect(inspectI3SConversionInput(oversized, new AbortController().signal)).rejects.toThrow(
    /at most 16 MiB/
  );
  const fetcher = vi.fn<typeof fetch>(
    async () => new Response(JSON.stringify({layerType: 'PointCloud'}))
  );
  await expect(
    inspectI3SConversionInput(
      'https://example.invalid/layers/0',
      new AbortController().signal,
      fetcher
    )
  ).rejects.toThrow(/3DObject/);
  expect(fetcher).toHaveBeenCalledOnce();
});

test('legacy I3S header inspection/conversion uses the same selected source adapter', async () => {
  const resources = {...fixture.resources};
  const layer = JSON.parse(new TextDecoder().decode(resources['3dSceneLayer.json']));
  delete layer.nodePages;
  const leaf = JSON.parse(new TextDecoder().decode(resources['nodes/1/3dNodeIndexDocument.json']));
  delete leaf.textureData;
  resources['nodes/1/3dNodeIndexDocument.json'] = new TextEncoder().encode(
    JSON.stringify(leaf)
  ).buffer;
  resources['3dSceneLayer.json'] = new TextEncoder().encode(JSON.stringify(layer)).buffer;
  const fetcher = createI3SFixtureFetcher(resources);
  const inspection = await inspectI3SConversionInput(
    'https://example.invalid/layers/0?token=value',
    new AbortController().signal,
    fetcher
  );
  expect(inspection.resources.map(resource => resource.resourceId)).toEqual(['1']);
  const output = await convertSelectedI3SContents(
    inspection,
    ['1'],
    '3tz',
    new AbortController().signal,
    () => {},
    fetcher,
    fixture.features,
    2
  );
  expect(output.report.inputResources).toBe(1);
});

test('inspection rejects repeated nodes and metadata count/byte overflow without loading meshes', async () => {
  for (const variant of ['duplicate', 'count', 'bytes']) {
    const resources = {...fixture.resources};
    const pages = JSON.parse(new TextDecoder().decode(resources['nodepages/0.json']));
    if (variant === 'duplicate') pages.nodes[0].children = [1, 1];
    if (variant === 'count') pages.nodes[1].children = Array.from({length: 1001}, () => 1);
    resources['nodepages/0.json'] = new TextEncoder().encode(JSON.stringify(pages)).buffer;
    const sourceFetcher = createI3SFixtureFetcher(resources);
    const fetcher: typeof fetch =
      variant === 'bytes'
        ? async () =>
            new Response(
              new ReadableStream({
                start(controller) {
                  const chunk = new Uint8Array(1024);
                  for (let index = 0; index < 16385; index++) controller.enqueue(chunk);
                  controller.close();
                }
              })
            )
        : sourceFetcher;
    await expect(
      inspectI3SConversionInput(
        'https://example.invalid/layers/0',
        new AbortController().signal,
        fetcher
      )
    ).rejects.toThrow(
      variant === 'duplicate'
        ? /Repeated/
        : variant === 'count'
          ? /1,000/
          : /aggregate input byte budget/
    );
    expect(sourceFetcher.mock.calls.every(call => !String(call[0]).includes('/geometries/'))).toBe(
      true
    );
  }
});

test('conversion closes a local reader on mapping failure and cancellation', async () => {
  const inspection = await inspectI3SConversionInput(fixture.file, new AbortController().signal);
  const close = vi.spyOn(BlobFile.prototype, 'close');
  try {
    await expect(
      convertSelectedI3SContents(
        inspection,
        ['1'],
        'slpk',
        new AbortController().signal,
        () => {},
        fetch,
        {...fixture.features, maxAttributeBytes: 1}
      )
    ).rejects.toMatchObject({code: 'INPUT_RESOURCE_TOO_LARGE'});
    expect(close).toHaveBeenCalledOnce();
    const controller = new AbortController();
    await expect(
      convertSelectedI3SContents(
        inspection,
        ['1'],
        'slpk',
        controller.signal,
        phase => {
          if (phase === 'convert') controller.abort(new Error('Canceled conversion'));
        },
        fetch,
        fixture.features
      )
    ).rejects.toThrow('Canceled conversion');
    expect(close).toHaveBeenCalledTimes(2);
  } finally {
    close.mockRestore();
  }
});

test('I3S/SLPK controls require selection, mapping and metric error and download the partial archive', async () => {
  const React = await import('react');
  const {createRoot} = await import('react-dom/client');
  const {ConversionPanel} = await import(
    '../examples/website/i3s-slpk/src/components/conversion-panel'
  );
  const {setInputValue, readSettledControl} = await import('./utils/tile-browser-conversion');
  const fetcher = createI3SFixtureFetcher(fixture.resources);
  vi.stubGlobal('fetch', fetcher);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    await React.act(async () =>
      root.render(React.createElement(ConversionPanel, {onPreview: () => {}}))
    );
    for (const profile of ['i3s', 'slpk']) {
      const source = container.querySelector<HTMLSelectElement>('#conversion-input-format')!;
      source.value = profile;
      await React.act(async () => {
        source.dispatchEvent(new Event('change', {bubbles: true}));
      });
      expect(container.querySelector('a')).toBeNull();
      if (profile === 'i3s')
        await setInputValue(
          container.querySelector<HTMLInputElement>('#conversion-url')!,
          'https://example.invalid/layers/0'
        );
      else {
        const transfer = new DataTransfer();
        transfer.items.add(fixture.file);
        const input = container.querySelector<HTMLInputElement>('#conversion-file')!;
        input.files = transfer.files;
        await React.act(async () => {
          input.dispatchEvent(new Event('change', {bubbles: true}));
        });
      }
      await React.act(async () => {
        container
          .querySelector('form')!
          .dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
      });
      await expect
        .poll(() => readSettledControl(() => container.querySelector('#conversion-content')))
        .not.toBeNull();
      const content = container.querySelector<HTMLSelectElement>('#conversion-content')!;
      expect(content.value).toBe('');
      content.value = '1';
      await React.act(async () => {
        content.dispatchEvent(new Event('change', {bubbles: true}));
      });
      await setInputValue(
        container.querySelector<HTMLTextAreaElement>('#conversion-features')!,
        JSON.stringify(fixture.features)
      );
      const output = container.querySelector<HTMLSelectElement>('#conversion-format')!;
      output.value = '3tz';
      await React.act(async () => {
        output.dispatchEvent(new Event('change', {bubbles: true}));
      });
      const button = Array.from(container.querySelectorAll('button')).find(
        element => element.textContent === 'Convert selected content'
      )!;
      if (profile === 'i3s') {
        await React.act(async () => button.click());
        expect(container.querySelector('[role="alert"]')!.textContent).toMatch(/geometric error/);
        expect(container.querySelector('a')).toBeNull();
      }
      await setInputValue(
        container.querySelector<HTMLInputElement>('#conversion-geometric-error')!,
        '2'
      );
      await React.act(async () => button.click());
      await expect
        .poll(() => readSettledControl(() => container.querySelector('a')?.download))
        .toBe('selected-mesh.3tz');
    }
  } finally {
    await React.act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  }
});

// UI lifecycle uses an inline executor; genuine File/worker transport is exercised in the slow lane.
vi.mock('../examples/website/i3s-slpk/src/conversion-worker-client', async importOriginal => {
  const original =
    await importOriginal<
      typeof import('../examples/website/i3s-slpk/src/conversion-worker-client')
    >();
  return {
    ...original,
    convertSelectedContentsInWorker: (
      ...arguments_: Parameters<typeof original.convertSelectedContentsInWorker>
    ) => {
      const [inspection, resourceIds, format, signal, progress, features, geometricError] =
        arguments_;
      return convertSelectedI3SContents(
        inspection as import('../examples/website/i3s-slpk/src/i3s-conversion-input').I3SConversionInspection,
        resourceIds,
        format,
        signal,
        progress,
        fetch,
        features as typeof fixture.features,
        geometricError
      );
    }
  };
});

test('conversion rejects altered nonleaf or missing-content declarations before resource I/O', async () => {
  const inspection = await inspectI3SConversionInput(fixture.file, new AbortController().signal);
  const fetcher = vi.fn<typeof fetch>();
  for (const variant of ['nonleaf', 'missing', 'uri']) {
    const altered = structuredClone(inspection);
    const header = altered.resources[0].header;
    if (variant === 'nonleaf') header.children = [{id: '2'}] as typeof header.children;
    if (variant === 'missing') delete header.contentUrl;
    if (variant === 'uri') header.contentUrl = 'https://example.invalid/different';
    await expect(
      convertSelectedI3SContents(
        altered,
        ['1'],
        'slpk',
        new AbortController().signal,
        () => {},
        fetcher,
        fixture.features
      )
    ).rejects.toThrow(/inspected leaf/);
  }
  expect(fetcher).not.toHaveBeenCalled();
});
