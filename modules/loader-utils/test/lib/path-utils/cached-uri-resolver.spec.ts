// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import test from 'tape-promise/tape';
import {CachedUriResolver} from '@loaders.gl/loader-utils';

test('CachedUriResolver resolves URL and filesystem bases', t => {
  const urlResolver = new CachedUriResolver('https://example.com/root/content');
  t.equal(
    urlResolver.resolve('../models/tile.glb?token=one'),
    'https://example.com/root/models/tile.glb?token=one'
  );
  t.equal(
    urlResolver.resolve('data:model/gltf-binary;base64,Z2xURg=='),
    'data:model/gltf-binary;base64,Z2xURg=='
  );

  const pathResolver = new CachedUriResolver('/tmp/tiles');
  t.equal(pathResolver.resolve('models/tile.glb'), '/tmp/tiles/models/tile.glb');
  t.equal(pathResolver.resolve('/absolute/tile.glb'), '/absolute/tile.glb');
  t.end();
});

test('CachedUriResolver caches derived strings and can clear them', t => {
  const resolver = new CachedUriResolver('https://example.com/root');
  const firstResolvedUri = resolver.resolve('tile name.glb');
  const secondResolvedUri = resolver.resolve('tile name.glb');

  t.equal(firstResolvedUri, 'https://example.com/root/tile name.glb');
  t.equal(secondResolvedUri, firstResolvedUri, 'returns the cached derivation');
  resolver.clear();
  t.equal(
    resolver.resolve('tile name.glb'),
    firstResolvedUri,
    'retains the parsed base after clearing'
  );
  t.end();
});
