// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

import {expect, test} from 'vitest';
import {normalizeTileData} from '../../../src/lib/parsers/parse-3d-tile-header';
const TESTS = [
  // relative paths - different notations
  ['test.glb', 'https://example.tld/a/b/c', 'https://example.tld/a/b/c/test.glb'],
  ['d/test.glb', 'https://example.tld/a/b/c', 'https://example.tld/a/b/c/d/test.glb'],
  ['./d/test.glb', 'https://example.tld/a/b/c', 'https://example.tld/a/b/c/d/test.glb'],
  ['../d/test.glb', 'https://example.tld/a/b/c', 'https://example.tld/a/b/d/test.glb'],
  // absolute path
  [
    '/absolute-path/test.glb',
    'https://example.tld/a/b/c',
    'https://example.tld/absolute-path/test.glb'
  ],
  // fully qualified url
  [
    'https://other.example.tld/other-domain/test.glb',
    'https://example.tld/a/b/c',
    'https://other.example.tld/other-domain/test.glb'
  ],
  // data-url
  [
    'data:model/gltf-binary;base64,Z2xURg==',
    'https://example.tld/a/b/c',
    'data:model/gltf-binary;base64,Z2xURg=='
  ],
  // non-url basePath
  ['c/file.glb', '/a/b', '/a/b/c/file.glb'],
  // template-urls
  [
    '/implicit-tiling/{level}/{x}/{y}/{z}.glb',
    'https://example.tld/a/b',
    'https://example.tld/implicit-tiling/{level}/{x}/{y}/{z}.glb'
  ]
];
test('normalizeTileData#corectly resolves different styles of URLs', async () => {
  for (const [contentUri, basePath, resolvedUrl] of TESTS) {
    const tile = {content: {uri: contentUri}};
    // @ts-expect-error
    const normalizedTile = normalizeTileData(tile, basePath);
    expect(normalizedTile?.contentUrl, 'url should be resolved correctly').toBe(resolvedUrl);
  }
});

test('normalizeTileData#derives metadata bounding volume semantics', () => {
  const tile = {
    metadata: {class: 'tile', properties: {bounds: [1, 2, 3, 4]}},
    content: {
      uri: 'tile.b3dm',
      metadata: {class: 'content', properties: {bounds: [0, 0, 1, 1, 0, 10]}}
    }
  } as any;
  const schema = {
    classes: {
      tile: {properties: {bounds: {semantic: 'TILE_BOUNDING_SPHERE'}}},
      content: {properties: {bounds: {semantic: 'CONTENT_BOUNDING_REGION'}}}
    }
  } as any;
  const normalizedTile = normalizeTileData(tile, 'https://example.com/tiles', undefined, schema);
  expect(normalizedTile?.boundingVolume).toEqual({sphere: [1, 2, 3, 4]});
  expect((normalizedTile?.content as any)?.boundingVolume).toEqual({
    region: [0, 0, 1, 1, 0, 10]
  });
});
