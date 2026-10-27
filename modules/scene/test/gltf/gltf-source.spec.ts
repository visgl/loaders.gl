// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {GLTFSource} from '@loaders.gl/scene/gltf';
import {createGLBV3} from './test-utils/create-glb-v3';

const model = {
  asset: {version: '2.0'},
  scenes: [{nodes: [0]}],
  nodes: [{children: [1]}, {mesh: 0}],
  meshes: [{primitives: [{attributes: {}}]}],
  buffers: [
    {uri: 'shared.bin', byteLength: 4},
    {uri: 'shared.bin', byteLength: 4}
  ]
};

test('GLTFSource#lazy resource fetching and cache', async () => {
  const calls: string[] = [];
  const fetcher = async (input: RequestInfo | URL): Promise<Response> => {
    const url = String(input);
    calls.push(url);
    if (url.endsWith('model.gltf')) return new Response(JSON.stringify(model), {status: 200});
    if (url.endsWith('shared.bin'))
      return new Response(new Uint8Array([1, 2, 3, 4]), {status: 200});
    return new Response('', {status: 404});
  };
  const source = await GLTFSource.open('https://example.com/model.gltf', {fetch: fetcher});
  expect(calls.length).toBe(1);
  expect([...source.traverse()].map(({index}) => index)).toEqual([0, 1]);
  const [firstBuffer, secondBuffer] = await Promise.all([
    source.resolveBuffer(0),
    source.resolveBuffer(1)
  ]);
  expect(firstBuffer.arrayBuffer).toBe(secondBuffer.arrayBuffer);
  expect(calls.length).toBe(2);
  source.close();
  expect(() => source.getScene()).toThrow(/closed/);
});

test('GLTFSource#cycle detection', async () => {
  const cyclic = {...model, nodes: [{children: [0]}]};
  const source = await GLTFSource.open('https://example.com/model.gltf', {
    fetch: async () => new Response(JSON.stringify(cyclic), {status: 200})
  });
  expect(() => [...source.traverse()]).toThrow(/Cycle/);
  source.close();
});

test('GLTFSource#preserves extension JSON without decoding', async () => {
  const document = {
    ...model,
    extensionsUsed: ['KHR_materials_unlit', 'EXT_texture_webp'],
    extensionsRequired: ['EXT_texture_webp'],
    materials: [{extensions: {KHR_materials_unlit: {}}}],
    textures: [{extensions: {EXT_texture_webp: {source: 0}}}],
    images: [{uri: 'image.webp'}]
  };
  const source = await GLTFSource.open('https://example.com/model.gltf', {
    fetch: async () => new Response(JSON.stringify(document))
  });
  expect(source.json).toEqual(document);
  source.close();
});

test('GLTFSource#file slices respect declared buffer bounds', async () => {
  const document = {
    ...model,
    bufferViews: [
      {buffer: 0, byteOffset: 1, byteLength: 2},
      {buffer: 0, byteOffset: 3, byteLength: 2}
    ],
    files: [
      {bufferView: 0, mimeType: 'application/octet-stream'},
      {bufferView: 1, mimeType: 'application/octet-stream'},
      {uri: 'shared.bin', mimeType: 'application/octet-stream'}
    ]
  };
  const source = await GLTFSource.open('https://example.com/model.gltf', {
    fetch: async input =>
      String(input).endsWith('.gltf')
        ? new Response(JSON.stringify(document))
        : new Response(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))
  });
  const file = await source.resolveFile(0);
  expect(Array.from(new Uint8Array(file.arrayBuffer, file.byteOffset, file.byteLength))).toEqual([
    2, 3
  ]);
  expect(await source.resolveFile(0)).toBe(file);
  await expect(source.resolveFile(1)).rejects.toThrow(/exceeds buffer/);
  const externalFile = await source.resolveFile(2);
  expect(externalFile.arrayBuffer).toBe(file.arrayBuffer);
  source.close();
  source.close();
  expect(source.gltf.buffers.every(buffer => buffer === null)).toBe(true);
  expect(source.gltf.files?.every(entry => entry === null)).toBe(true);
});

test('GLTFSource#uses redirected root URL for relative resources', async () => {
  const calls: string[] = [];
  const source = await GLTFSource.open('https://example.com/model.gltf', {
    fetch: async input => {
      calls.push(String(input));
      const response = new Response(JSON.stringify(model));
      Object.defineProperty(response, 'url', {value: 'https://example.com/redirected/model.gltf'});
      return response;
    }
  });
  await source.resolveBuffer(0);
  expect(calls[1]).toBe('https://example.com/redirected/shared.bin');
  source.close();
});

