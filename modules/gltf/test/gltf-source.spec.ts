// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {GLTFSource} from '@loaders.gl/gltf';

const model = {
  asset: {version: '2.0'},
  scenes: [{nodes: [0]}],
  nodes: [{children: [1]}, {mesh: 0}],
  meshes: [{primitives: [{attributes: {}}]}],
  buffers: [{uri: 'shared.bin', byteLength: 4}, {uri: 'shared.bin', byteLength: 4}]
};

test('GLTFSource#lazy resource fetching and cache', async () => {
  const calls: string[] = [];
  const fetcher = async (input: RequestInfo | URL): Promise<Response> => {
    const url = String(input);
    calls.push(url);
    if (url.endsWith('model.gltf')) return new Response(JSON.stringify(model), {status: 200});
    if (url.endsWith('shared.bin')) return new Response(new Uint8Array([1, 2, 3, 4]), {status: 200});
    return new Response('', {status: 404});
  };
  const source = await GLTFSource.open('https://example.com/model.gltf', {fetch: fetcher});
  expect(calls.length).toBe(1);
  expect([...source.traverse()].map(({index}) => index)).toEqual([0, 1]);
  const [a, b] = await Promise.all([source.resolveBuffer(0), source.resolveBuffer(1)]);
  expect(a.arrayBuffer).toBe(b.arrayBuffer);
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
