import test from 'tape-promise/tape';
import type {LoaderContext} from '@loaders.gl/loader-utils';
import type {GLTFWithBuffers} from '@loaders.gl/gltf';
import {findGLTFFileIndex, resolveGLTFFile} from '@loaders.gl/gltf';

test('resolveGLTFFile#resolves embedded package files by name', async t => {
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

  t.equal(file.mimeType, 'model/gltf-binary', 'preserves the declared MIME type');
  t.equal(file.byteOffset, 1, 'preserves the buffer view byte offset');
  t.deepEqual(
    Array.from(new Uint8Array(file.arrayBuffer, file.byteOffset, file.byteLength)),
    [1, 2, 3, 4],
    'returns the embedded bytes without copying'
  );
  t.equal(gltf.files?.[0], file, 'caches the resolved file in the parallel files array');
  t.end();
});

test('resolveGLTFFile#fetches URI files relative to the containing asset', async t => {
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

  t.equal(fetchedUrl, 'https://example.com/models/media/audio.mp3', 'resolves the relative URI');
  t.equal(file.url, fetchedUrl, 'records the resolved source URL');
  t.deepEqual(
    Array.from(new Uint8Array(file.arrayBuffer)),
    [7, 8, 9],
    'returns fetched file bytes'
  );
  t.end();
});

test('findGLTFFileIndex#rejects ambiguous virtual package references', t => {
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

  t.throws(
    () => findGLTFFileIndex(gltf, 'shared.bin'),
    /package file reference shared.bin is ambiguous/,
    'requires a unique package mapping'
  );
  t.end();
});

test('resolveGLTFFile#requires exactly one file source', async t => {
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

  await t.rejects(
    resolveGLTFFile(gltf, 0, {}, createLoaderContext(globalThis.fetch)),
    /must define exactly one of uri or bufferView/,
    'rejects conflicting URI and buffer view sources'
  );
  t.end();
});

/** Create the minimum loader context needed by the file resolver. */
function createLoaderContext(fetch: typeof globalThis.fetch): LoaderContext {
  return {fetch} as LoaderContext;
}
