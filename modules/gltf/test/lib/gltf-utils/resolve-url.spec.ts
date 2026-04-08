import test from 'tape-promise/tape';
// @ts-expect-error
import {resolveUrl} from '@loaders.gl/gltf/lib/gltf-utils/resolve-url';

test('resolveUrl#resolves relative urls against document urls', t => {
  t.equal(
    resolveUrl('buffer.bin', {core: {baseUrl: 'https://example.com/models/model.gltf'}}),
    'https://example.com/models/buffer.bin',
    'resolves relative URLs against the source document directory'
  );

  t.equal(
    resolveUrl('buffer.bin', {core: {baseUrl: 'https://example.com/models/'}}),
    'https://example.com/models/buffer.bin',
    'preserves directory base URLs'
  );

  t.end();
});
