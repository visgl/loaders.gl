// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {createBrowserTilesetConversionSource} from '@loaders.gl/tile-converter/v5/core';
import type {
  BrowserTilesetConversionInputResource,
  BrowserTilesetConversionSourceOptions
} from '@loaders.gl/tile-converter/v5/core';

const rootUrl = 'https://example.invalid/root.json';

/** Serializes a tiny explicit tileset without relying on an HTTP service. */
function encodeDocument(root: Record<string, unknown>, version = '1.1'): Uint8Array {
  return new TextEncoder().encode(JSON.stringify({asset: {version}, root}));
}

/** Creates a column-major scale/translation matrix for composition checks. */
function createTransform(scale: number, translation: number): number[] {
  return [scale, 0, 0, 0, 0, scale, 0, 0, 0, 0, scale, 0, translation, 0, 0, 1];
}

/** Creates deterministic byte responses and records resource requests. */
function createSource(
  files: Record<string, Uint8Array>,
  options: Partial<BrowserTilesetConversionSourceOptions> = {}
) {
  const fetcher = vi.fn<typeof fetch>(async input => {
    const bytes = files[String(input)];
    return new Response(bytes, {status: bytes ? 200 : 404});
  });
  const source = createBrowserTilesetConversionSource({
    input: rootUrl,
    maxInputBytes: 4096,
    maxInputResources: 16,
    maxTilesetDocuments: 8,
    fetcher,
    ...options
  });
  return {source, fetcher};
}

/** Consumes all raw resources from the source, preserving declaration order. */
async function readResources(
  source: ReturnType<typeof createBrowserTilesetConversionSource>,
  signal?: AbortSignal
): Promise<BrowserTilesetConversionInputResource[]> {
  const result: BrowserTilesetConversionInputResource[] = [];
  for await (const resource of source.read(await source.inspect(signal), signal))
    result.push(resource);
  return result;
}

test('nested documents expand in order, compose noncommuting transforms and retain document-relative identity', async () => {
  const root = encodeDocument({
    transform: createTransform(2, 10),
    children: [
      {content: {uri: 'city/metadata.bin'}, transform: createTransform(1, 3)},
      {content: {uri: 'last.glb'}}
    ]
  });
  const nested = encodeDocument(
    {
      transform: createTransform(1, 4),
      contents: [{uri: 'one.glb'}, {uri: 'two.glb'}],
      children: [{transform: createTransform(1, 5), content: {url: 'leaf.glb'}}]
    },
    '1.1'
  );
  const files = {
    [rootUrl]: root,
    'https://example.invalid/city/metadata.bin': nested,
    'https://example.invalid/city/one.glb': new Uint8Array([1]),
    'https://example.invalid/city/two.glb': new Uint8Array([2]),
    'https://example.invalid/city/leaf.glb': new Uint8Array([3]),
    'https://example.invalid/last.glb': new Uint8Array([4])
  };
  const {source, fetcher} = createSource(files);
  const inspection = await source.inspect();
  expect(fetcher).toHaveBeenCalledOnce();
  expect(inspection.resources).toHaveLength(2);
  const original = structuredClone(inspection);
  const resources = [];
  for await (const resource of source.read(inspection)) resources.push(resource);
  expect(resources.map(resource => [...resource.data])).toEqual([[1], [2], [3], [4]]);
  expect(resources.map(resource => resource.resourceId)).toEqual([
    'tile-0-content-0/tile-root-content-0',
    'tile-0-content-0/tile-root-content-1',
    'tile-0-content-0/tile-0-content-0',
    'tile-1-content-0'
  ]);
  expect(resources.map(resource => resource.transform[12])).toEqual([24, 24, 34, 10]);
  expect(resources[2].tilePath).toEqual([0]);
  expect(resources[2].tilesetUrl).toBe('https://example.invalid/city/metadata.bin');
  expect(resources[3].tilesetUrl).toBeUndefined();
  expect(
    resources.every(resource => resource.data.buffer.byteLength === resource.data.byteLength)
  ).toBe(true);
  expect(inspection).toEqual(original);
});

