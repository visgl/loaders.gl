// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {
  createBrowserTilesetConversionSource,
  selectBrowserTilesetContent
} from '@loaders.gl/tile-converter/v5/core';
import type {BrowserTilesetConversionSourceOptions} from '@loaders.gl/tile-converter/v5/core';

const rootUrl = 'https://example.invalid/root.json?token=root';
const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const transform = [...identity];
transform[0] = 2;
transform[5] = 2;
transform[10] = 2;
transform[12] = 10;
const root = {
  asset: {version: '1.1'},
  root: {
    transform,
    geometricError: 4,
    children: [
      {geometricError: 2, content: {uri: 'nested/tileset.json'}},
      {geometricError: 2, content: {uri: 'nested/tileset.json'}}
    ]
  }
};
const nested = {
  asset: {version: '1.0', gltfUpAxis: 'Z'},
  properties: {height: {minimum: 1}},
  root: {
    geometricError: 1,
    transform: [...identity.slice(0, 12), 3, 0, 0, 1],
    children: [{geometricError: 0, contents: [{uri: 'mesh.glb'}, {uri: 'other.glb'}]}]
  }
};

/** Tiny metadata fixture transport; binary resources fail if requested during inspection. */
function createSource(
  options: Partial<BrowserTilesetConversionSourceOptions> = {},
  document = root
) {
  const fetcher = vi.fn<typeof fetch>(async input => {
    const url = String(input);
    if (url === rootUrl) return new Response(JSON.stringify(document));
    if (url === 'https://example.invalid/nested/tileset.json?token=root')
      return new Response(JSON.stringify(nested));
    if (url.endsWith('mesh.glb?token=root') || url.endsWith('other.glb?token=root'))
      return new Response(new Uint8Array([1]));
    throw new Error(`Unexpected request ${url}`);
  });
  return {
    source: createBrowserTilesetConversionSource({
      input: rootUrl,
      maxInputBytes: 4096,
      maxInputResources: 8,
      maxTilesetDocuments: 3,
      inspectNestedTilesets: true,
      fetcher,
      ...options
    }),
    fetcher
  };
}

test('metadata inspection expands repeated document placements without loading mesh payloads', async () => {
  const {source, fetcher} = createSource();
  const inspection = await source.inspect();
  expect(fetcher.mock.calls.map(call => String(call[0]))).toEqual([
    rootUrl,
    'https://example.invalid/nested/tileset.json?token=root',
    'https://example.invalid/nested/tileset.json?token=root'
  ]);
  expect(inspection.documents).toHaveLength(3);
  expect(inspection.resources.map(resource => resource.documentIndex)).toEqual([1, 1, 2, 2]);
  expect(new Set(inspection.resources.map(resource => resource.resourceId)).size).toBe(4);
  expect(inspection.tilesetBytes).toBe(
    new TextEncoder().encode(JSON.stringify(root) + JSON.stringify(nested) + JSON.stringify(nested))
      .byteLength
  );
  const original = structuredClone(inspection);
  const selection = selectBrowserTilesetContent(inspection, inspection.resources[1]);
  expect(selection).toMatchObject({
    contentUrl: 'https://example.invalid/nested/other.glb?token=root',
    isLeaf: true
  });
  expect(selection.geometricError).toBeCloseTo(8);
  expect(selection.tileset).toMatchObject({
    asset: {version: '1.0', gltfUpAxis: 'Z'},
    properties: nested.properties,
    root: {
      transform: [...transform.slice(0, 12), 16, 0, 0, 1],
      children: [{content: {uri: 'other.glb'}}]
    }
  });
  expect(inspection).toEqual(original);
  const resources = [];
  for await (const resource of source.read({...inspection, resources: [inspection.resources[1]]}))
    resources.push(resource);
  expect(resources).toHaveLength(1);
  expect(resources[0].contentUrl).toBe(selection.contentUrl);
  expect(fetcher).toHaveBeenCalledTimes(4);
});

test.each([
  [{maxTilesetDocuments: 2}, 'INPUT_TILESET_COUNT_EXCEEDED'],
  [{maxInputResources: 5}, 'INPUT_RESOURCE_COUNT_EXCEEDED'],
  [
    {maxInputBytes: new TextEncoder().encode(JSON.stringify(root)).byteLength},
    'INPUT_RESOURCE_TOO_LARGE'
  ]
] as const)('expanded inspection enforces aggregate limits %j', async (options, code) => {
  const {source} = createSource(options);
  await expect(source.inspect()).rejects.toMatchObject({code});
});

test('missing ancestor errors permit metadata inspection but reject mesh selection', async () => {
  const missing = structuredClone(root);
  delete (missing.root as {geometricError?: number}).geometricError;
  const inspection = await createSource({}, missing).source.inspect();
  expect(inspection.resources).toHaveLength(4);
  expect(() => selectBrowserTilesetContent(inspection, inspection.resources[0])).toThrow(
    /ancestors/
  );
});

