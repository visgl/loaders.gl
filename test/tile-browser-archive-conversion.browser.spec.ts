import {afterEach, beforeAll, expect, test, vi} from 'vitest';
import {BlobFile, HttpFile} from '@loaders.gl/loader-utils';
import {Tiles3DArchive} from '@loaders.gl/3d-tiles';
import {parseSLPKArchive} from '@loaders.gl/i3s';
import {
  inspectConversionInput,
  convertSelectedContents,
  CONVERSION_LIMITS
} from '../examples/website/i3s-slpk/src/convert-tileset';
import {
  inspectI3SConversionInput,
  convertSelectedI3SContents
} from '../examples/website/i3s-slpk/src/i3s-conversion-input';
import {openConversionArchive} from '../examples/website/i3s-slpk/src/conversion-archive-input';
import {createI3SConversionFixture} from './utils/tile-browser-i3s-conversion';
import {
  createArchiveRangeFetcher,
  createTiles3DConversionArchive
} from './utils/tile-browser-archive-conversion';

let tilesFile: File;
let tilesBytes: Uint8Array;
let scene: Awaited<ReturnType<typeof createI3SConversionFixture>>;
let sceneBytes: Uint8Array;
beforeAll(async () => {
  tilesFile = await createTiles3DConversionArchive();
  tilesBytes = new Uint8Array(await tilesFile.arrayBuffer());
  scene = await createI3SConversionFixture();
  sceneBytes = new Uint8Array(await scene.file.arrayBuffer());
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test.each([
  'local',
  'remote'
] as const)('selected %s 3TZ content converts to either archive and closes readers', async profile => {
  const {fetcher} = createArchiveRangeFetcher(tilesBytes);
  const close = vi.spyOn(profile === 'local' ? BlobFile.prototype : HttpFile.prototype, 'close');
  const inspection = await inspectConversionInput(
    profile === 'local' ? tilesFile : 'https://example.invalid/archive?token=secret',
    new AbortController().signal,
    fetcher,
    true
  );
  expect(inspection.resources.map(resource => resource.uri)).toEqual(['meshes/triangle.glb']);
  expect(close).toHaveBeenCalledTimes(1);
  const snapshot = structuredClone(inspection);
  for (const format of ['slpk', '3tz'] as const) {
    const result = await convertSelectedContents(
      inspection,
      [inspection.resources[0].resourceId],
      format,
      new AbortController().signal,
      () => {},
      fetcher
    );
    expect(result.report.inputResources).toBe(1);
    const output = new BlobFile(result.file);
    try {
      const metadata =
        format === 'slpk'
          ? await (await parseSLPKArchive(output)).getFile('', 'http')
          : await new Tiles3DArchive(output).getFile('tileset.json');
      expect(JSON.parse(new TextDecoder().decode(metadata))).toBeDefined();
    } finally {
      await output.close();
    }
  }
  expect(inspection).toEqual(snapshot);
  if (profile === 'remote') {
    expect(inspection.archive!.identity!.etag).toBe('"fixture-v1"');
    expect(
      fetcher.mock.calls.every(
        call => String(call[0]) === 'https://example.invalid/archive?token=secret'
      )
    ).toBe(true);
    expect(fetcher.mock.calls.every(call => new Headers(call[1]?.headers).has('Range'))).toBe(true);
  } else expect(fetcher).not.toHaveBeenCalled();
});

test('remote SLPK preserves attributes and metric error through both writers', async () => {
  const {fetcher} = createArchiveRangeFetcher(sceneBytes);
  const inspection = await inspectI3SConversionInput(
    'https://example.invalid/archive?token=secret',
    new AbortController().signal,
    fetcher,
    true
  );
  expect(inspection.resources.map(resource => resource.resourceId)).toEqual(['1']);
  expect(inspection.archive!.identity!.byteLength).toBe(scene.file.size);
  for (const format of ['slpk', '3tz'] as const) {
    const result = await convertSelectedI3SContents(
      inspection,
      ['1'],
      format,
      new AbortController().signal,
      () => {},
      fetcher,
      scene.features,
      3
    );
    expect(result.report.inputResources).toBe(1);
    const output = new BlobFile(result.file);
    try {
      if (format === '3tz') {
        const document = JSON.parse(
          new TextDecoder().decode(await new Tiles3DArchive(output).getFile('tileset.json'))
        );
        expect(document.root.geometricError).toBe(3.01);
      } else {
        const layer = JSON.parse(
          new TextDecoder().decode(await (await parseSLPKArchive(output)).getFile('', 'http'))
        );
        expect(layer.fields.some(field => field.name === 'label')).toBe(true);
      }
    } finally {
      await output.close();
    }
  }
  expect(
    fetcher.mock.calls.every(
      call => String(call[0]) === 'https://example.invalid/archive?token=secret'
    )
  ).toBe(true);
});

test('remote archive replacement after inspection fails and closes the reopened reader', async () => {
  const {fetcher, identity} = createArchiveRangeFetcher(tilesBytes);
  const inspection = await inspectConversionInput(
    'https://example.invalid/input.3tz',
    new AbortController().signal,
    fetcher,
    true
  );
  identity.etag = '"fixture-v2"';
  const close = vi.spyOn(HttpFile.prototype, 'close');
  await expect(
    convertSelectedContents(
      inspection,
      [inspection.resources[0].resourceId],
      '3tz',
      new AbortController().signal,
      () => {},
      fetcher
    )
  ).rejects.toThrow(/ETag/);
  expect(close).toHaveBeenCalledTimes(1);
});

test.each([
  'whole-response',
  'missing-validator',
  'invalid-range',
  'oversized'
] as const)('remote archive rejects %s before conversion and closes its reader', async failure => {
  const close = vi.spyOn(HttpFile.prototype, 'close');
  const cancel = vi.fn();
  const fetcher = vi.fn<typeof fetch>(
    async () =>
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array([0]));
            controller.close();
          },
          cancel
        }),
        {
          status: failure === 'whole-response' ? 200 : 206,
          headers: {
            'Content-Range': `bytes ${failure === 'invalid-range' ? '1-1' : '0-0'}/${failure === 'oversized' ? CONVERSION_LIMITS.maxInputBytes + 1 : tilesFile.size}`,
            ...(failure === 'missing-validator' ? {} : {ETag: '"fixture"'})
          }
        }
      )
  );
  await expect(
    inspectConversionInput(
      'https://example.invalid/input.3tz',
      new AbortController().signal,
      fetcher,
      true
    )
  ).rejects.toThrow();
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(close).toHaveBeenCalledTimes(1);
});