test('shared external documents are visited independently at each placement', async () => {
  const {source, fetcher} = createSource(
    {
      [rootUrl]: encodeDocument({
        children: [
          {transform: createTransform(1, 1), content: {uri: 'shared.json'}},
          {transform: createTransform(1, 2), content: {uri: 'shared.json'}}
        ]
      }),
      'https://example.invalid/shared.json': encodeDocument({content: {uri: 'mesh.glb'}}),
      'https://example.invalid/mesh.glb': new Uint8Array([1])
    },
    {maxTilesetDocuments: 3, maxInputResources: 4}
  );
  const resources = await readResources(source);
  expect(resources.map(resource => resource.transform[12])).toEqual([1, 2]);
  expect(new Set(resources.map(resource => resource.resourceId)).size).toBe(2);
  expect(
    fetcher.mock.calls.map(call => String(call[0])).filter(url => url.endsWith('shared.json'))
  ).toHaveLength(2);
});

test('query inheritance follows the declaring document and stops at a different origin', async () => {
  const input = rootUrl + '?token=root';
  const {source, fetcher} = createSource(
    {
      [input]: encodeDocument({content: {uri: 'sub/document.json?token=nested'}}),
      'https://example.invalid/sub/document.json?token=nested': encodeDocument({
        contents: [{uri: 'mesh.glb'}, {uri: 'https://other.invalid/mesh.glb'}]
      }),
      'https://example.invalid/sub/mesh.glb?token=nested': new Uint8Array([1]),
      'https://other.invalid/mesh.glb': new Uint8Array([2])
    },
    {input}
  );
  expect(await readResources(source)).toHaveLength(2);
  expect(fetcher.mock.calls.map(call => String(call[0]))).toEqual([
    input,
    'https://example.invalid/sub/document.json?token=nested',
    'https://example.invalid/sub/mesh.glb?token=nested',
    'https://other.invalid/mesh.glb'
  ]);
});

test.each([
  'root.json',
  'root.json#alias',
  'nested.json'
])('active document cycles (%s) fail before refetching the ancestor', async uri => {
  const files: Record<string, Uint8Array> = {[rootUrl]: encodeDocument({content: {uri}})};
  if (uri === 'nested.json')
    files['https://example.invalid/nested.json'] = encodeDocument({content: {uri: 'root.json'}});
  const {source, fetcher} = createSource(files);
  await expect(readResources(source)).rejects.toMatchObject({code: 'BROWSER_TILESET_CYCLE'});
  expect(fetcher).toHaveBeenCalledTimes(uri === 'nested.json' ? 2 : 1);
});

test.each([
  undefined,
  1,
  2
])('document budget %s includes the root and nested empty documents', async maxTilesetDocuments => {
  const {source} = createSource(
    {
      [rootUrl]: encodeDocument({content: {uri: 'first.json'}}),
      'https://example.invalid/first.json': encodeDocument({content: {uri: 'second.json'}}),
      'https://example.invalid/second.json': encodeDocument({})
    },
    {maxTilesetDocuments}
  );
  await expect(readResources(source)).rejects.toMatchObject({
    code:
      maxTilesetDocuments === 2
        ? 'INPUT_TILESET_COUNT_EXCEEDED'
        : 'UNSUPPORTED_BROWSER_TILESET_CONTENT'
  });
});

test('declaration and byte budgets are cumulative across external documents', async () => {
  const root = encodeDocument({content: {uri: 'nested.json'}});
  const nested = encodeDocument({content: {uri: 'mesh.glb'}});
  const files = {
    [rootUrl]: root,
    'https://example.invalid/nested.json': nested,
    'https://example.invalid/mesh.glb': new Uint8Array([1, 2])
  };
  const byteLength = root.byteLength + nested.byteLength + 2;
  expect(
    await readResources(
      createSource(files, {maxInputBytes: byteLength, maxInputResources: 2}).source
    )
  ).toHaveLength(1);
  await expect(
    readResources(createSource(files, {maxInputBytes: byteLength - 1}).source)
  ).rejects.toMatchObject({code: 'INPUT_RESOURCE_TOO_LARGE'});
  const limited = createSource(files, {maxInputResources: 1});
  await expect(readResources(limited.source)).rejects.toMatchObject({
    code: 'INPUT_RESOURCE_COUNT_EXCEEDED'
  });
  expect(limited.fetcher).toHaveBeenCalledTimes(2);
});

