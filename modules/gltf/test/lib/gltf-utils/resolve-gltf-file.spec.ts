// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {LoaderContext} from '@loaders.gl/loader-utils';
import type {GLTFWithBuffers} from '@loaders.gl/gltf';
import {findGLTFFileIndex, resolveGLTFFile} from '@loaders.gl/gltf';
test('resolveGLTFFile#resolves embedded package files by name', async () => {
  const arrayBuffer = new Uint8Array([0, 1, 2, 3, 4, 5]).buffer;
  const gltf = {
    json: {
      asset: {version: '2.1'},
      bufferViews: [{buffer: 0, byteOffset: 1, byteLength: 4}],
      files: [{name: 'nested/model.glb', mimeType: 'model/gltf-binary', bufferView: 0}]
    },
    buffers: [{arrayBuffer, byteOffset: 0, byteLength: 6}],
    files: [null]
  } as unknown as GLTFWithBuffers;
  const file = await resolveGLTFFile(
    gltf,
    'nested/model.glb',
    {},
    createLoaderContext(() => {
      throw new Error('embedded files must not fetch');
    })
  );
  expect(file.mimeType, 'preserves the declared MIME type').toBe('model/gltf-binary');
  expect(file.byteOffset, 'preserves the buffer view byte offset').toBe(1);
  expect(
    Array.from(new Uint8Array(file.arrayBuffer, file.byteOffset, file.byteLength)),
    'returns the embedded bytes without copying'
  ).toEqual([1, 2, 3, 4]);
  expect(gltf.files?.[0], 'caches the resolved file in the parallel files array').toBe(file);
});
test('resolveGLTFFile#fetches URI files relative to the containing asset', async () => {
  let fetchedUrl = '';
  const gltf = {
    json: {
      asset: {version: '2.1'},
      files: [{mimeType: 'audio/mpeg', uri: 'media/audio.mp3'}]
    },
    buffers: [],
    files: [null]
  } as unknown as GLTFWithBuffers;
  const context = createLoaderContext(async url => {
    fetchedUrl = String(url);
    return new Response(new Uint8Array([7, 8, 9]));
  });
  context.baseUrl = 'https://example.com/models';
  const file = await resolveGLTFFile(gltf, 'media/audio.mp3', {}, context);
  expect(fetchedUrl, 'resolves the relative URI').toBe(
    'https://example.com/models/media/audio.mp3'
  );
  expect(file.url, 'records the resolved source URL').toBe(fetchedUrl);
  expect(Array.from(new Uint8Array(file.arrayBuffer)), 'returns fetched file bytes').toEqual([
    7, 8, 9
  ]);
});
test('resolveGLTFFile#rejects unsuccessful URI responses', async () => {
  const gltf = {
    json: {
      asset: {version: '2.1'},
      files: [{mimeType: 'application/octet-stream', uri: 'missing.bin'}]
    },
    buffers: [],
    files: [null]
  } as unknown as GLTFWithBuffers;
  await expect(
    resolveGLTFFile(
      gltf,
      0,
      {core: {baseUrl: 'https://example.com/model.gltf'}},
      createLoaderContext(async () => new Response('not found', {status: 404}))
    ),
    'does not cache an HTTP error body as a resolved file'
  ).rejects.toThrow(/Failed to fetch glTF file missing.bin: HTTP 404/);
  expect(gltf.files?.[0], 'leaves the file cache empty').toBe(null);
});
test('findGLTFFileIndex#rejects ambiguous virtual package references', () => {
  const gltf = {
    json: {
      asset: {version: '2.1'},
      files: [
        {name: 'shared.bin', mimeType: 'application/octet-stream', bufferView: 0},
        {uri: 'shared.bin', mimeType: 'application/octet-stream'}
      ]
    },
    buffers: [],
    files: [null, null]
  } as unknown as GLTFWithBuffers;
  expect(() => findGLTFFileIndex(gltf, 'shared.bin'), 'requires a unique package mapping').toThrow(
    /package file reference shared.bin is ambiguous/
  );
});
test('resolveGLTFFile#requires exactly one file source', async () => {
  const gltf = {
    json: {
      asset: {version: '2.1'},
      files: [
        {
          mimeType: 'application/octet-stream',
          uri: 'data.bin',
          bufferView: 0
        }
      ]
    },
    buffers: [],
    files: [null]
  } as unknown as GLTFWithBuffers;
  await expect(
    resolveGLTFFile(gltf, 0, {}, createLoaderContext(globalThis.fetch)),
    'rejects conflicting URI and buffer view sources'
  ).rejects.toThrow(/must define exactly one of uri or bufferView/);
});
/** Create the minimum loader context needed by the file resolver. */
function createLoaderContext(fetch: typeof globalThis.fetch): LoaderContext {
  return {fetch} as LoaderContext;
}
