// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {GLTFSource} from '@loaders.gl/gltf';

const model = {
  asset: {version: '2.0'},
  scenes: [{nodes: [0]}],
  nodes: [{children: [1]}, {mesh: 0}],
  meshes: [{primitives: [{attributes: {}}]}],
  buffers: [{uri: 'shared.bin', byteLength: 4}, {uri: 'shared.bin', byteLength: 4}]
};

test('GLTFSource#lazy resource fetching and cache', async t => {
  const calls: string[] = [];
  const fetcher = async (input: RequestInfo | URL): Promise<Response> => {
    const url = String(input);
    calls.push(url);
    if (url.endsWith('model.gltf')) return new Response(JSON.stringify(model), {status: 200});
    if (url.endsWith('shared.bin')) return new Response(new Uint8Array([1, 2, 3, 4]), {status: 200});
    return new Response('', {status: 404});
  };
  const source = await GLTFSource.open('https://example.com/model.gltf', {fetch: fetcher});
  t.equal(calls.length, 1, 'only root fetched on open');
  t.deepEqual([...source.traverse()].map(({index}) => index), [0, 1], 'traverses raw node hierarchy');
  const [a, b] = await Promise.all([source.resolveBuffer(0), source.resolveBuffer(1)]);
  t.equal(a.arrayBuffer, b.arrayBuffer, 'shared URI is deduplicated');
  t.equal(calls.length, 2, 'resource fetched once');
  source.close();
  t.throws(() => source.getScene(), /closed/, 'closed source rejects access');
  t.end();
});

test('GLTFSource#cycle detection', async t => {
  const cyclic = {...model, nodes: [{children: [0]}]};
  const source = await GLTFSource.open('https://example.com/model.gltf', {
    fetch: async () => new Response(JSON.stringify(cyclic), {status: 200})
  });
  t.throws(() => [...source.traverse()], /Cycle/, 'rejects cycles');
  source.close();
  t.end();
});