test.each([
  0,
  -1,
  Infinity,
  NaN,
  0.5
])('invalid document budget %s is rejected', maxTilesetDocuments => {
  expect(() => createSource({}, {maxTilesetDocuments})).toThrow(
    expect.objectContaining({code: 'INVALID_BROWSER_SOURCE_OPTIONS'})
  );
});

test.each([
  ['invalid JSON', new TextEncoder().encode('{broken'), 'INVALID_BROWSER_TILESET'],
  [
    'non-tileset JSON',
    new TextEncoder().encode('{"asset":{"version":"2.0"}}'),
    'UNSUPPORTED_BROWSER_TILESET'
  ],
  ['implicit tiles', encodeDocument({implicitTiling: {}}), 'UNSUPPORTED_BROWSER_TILESET'],
  [
    'conflicting declarations',
    encodeDocument({content: {uri: 'a'}, contents: []}),
    'INVALID_BROWSER_TILESET'
  ],
  ['bad transform', encodeDocument({transform: [1]}), 'INVALID_BROWSER_TILESET']
])('nested %s fails explicitly', async (_name, nested, code) => {
  const {source} = createSource({
    [rootUrl]: encodeDocument({content: {uri: 'nested.json'}}),
    'https://example.invalid/nested.json': nested as Uint8Array
  });
  await expect(readResources(source)).rejects.toMatchObject({code});
});

test('an external reference cannot also carry child tiles; overflowing composed matrices are rejected', async () => {
  const nested = encodeDocument({
    content: {uri: 'mesh.glb'},
    transform: createTransform(Number.MAX_VALUE, 0)
  });
  const {source} = createSource({
    [rootUrl]: encodeDocument({transform: createTransform(2, 0), content: {uri: 'nested.json'}}),
    'https://example.invalid/nested.json': nested
  });
  await expect(readResources(source)).rejects.toMatchObject({code: 'INVALID_BROWSER_TILESET'});
  const parent = createSource({
    [rootUrl]: encodeDocument({content: {uri: 'nested.json'}, children: [{}]}),
    'https://example.invalid/nested.json': encodeDocument({})
  });
  await expect(readResources(parent.source)).rejects.toMatchObject({
    code: 'INVALID_BROWSER_TILESET'
  });
});

test('closing iteration prevents nested siblings from being fetched', async () => {
  const {source, fetcher} = createSource({
    [rootUrl]: encodeDocument({content: {uri: 'nested.json'}}),
    'https://example.invalid/nested.json': encodeDocument({
      contents: [{uri: 'one.glb'}, {uri: 'two.glb'}]
    }),
    'https://example.invalid/one.glb': new Uint8Array([1])
  });
  for await (const _resource of source.read(await source.inspect())) break;
  expect(fetcher).toHaveBeenCalledTimes(3);
});

test('cancellation during a nested response read cancels its reader and prevents yields', async () => {
  const controller = new AbortController();
  const cancel = vi.fn();
  let response!: Response;
  const source = createBrowserTilesetConversionSource({
    input: rootUrl,
    maxInputBytes: 4096,
    maxInputResources: 2,
    maxTilesetDocuments: 2,
    fetcher: async input => {
      if (String(input) === rootUrl)
        return new Response(encodeDocument({content: {uri: 'nested.json'}}));
      response = new Response(
        new ReadableStream<Uint8Array>({
          pull(stream) {
            controller.abort(new Error('Canceled nested read'));
            stream.enqueue(encodeDocument({}));
          },
          cancel
        })
      );
      return response;
    }
  });
  await expect(readResources(source, controller.signal)).rejects.toThrow('Canceled nested read');
  expect(cancel).toHaveBeenCalledOnce();
  expect(response.body!.locked).toBe(false);
});

/** Gives a synthetic response its effective redirect URL without a network request. */
function setResponseUrl(response: Response, url: string): Response {
  Object.defineProperty(response, 'url', {value: url});
  return response;
}

