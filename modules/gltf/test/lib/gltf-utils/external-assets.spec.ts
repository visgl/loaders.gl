import test from 'test/utils/vitest-tape';
import {parse} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
import {createGLBV3} from '../../test-utils/create-glb-v3';

test('GLTFLoader#loads URI external assets and their relative dependencies', async t => {
  const fetchedUrls: string[] = [];
  const child = {
    asset: {version: '2.1'},
    buffers: [{byteLength: 4, uri: 'child.bin'}]
  };
  const root = {
    asset: {version: '2.1'},
    files: [{mimeType: 'model/gltf+json', uri: 'child/child.gltf'}],
    externalAssets: [
      {name: 'child-a', file: 0},
      {name: 'child-b', file: 0}
    ],
    nodes: [{externalAsset: 0}, {externalAsset: 1}]
  };

  const gltf = await parse(new TextEncoder().encode(JSON.stringify(root)), GLTFLoader, {
    core: {
      baseUrl: 'https://example.com/models/root.gltf',
      fetch: async url => {
        fetchedUrls.push(url);
        if (url.endsWith('child.gltf')) {
          return new Response(JSON.stringify(child));
        }
        if (url.endsWith('child.bin')) {
          return new Response(new Uint8Array([1, 2, 3, 4]));
        }
        throw new Error(`Unexpected URL ${url}`);
      }
    },
    gltf: {loadExternalAssets: true, loadImages: false}
  });

  const childAsset = gltf.externalAssets?.[0];
  t.ok(childAsset, 'parses the referenced child asset');
  t.equal(gltf.externalAssets?.[1], childAsset, 'caches repeated references to the same file');
  t.deepEqual(
    fetchedUrls,
    ['https://example.com/models/child/child.gltf', 'https://example.com/models/child/child.bin'],
    'resolves child dependencies relative to the child asset URI'
  );
  t.deepEqual(
    Array.from(new Uint8Array(childAsset!.buffers[0].arrayBuffer)),
    [1, 2, 3, 4],
    'loads the child buffer'
  );
  t.end();
});

test('GLTFLoader#resolves embedded external asset dependencies from the package', async t => {
  const child = new TextEncoder().encode(
    JSON.stringify({
      asset: {version: '2.1'},
      buffers: [{byteLength: 4, uri: 'child.bin'}]
    })
  );
  const childBuffer = new Uint8Array([5, 6, 7, 8]);
  const binary = new Uint8Array(child.byteLength + childBuffer.byteLength);
  binary.set(child);
  binary.set(childBuffer, child.byteLength);

  const data = createGLBV3(
    {
      asset: {version: '2.1'},
      buffers: [{byteLength: binary.byteLength}],
      bufferViews: [
        {buffer: 0, byteOffset: 0, byteLength: child.byteLength},
        {buffer: 0, byteOffset: child.byteLength, byteLength: childBuffer.byteLength}
      ],
      files: [
        {name: 'child.gltf', mimeType: 'model/gltf+json', bufferView: 0},
        {name: 'child.bin', mimeType: 'application/octet-stream', bufferView: 1}
      ],
      externalAssets: [{file: 0}],
      nodes: [{externalAsset: 0}]
    },
    [binary]
  );

  const gltf = await parse(data, GLTFLoader, {
    gltf: {loadBuffers: true, loadExternalAssets: true, loadImages: false}
  });
  const childAsset = gltf.externalAssets?.[0];

  t.ok(childAsset, 'parses the child JSON from its buffer view');
  t.deepEqual(
    Array.from(new Uint8Array(childAsset!.buffers[0].arrayBuffer)),
    [5, 6, 7, 8],
    'resolves the child URI through the containing files array'
  );
  t.ok(gltf.files?.[1], 'caches the package dependency in the parent files array');
  t.end();
});

test('GLTFLoader#rejects cyclical external assets', async t => {
  const recursiveAsset = JSON.stringify({
    asset: {version: '2.1'},
    files: [{mimeType: 'model/gltf+json', uri: './child.gltf'}],
    externalAssets: [{file: 0}],
    nodes: [{externalAsset: 0}]
  });

  await t.rejects(
    parse(new TextEncoder().encode(recursiveAsset), GLTFLoader, {
      core: {
        baseUrl: 'https://example.com/root.gltf',
        fetch: async () => new Response(recursiveAsset)
      },
      gltf: {loadExternalAssets: true, loadImages: false}
    }),
    /external asset cycle detected at https:\/\/example.com\/child.gltf/,
    'rejects recursive references before awaiting the cached parse'
  );
  t.end();
});
