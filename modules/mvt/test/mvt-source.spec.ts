// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {isBrowser} from '@loaders.gl/core';
import {TILESETS} from './data/tilesets';
import {MVTSourceLoader, MVTTileSource} from '@loaders.gl/mvt';
import {isURLTemplate, getURLFromTemplate} from '../src/mvt-source-loader';
test('MVTSourceLoader#urls', async () => {
  if (!isBrowser) {
    console.log('MVTSourceLoader currently only supported in browser');
    return;
  }
  for (const tilesetUrl of TILESETS) {
    const source = new MVTSourceLoader({url: tilesetUrl});
    expect(source).toBeTruthy();
    const metadata = await source.getMetadata();
    expect(metadata).toBeTruthy();
  }
});
test('MVTSourceLoader#Blobs', async () => {
  if (!isBrowser) {
    console.log('MVTSourceLoader currently only supported in browser');
    return;
  }
  for (const tilesetUrl of TILESETS) {
    const source = new MVTSourceLoader({url: tilesetUrl});
    expect(source).toBeTruthy();
    const metadata = await source.getMetadata();
    expect(metadata).toBeTruthy();
  }
});
const TEST_TEMPLATE = 'https://server.com/{z}/{x}/{y}.png';
const TEST_TEMPLATE2 = 'https://server.com/{z}/{x}/{y}/{x}-{y}-{z}.png';
const TEST_TEMPLATE_ARRAY = [
  'https://server.com/ep1/{x}/{y}.png',
  'https://server.com/ep2/{x}/{y}.png'
];
test('isURLFromTemplate', () => {
  expect(isURLTemplate(TEST_TEMPLATE), 'single string template').toBe(true);
  expect(isURLTemplate(TEST_TEMPLATE2), 'single string template with multiple occurance').toBe(
    true
  );
});
test('getURLFromTemplate', () => {
  expect(getURLFromTemplate(TEST_TEMPLATE, 1, 2, 0), 'single string template').toBe(
    'https://server.com/0/1/2.png'
  );
  expect(
    getURLFromTemplate(TEST_TEMPLATE2, 1, 2, 0),
    'single string template with multiple occurance'
  ).toBe('https://server.com/0/1/2/1-2-0.png');
  expect(getURLFromTemplate(TEST_TEMPLATE_ARRAY, 1, 2, 0, '1-2-0'), 'array of templates').toBe(
    'https://server.com/ep2/1/2.png'
  );
  expect(getURLFromTemplate(TEST_TEMPLATE_ARRAY, 2, 2, 0, '2-2-0'), 'array of templates').toBe(
    'https://server.com/ep1/2/2.png'
  );
  expect(getURLFromTemplate(TEST_TEMPLATE_ARRAY, 17, 11, 5, '17-11-5'), 'array of templates').toBe(
    'https://server.com/ep2/17/11.png'
  );
});
test('MVTTileSource#getTileData returns null for text/html responses', async () => {
  const reportedErrors: Error[] = [];
  const source = makeContentTypeSource('text/html; charset=utf-8', '<html></html>', true, error =>
    reportedErrors.push(error)
  );
  const tileData = await source.getTileData({index: {x: 0, y: 0, z: 0}});
  await source.metadata;
  expect(tileData, 'returns null for non-MVT response before parsing').toBe(null);
  expect(
    reportedErrors.some(error => error.message.includes('Unexpected tile content type text/html')),
    'reports ignored text through the source error callback'
  ).toBeTruthy();
});
test('MVTTileSource#getTile filters textual errors without rejecting custom binary types', async () => {
  const textualContentTypes = [
    'application/json',
    'application/problem+json',
    'application/xml',
    'application/problem+xml'
  ];
  for (const contentType of textualContentTypes) {
    const source = makeContentTypeSource(contentType, '{}', true);
    const tile = await source.getTile({x: 0, y: 0, z: 0, layers: []});
    await source.metadata;
    expect(tile, `rejects ${contentType}`).toBe(null);
  }
  const binarySource = makeContentTypeSource(
    'application/vnd.example.vector-tile',
    new Uint8Array([1, 2, 3]),
    true
  );
  const binaryTile = await binarySource.getTile({x: 0, y: 0, z: 0, layers: []});
  await binarySource.metadata;
  expect(Array.from(new Uint8Array(binaryTile!)), 'accepts custom binary types').toEqual([1, 2, 3]);
  const emptySource = makeContentTypeSource(null, null, false, undefined, 204);
  const emptyTile = await emptySource.getTile({x: 0, y: 0, z: 0, layers: []});
  await emptySource.metadata;
  expect(emptyTile?.byteLength, 'returns a 204 empty tile as an empty ArrayBuffer').toBe(0);
  const permissiveSource = makeContentTypeSource('text/plain', 'mislabeled tile');
  const permissiveTile = await permissiveSource.getTile({x: 0, y: 0, z: 0, layers: []});
  await permissiveSource.metadata;
  expect(permissiveTile, 'allows textual content types by default').toBeTruthy();
});
/** Creates an MVT source whose tile request returns a controlled content type and payload. */
function makeContentTypeSource(
  contentType: string | null,
  payload: BodyInit | null,
  ignoreTextResponses = false,
  onError?: (error: Error) => void,
  status = 200
): MVTTileSource {
  return new MVTTileSource('https://example.com/{z}/{x}/{y}.pbf', {
    mvt: {ignoreTextResponses},
    core: {
      onError,
      loadOptions: {
        core: {
          fetch: async url =>
            String(url).endsWith('tilejson.json')
              ? new Response(null, {status: 404})
              : new Response(payload, {
                  status,
                  headers: contentType ? {'content-type': contentType} : undefined
                })
        }
      }
    }
  });
}