test('root and nested redirects resolve dependencies against their effective URLs', async () => {
  const fetcher = vi.fn<typeof fetch>(async input => {
    const url = String(input);
    if (url === rootUrl)
      return setResponseUrl(
        new Response(encodeDocument({content: {uri: 'nested.json'}})),
        'https://example.invalid/redirect/root.json'
      );
    if (url === 'https://example.invalid/redirect/nested.json')
      return setResponseUrl(
        new Response(encodeDocument({content: {uri: 'mesh.glb'}})),
        'https://other.invalid/final/tileset.json'
      );
    return new Response(new Uint8Array([1]));
  });
  const {source} = createSource({}, {fetcher});
  const resources = await readResources(source);
  expect(resources[0].tilesetUrl).toBe('https://other.invalid/final/tileset.json');
  expect(fetcher.mock.calls.map(call => String(call[0]))).toEqual([
    rootUrl,
    'https://example.invalid/redirect/nested.json',
    'https://other.invalid/final/mesh.glb'
  ]);
});

test('a redirected ancestor is rejected and its response body is canceled', async () => {
  const cancel = vi.fn();
  const response = setResponseUrl(new Response(new ReadableStream({cancel})), rootUrl);
  const {source} = createSource(
    {},
    {
      fetcher: async input =>
        String(input) === rootUrl
          ? new Response(encodeDocument({content: {uri: 'alias.json'}}))
          : response
    }
  );
  await expect(readResources(source)).rejects.toMatchObject({code: 'BROWSER_TILESET_CYCLE'});
  expect(cancel).toHaveBeenCalledOnce();
});

test('legacy 1.0 external documents retain url content aliases', async () => {
  const {source} = createSource({
    [rootUrl]: encodeDocument({content: {url: 'legacy.json'}}, '1.0'),
    'https://example.invalid/legacy.json': encodeDocument({content: {url: 'legacy.b3dm'}}, '1.0'),
    'https://example.invalid/legacy.b3dm': new Uint8Array([1])
  });
  const resources = await readResources(source);
  expect(resources[0].uri).toBe('legacy.b3dm');
  expect(resources[0].tilesetUrl).toBe('https://example.invalid/legacy.json');
});

test('failed nested responses are canceled and carry the referring placement diagnostic', async () => {
  const cancel = vi.fn();
  const response = new Response(new ReadableStream({cancel}), {status: 404});
  const {source} = createSource(
    {},
    {
      fetcher: async input =>
        String(input) === rootUrl
          ? new Response(encodeDocument({content: {uri: 'missing.json'}}))
          : response
    }
  );
  await expect(readResources(source)).rejects.toMatchObject({
    code: 'BROWSER_SOURCE_FETCH_FAILED',
    diagnostics: [
      {resourceId: 'tile-root-content-0', message: 'https://example.invalid/missing.json'}
    ]
  });
  expect(cancel).toHaveBeenCalledOnce();
});

test('multiple external levels compose transforms and return to enclosing siblings', async () => {
  const {source} = createSource(
    {
      [rootUrl]: encodeDocument({
        transform: createTransform(2, 10),
        content: {uri: 'first/tileset.json'}
      }),
      'https://example.invalid/first/tileset.json': encodeDocument({
        transform: createTransform(1, 3),
        children: [{content: {uri: '../second/tileset.json'}}, {content: {uri: 'sibling.glb'}}]
      }),
      'https://example.invalid/second/tileset.json': encodeDocument({
        transform: createTransform(1, 4),
        content: {uri: 'mesh.glb'}
      }),
      'https://example.invalid/second/mesh.glb': new Uint8Array([1]),
      'https://example.invalid/first/sibling.glb': new Uint8Array([2])
    },
    {maxTilesetDocuments: 3, maxInputResources: 4}
  );
  const resources = await readResources(source);
  expect(resources.map(resource => resource.transform[12])).toEqual([24, 16]);
  expect(resources.map(resource => resource.resourceId)).toEqual([
    'tile-root-content-0/tile-0-content-0/tile-root-content-0',
    'tile-root-content-0/tile-1-content-0'
  ]);
});
