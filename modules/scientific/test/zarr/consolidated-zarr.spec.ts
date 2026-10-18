// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {loadConsolidatedMetadata} from '../../src/zarr/lib/consolidated-zarr';

test('consolidated metadata normalizes v2 direct children and root attributes', async () => {
  const metadata = {
    '.zgroup': {},
    '.zattrs': {title: 'sample'},
    'image/.zarray': {},
    'group/.zgroup': {},
    'group/nested/.zarray': {},
    unused: null
  };
  const result = await loadConsolidatedMetadata(
    'https://example.com/store/',
    async () => Response.json({metadata}),
    {metadataPath: '.zmetadata'}
  );
  expect(result).toMatchObject({
    format: 'v2',
    rootAttributes: {title: 'sample'},
    topLevelGroups: ['group'],
    topLevelArrays: ['image']
  });
  expect(result.rootAttributes).not.toBe(metadata['.zattrs']);
  const empty = await loadConsolidatedMetadata(
    'https://example.com/store',
    async () => Response.json({metadata: {'.zattrs': null}}),
    {metadataPath: 'zmetadata'}
  );
  expect(empty.rootAttributes).toEqual({});
});

test('consolidated metadata probes past HTTP and malformed payloads', async () => {
  const requested: string[] = [];
  const result = await loadConsolidatedMetadata('https://example.com/store///', async url => {
    requested.push(url);
    if (url.endsWith('/zarr.json'))
      return new Response(null, {status: 503, statusText: 'Unavailable'});
    if (url.endsWith('/.zmetadata')) return Response.json({metadata: null});
    return Response.json({metadata: {'data/.zarray': {}}});
  });
  expect(requested).toEqual(
    ['zarr.json', '.zmetadata', 'zmetadata'].map(name => `https://example.com/store/${name}`)
  );
  expect(result.topLevelArrays).toEqual(['data']);
  await expect(
    loadConsolidatedMetadata(
      'https://example.com/store',
      async () => new Response(null, {status: 404})
    )
  ).rejects.toThrow(/Tried zarr.json, .zmetadata, zmetadata/);
});

test('consolidated metadata preserves explicit parse failures and cancellation', async () => {
  await expect(
    loadConsolidatedMetadata('https://example.com/store', async () => Response.json({}), {
      metadataPath: 'zmetadata'
    })
  ).rejects.toThrow(/missing metadata object/);
  const controller = new AbortController();
  await expect(
    loadConsolidatedMetadata(
      'https://example.com/store',
      async (_url, options) => {
        expect(options?.signal).toBe(controller.signal);
        controller.abort();
        return Response.json({});
      },
      {signal: controller.signal}
    )
  ).rejects.toThrow(/missing consolidated_metadata/);
});

test('v3 consolidated metadata ignores invalid and nested nodes', async () => {
  const result = await loadConsolidatedMetadata('https://example.com/store', async () =>
    Response.json({
      consolidated_metadata: {
        metadata: {
          '': {node_type: 'group'},
          group: {node_type: 'group'},
          'group/child': {node_type: 'array'},
          data: {node_type: 'array'},
          invalid: null,
          scalar: 1
        }
      }
    })
  );
  expect(result.rootAttributes).toEqual({});
  expect(result.topLevelGroups).toEqual(['group']);
  expect(result.topLevelArrays).toEqual(['data']);
});