test('selection stops at the selected tile and rejects mismatched descriptors', async () => {
  const inspection = await createSource().source.inspect();
  expect(() =>
    selectBrowserTilesetContent(inspection, {...inspection.resources[0], uri: 'missing.glb'})
  ).toThrow(/descriptor/);
  expect(() =>
    selectBrowserTilesetContent(inspection, {...inspection.resources[0], documentIndex: 99})
  ).toThrow(/placement/);
  const document = {
    asset: {version: '1.1'},
    root: {geometricError: 1, content: {uri: 'mesh.glb'}, children: [{content: {uri: 'child.glb'}}]}
  };
  const source = createBrowserTilesetConversionSource({
    input: rootUrl,
    maxInputBytes: 4096,
    maxInputResources: 8,
    fetcher: async () => new Response(JSON.stringify(document))
  });
  const direct = await source.inspect();
  const selection = selectBrowserTilesetContent(direct, direct.resources[0]);
  expect(selection.isLeaf).toBe(false);
  expect(selection.geometricError).toBe(1);
  expect(selection.tileset.root?.children).toBeUndefined();
});

test('nested inspection rejects cycles, malformed metadata, implicit roots and child-bearing references', async () => {
  for (const document of [
    {asset: {version: '1.1'}, root: {content: {uri: 'tileset.json'}}},
    {asset: {version: '1.1'}, root: {implicitTiling: {}}},
    {not: 'a tileset'},
    '{'
  ]) {
    const source = createBrowserTilesetConversionSource({
      input: 'https://example.invalid/tileset.json',
      maxInputBytes: 4096,
      maxInputResources: 8,
      maxTilesetDocuments: 3,
      inspectNestedTilesets: true,
      fetcher: async () =>
        new Response(typeof document === 'string' ? document : JSON.stringify(document))
    });
    await expect(source.inspect()).rejects.toThrow();
  }
  const withChildren = structuredClone(root);
  Object.assign(withChildren.root.children[0], {children: [{geometricError: 0}]});
  await expect(createSource({}, withChildren).source.inspect()).rejects.toThrow(/child/);
});

test('effective nested URLs resolve content relative to redirects and retain the nested query', async () => {
  const fetcher = vi.fn<typeof fetch>(async input => {
    if (String(input) === rootUrl)
      return new Response(
        JSON.stringify({...root, root: {...root.root, children: [root.root.children[0]]}})
      );
    const response = new Response(JSON.stringify(nested));
    Object.defineProperty(response, 'url', {
      value: 'https://example.invalid/releases/tileset.json?token=nested'
    });
    return response;
  });
  const source = createBrowserTilesetConversionSource({
    input: rootUrl,
    maxInputBytes: 4096,
    maxInputResources: 8,
    maxTilesetDocuments: 3,
    inspectNestedTilesets: true,
    fetcher
  });
  const inspection = await source.inspect();
  expect(selectBrowserTilesetContent(inspection, inspection.resources[0]).contentUrl).toBe(
    'https://example.invalid/releases/mesh.glb?token=nested'
  );
});

test('inspection cancels failed response streams and observes cancellation', async () => {
  const cancel = vi.fn();
  const source = createBrowserTilesetConversionSource({
    input: rootUrl,
    maxInputBytes: 4096,
    maxInputResources: 8,
    maxTilesetDocuments: 3,
    inspectNestedTilesets: true,
    fetcher: async input =>
      String(input) === rootUrl
        ? new Response(JSON.stringify(root))
        : new Response(new ReadableStream({cancel}), {status: 404})
  });
  await expect(source.inspect()).rejects.toMatchObject({code: 'BROWSER_SOURCE_FETCH_FAILED'});
  expect(cancel).toHaveBeenCalledOnce();
  const controller = new AbortController();
  controller.abort(new Error('Canceled inspection'));
  await expect(source.inspect(controller.signal)).rejects.toThrow('Canceled inspection');
});

test('extensionless JSON is not probed during metadata inspection and cannot be selected as binary content', async () => {
  const source = createBrowserTilesetConversionSource({
    input: rootUrl,
    maxInputBytes: 4096,
    maxInputResources: 8,
    maxTilesetDocuments: 3,
    inspectNestedTilesets: true,
    fetcher: async input =>
      new Response(
        JSON.stringify(
          String(input) === rootUrl
            ? {asset: {version: '1.1'}, root: {content: {uri: 'metadata.bin'}}}
            : nested
        )
      )
  });
  const inspection = await source.inspect();
  expect(inspection.documents).toHaveLength(1);
  await expect(
    (async () => {
      for await (const resource of source.read(inspection)) void resource;
    })()
  ).rejects.toMatchObject({code: 'UNSUPPORTED_BROWSER_TILESET_CONTENT'});
});
