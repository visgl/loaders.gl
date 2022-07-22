import test from 'tape-promise/tape';

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

test('normalizeTileData#corectly resolves different styles of URLs', async (t) => {
  for (const [contentUri, basePath, resolvedUrl] of TESTS) {
    const tile = {content: {uri: contentUri}};
    const options = {basePath};
    const normalizedTile = normalizeTileData(tile, options);

    t.equals(normalizedTile.contentUrl, resolvedUrl, 'url should be resolved correctly');
  }

  t.end();
});
