// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {expect, test} from 'vitest';
import {CachedUriResolver} from '@loaders.gl/loader-utils';

test('CachedUriResolver resolves URL and filesystem bases', () => {
  const urlResolver = new CachedUriResolver('https://example.com/root/content');
  expect(urlResolver.resolve('../models/tile.glb?token=one')).toBe(
    'https://example.com/root/models/tile.glb?token=one'
  );
  expect(urlResolver.resolve('data:model/gltf-binary;base64,Z2xURg==')).toBe(
    'data:model/gltf-binary;base64,Z2xURg=='
  );

  const pathResolver = new CachedUriResolver('/tmp/tiles');
  expect(pathResolver.resolve('models/tile.glb')).toBe('/tmp/tiles/models/tile.glb');
  expect(pathResolver.resolve('/absolute/tile.glb')).toBe('/absolute/tile.glb');
  expect(pathResolver.resolve('https://cdn.example.com/models/tile.glb')).toBe(
    'https://cdn.example.com/models/tile.glb'
  );
  expect(pathResolver.resolve('data:model/gltf+json;base64,e30=')).toBe(
    'data:model/gltf+json;base64,e30='
  );
});

test('CachedUriResolver caches derived strings and can clear them', () => {
  const resolver = new CachedUriResolver('https://example.com/root');
  const firstResolvedUri = resolver.resolve('tile name.glb');
  const secondResolvedUri = resolver.resolve('tile name.glb');

  expect(firstResolvedUri).toBe('https://example.com/root/tile name.glb');
  expect(secondResolvedUri).toBe(firstResolvedUri);
  resolver.clear();
  expect(resolver.resolve('tile name.glb')).toBe(firstResolvedUri);
});