test('indexed archives reject external/escaping and missing dependencies and close after abort', async () => {
  const controller = new AbortController();
  const close = vi.spyOn(BlobFile.prototype, 'close');
  const archive = await openConversionArchive(
    {input: tilesFile, format: '3tz'},
    CONVERSION_LIMITS.maxInputBytes,
    controller.signal
  );
  try {
    for (const path of [
      'https://example.invalid/mesh.glb',
      '../outside.glb',
      '%2e%2e%2foutside.glb',
      '%5c..%5coutside.glb'
    ])
      await expect(archive.fetcher(new URL(path, archive.rootUrl))).rejects.toThrow(
        /inside|escape/
      );
    await expect(archive.fetcher(new URL('missing.glb', archive.rootUrl))).rejects.toThrow(
      /No such file|not been found/
    );
    controller.abort(new Error('Canceled archive read'));
    await expect(archive.fetcher(archive.rootUrl)).rejects.toThrow('Canceled archive read');
  } finally {
    await archive.close();
  }
  expect(close).toHaveBeenCalledTimes(1);
});

test('archive limits and cancellation reject before opening or allocating selected resources', async () => {
  const controller = new AbortController();
  controller.abort(new Error('Canceled inspection'));
  const fetcher = vi.fn<typeof fetch>();
  await expect(inspectConversionInput(tilesFile, controller.signal, fetcher)).rejects.toThrow(
    'Canceled inspection'
  );
  expect(fetcher).not.toHaveBeenCalled();
  const large = new File([], 'large.3tz');
  Object.defineProperty(large, 'size', {value: CONVERSION_LIMITS.maxInputBytes + 1});
  await expect(inspectConversionInput(large, new AbortController().signal)).rejects.toThrow(
    /at most 16 MiB/
  );
  await expect(
    openConversionArchive({input: tilesFile, format: '3tz'}, 32, new AbortController().signal)
  ).rejects.toThrow(/at most/);
});

