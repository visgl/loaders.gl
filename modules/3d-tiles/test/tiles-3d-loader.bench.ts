// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

import {CachedUriResolver} from '@loaders.gl/loader-utils';
import {
  createImplicitSubtreeReference,
  LOD_METRIC_TYPE,
  materializeImplicitSubtree,
  TILE_REFINEMENT,
  type ImplicitTilingDescriptor,
  type ParsedImplicitSubtree
} from '@loaders.gl/tiles';
import {preprocess3DTileContent} from '../src/lib/parsers/preprocess-3d-tile-content';

const CONTENT_REFERENCE_COUNT = 10_000;
const UNIQUE_CONTENT_COUNT = 250;
const CONTENT_URIS = Array.from(
  {length: CONTENT_REFERENCE_COUNT},
  (_, index) => `level-${index % 10}/content-${index % UNIQUE_CONTENT_COUNT}.glb`
);
const LARGE_TILESET_BYTES = createLargeTilesetBytes(CONTENT_REFERENCE_COUNT);
const IMPLICIT_DESCRIPTOR: ImplicitTilingDescriptor = {
  contentUrlTemplate: 'https://example.com/content/{level}/{x}/{y}.b3dm',
  subtreesUrlTemplate: 'https://example.com/subtrees/{level}/{x}/{y}.subtree',
  subdivisionScheme: 'QUADTREE',
  subtreeLevels: 6,
  maximumLevel: 5,
  refine: TILE_REFINEMENT.REPLACE,
  lodMetricType: LOD_METRIC_TYPE.GEOMETRIC_ERROR,
  rootLodMetricValue: 1024,
  rootBoundingVolume: {region: [0, 0, 1, 1, 0, 100]}
};
const FULL_IMPLICIT_SUBTREE: ParsedImplicitSubtree = {
  tileAvailability: {constant: 1},
  contentAvailability: {constant: 1},
  childSubtreeAvailability: {constant: 0}
};

/** Adds resource-intake benchmarks for large explicit 3D Tiles hierarchies. */
export default async function tiles3DLoaderBench(suite) {
  suite.group('@loaders.gl/3d-tiles resource intake');

  suite.add(
    'CachedUriResolver - resolve 10,000 repeated content references',
    {multiplier: CONTENT_REFERENCE_COUNT, unit: 'content references'},
    () => {
      const resolver = new CachedUriResolver('https://example.com/city/tiles');
      for (const contentUri of CONTENT_URIS) {
        resolver.resolve(contentUri);
      }
    }
  );

  suite.add(
    'preprocess3DTileContent - classify large explicit tileset JSON',
    {multiplier: CONTENT_REFERENCE_COUNT, unit: 'tile headers'},
    () => preprocess3DTileContent(LARGE_TILESET_BYTES)
  );

  suite.add(
    'materializeImplicitSubtree - materialize one 1,365-tile quadtree subtree',
    {multiplier: 1365, unit: 'tile headers'},
    () =>
      materializeImplicitSubtree(
        FULL_IMPLICIT_SUBTREE,
        createImplicitSubtreeReference(IMPLICIT_DESCRIPTOR, {level: 0, x: 0, y: 0, z: 0})
      )
  );
}

/** Creates a broad explicit tileset whose content references exercise JSON preprocessing. */
function createLargeTilesetBytes(tileCount: number): ArrayBuffer {
  const children = Array.from({length: tileCount}, (_, index) => ({
    boundingVolume: {sphere: [index, 0, 0, 1]},
    geometricError: 0,
    content: {uri: CONTENT_URIS[index]}
  }));
  const tileset = {
    asset: {version: '1.1'},
    geometricError: 1,
    root: {
      boundingVolume: {sphere: [0, 0, 0, tileCount]},
      geometricError: 1,
      children
    }
  };
  const bytes = new TextEncoder().encode(JSON.stringify(tileset));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
