import {describe, expect, test} from 'vitest';
import {
  createImplicitSubtreeReference,
  LOD_METRIC_TYPE,
  materializeImplicitSubtree,
  TILE_REFINEMENT,
  type ImplicitTilingDescriptor,
  type ParsedImplicitSubtree
} from '@loaders.gl/tiles';

const descriptor: ImplicitTilingDescriptor = {
  contentUrlTemplate: 'https://example.com/content/{level}/{x}/{y}.b3dm',
  subtreesUrlTemplate: 'https://example.com/subtrees/{level}/{x}/{y}.subtree',
  subdivisionScheme: 'QUADTREE',
  subtreeLevels: 1,
  maximumLevel: 1,
  refine: TILE_REFINEMENT.REPLACE,
  lodMetricType: LOD_METRIC_TYPE.GEOMETRIC_ERROR,
  rootLodMetricValue: 8,
  rootBoundingVolume: {region: [0, 0, 1, 1, 0, 10]}
};

describe('implicit subtree metadata', () => {
  test('preserves metadata references on generated headers', () => {
    const subtree: ParsedImplicitSubtree = {
      tileAvailability: {constant: 1},
      contentAvailability: {constant: 1},
      childSubtreeAvailability: {constant: 0},
      propertyTables: [{name: 'buildings'}],
      tileMetadata: 0,
      contentMetadata: [0],
      subtreeMetadata: {source: 'fixture'}
    };

    const result = materializeImplicitSubtree(
      subtree,
      createImplicitSubtreeReference(descriptor, {level: 0, x: 0, y: 0, z: 0})
    );

    expect(result.root.implicitMetadata).toEqual({
      propertyTables: [{name: 'buildings'}],
      tileMetadata: 0,
      contentMetadata: [0],
      subtreeMetadata: {source: 'fixture'}
    });
  });
});