test('GLTFSource#rejects invalid depth limits and bounds traversal', async () => {
  const fetcher = async () => new Response(JSON.stringify(model));
  for (const maxDepth of [-1, NaN, Infinity, 0.5]) {
    await expect(
      GLTFSource.open('https://example.com/model.gltf', {fetch: fetcher, maxDepth})
    ).rejects.toThrow(/maxDepth/);
  }
  const source = await GLTFSource.open('https://example.com/model.gltf', {
    fetch: fetcher,
    maxDepth: 0
  });
  expect(() => [...source.traverse()]).toThrow(/depth exceeded/);
  expect(() => source.getNode(99)).toThrow(/Invalid/);
  expect(() => source.getScene(99)).toThrow(/Invalid/);
  source.close();
});

test('GLTFSource#retries failed resources and cancels pending requests', async () => {
  let attempts = 0;
  let requestSignal: AbortSignal | null | undefined;
  const source = await GLTFSource.open('https://example.com/model.gltf', {
    fetch: async (input, options) => {
      if (String(input).endsWith('.gltf')) return new Response(JSON.stringify(model));
      attempts++;
      if (attempts === 1) return new Response('', {status: 503});
      requestSignal = options?.signal;
      return await new Promise<Response>((resolve, reject) => {
        requestSignal?.addEventListener('abort', () => reject(new Error('aborted')), {once: true});
      });
    }
  });
  await expect(source.resolveBuffer(0)).rejects.toThrow(/503/);
  const pending = source.resolveBuffer(0);
  const rejection = expect(pending).rejects.toThrow(/aborted/);
  source.close();
  await rejection;
  expect(requestSignal?.aborted).toBe(true);
  expect(attempts).toBe(2);
  await expect(source.resolveBuffer(0)).rejects.toThrow(/closed/);
});

test('GLTFSource#embedded GLB file offsets and padding', async () => {
  const document = {
    asset: {version: '2.1'},
    buffers: [{byteLength: 3}],
    bufferViews: [
      {buffer: 0, byteOffset: 1, byteLength: 2},
      {buffer: 0, byteOffset: 3, byteLength: 1}
    ],
    files: [
      {bufferView: 0, mimeType: 'application/octet-stream'},
      {bufferView: 1, mimeType: 'application/octet-stream'}
    ]
  };
  const source = await GLTFSource.open('https://example.com/model.glb', {
    fetch: async () => new Response(createGLBV3(document, [new Uint8Array([10, 20, 30])]))
  });
  const file = await source.resolveFile(0);
  expect(file.byteOffset).toBeGreaterThan(0);
  expect(Array.from(new Uint8Array(file.arrayBuffer, file.byteOffset, file.byteLength))).toEqual([
    20, 30
  ]);
  await expect(source.resolveFile(1)).rejects.toThrow(/exceeds buffer/);
  source.close();
  expect('_glb' in source.gltf).toBe(false);
});

test('GLTFSource#invalid resources and failed root response', async () => {
  await expect(
    GLTFSource.open('https://example.com/model.gltf', {
      fetch: async () => new Response('', {status: 404})
    })
  ).rejects.toThrow(/404/);
  const source = await GLTFSource.open('https://example.com/model.gltf', {
    fetch: async input =>
      String(input).endsWith('.gltf')
        ? new Response(
            JSON.stringify({
              asset: {version: '2.0'},
              buffers: [{byteLength: 4}, {uri: 'short.bin', byteLength: 4}],
              files: [
                {uri: 'file.bin'},
                {mimeType: 'text/plain'},
                {mimeType: 'text/plain', bufferView: 99}
              ]
            })
          )
        : new Response(new Uint8Array([1]))
  });
  await expect(source.resolveBuffer(99)).rejects.toThrow(/Invalid/);
  await expect(source.resolveBuffer(0)).rejects.toThrow(/no embedded data/);
  await expect(source.resolveBuffer(1)).rejects.toThrow(/Truncated/);
  await expect(source.resolveFile(99)).rejects.toThrow(/Invalid/);
  await expect(source.resolveFile(0)).rejects.toThrow(/mimeType/);
  await expect(source.resolveFile(1)).rejects.toThrow(/exactly one/);
  await expect(source.resolveFile(2)).rejects.toThrow(/Invalid/);
  source.close();
});