test.each([
  'slpk-url',
  '3tz',
  '3tz-url'
] as const)('archive controls inspect %s and require explicit selection', async profile => {
  const React = await import('react');
  const {createRoot} = await import('react-dom/client');
  const {ConversionPanel} = await import(
    '../examples/website/i3s-slpk/src/components/conversion-panel'
  );
  const {setInputValue, readSettledControl} = await import('./utils/tile-browser-conversion');
  const {fetcher} = createArchiveRangeFetcher(profile === 'slpk-url' ? sceneBytes : tilesBytes);
  vi.stubGlobal('fetch', fetcher);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    await React.act(async () =>
      root.render(React.createElement(ConversionPanel, {onPreview: () => {}}))
    );
    const format = container.querySelector<HTMLSelectElement>('#conversion-input-format')!;
    format.value = profile;
    await React.act(async () => format.dispatchEvent(new Event('change', {bubbles: true})));
    if (profile === '3tz') {
      const transfer = new DataTransfer();
      transfer.items.add(tilesFile);
      const input = container.querySelector<HTMLInputElement>('#conversion-file')!;
      expect(input.accept).toBe('.3tz');
      input.files = transfer.files;
      await React.act(async () => input.dispatchEvent(new Event('change', {bubbles: true})));
    } else
      await setInputValue(
        container.querySelector<HTMLInputElement>('#conversion-url')!,
        'https://example.invalid/archive?token=secret'
      );
    await React.act(async () =>
      container
        .querySelector('form')!
        .dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}))
    );
    await expect
      .poll(() => readSettledControl(() => container.querySelector('#conversion-content')))
      .not.toBeNull();
    const selection = container.querySelector<HTMLSelectElement>('#conversion-content')!;
    expect(selection.value).toBe('');
    expect(selection.options).toHaveLength(1);
    expect(container.querySelector('a')).toBeNull();
    expect(container.querySelector('[role="alert"]')).toBeNull();
    if (profile === '3tz') {
      format.value = 'slpk';
      await React.act(async () => format.dispatchEvent(new Event('change', {bubbles: true})));
      expect(container.querySelector('#conversion-content')).toBeNull();
      expect(container.querySelector<HTMLInputElement>('#conversion-file')!.files).toHaveLength(0);
      expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(
        true
      );
    }
  } finally {
    await React.act(async () => root.unmount());
    container.remove();
  }
});

test('canceling a pending remote identity probe cancels its body and closes the reader', async () => {
  const controller = new AbortController();
  const cancel = vi.fn();
  const close = vi.spyOn(HttpFile.prototype, 'close');
  const fetcher = vi.fn<typeof fetch>(
    async () =>
      new Response(new ReadableStream({cancel}), {
        status: 206,
        headers: {'Content-Range': `bytes 0-0/${tilesFile.size}`, ETag: '"fixture"'}
      })
  );
  const opening = inspectConversionInput(
    'https://example.invalid/input.3tz',
    controller.signal,
    fetcher,
    true
  );
  const rejected = expect(opening).rejects.toThrow('Canceled pending archive');
  await expect.poll(() => fetcher.mock.calls.length).toBe(1);
  controller.abort(new Error('Canceled pending archive'));
  await rejected;
  await expect.poll(() => cancel.mock.calls.length).toBe(1);
  expect(close).toHaveBeenCalledTimes(1);
});

test('repeated indexed reads obey the aggregate archive read budget', async () => {
  const archive = await openConversionArchive(
    {input: tilesFile, format: '3tz'},
    tilesFile.size,
    new AbortController().signal
  );
  try {
    let failure: unknown;
    for (let index = 0; index < 20; index++) {
      try {
        await archive.fetcher(archive.rootUrl);
      } catch (error) {
        failure = error;
        break;
      }
    }
    expect(failure).toMatchObject({code: 'INPUT_RESOURCE_TOO_LARGE'});
  } finally {
    await archive.close();
  }
});
