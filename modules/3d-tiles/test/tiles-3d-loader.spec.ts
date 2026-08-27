// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {expect, test} from 'vitest';
import {coreApi, parse, fetchFile, load, isBrowser} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {Tiles3DLoader as BundledTiles3DLoader} from '@loaders.gl/3d-tiles/bundled';
import {DracoLoader} from '@loaders.gl/draco';
import {Tiles3DSource, Tileset3D} from '@loaders.gl/tiles';
const TILE_B3DM_WITH_DRACO_URL = '@loaders.gl/3d-tiles/test/data/143.b3dm';
const TILESET_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedColors/tileset.json';
const ACTUAL_B3DM =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedWithVertexColors/batchedWithVertexColors.b3dm';
const DEPRECATED_B3DM_1 =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedDeprecated1/batchedDeprecated1.b3dm';
const DEPRECATED_B3DM_2 =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedDeprecated2/batchedDeprecated2.b3dm';
const GLTF_CONTENT_TILESET_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/VNext/agi-ktx2/tileset.json';
const IMPLICIT_OCTREE_TILESET_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/SparseOctree/tileset.json';
const IMPLICIT_FULL_AVAILABLE_QUADTREE_TILESET_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/FullQuadtree/tileset.json';
const IMPLICIT_QUADTREE_TILESET_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/BasicExample/tileset.json';
const IMPLICIT_QUADTREE_SUBTREE_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/BasicExample/subtrees/0/0/0.subtree';
/** Encodes a minimal valid tileset with optional top-level or root overrides. */
function encodeTilesetJson(overrides: {[key: string]: any} = {}): ArrayBuffer {
  const tilesetJson = {
    asset: {version: '1.1'},
    geometricError: 1,
    root: {
      geometricError: 0,
      refine: 'REPLACE',
      boundingVolume: {sphere: [0, 0, 0, 1]}
    },
    ...overrides
  };
  const encodedJson = new TextEncoder().encode(JSON.stringify(tilesetJson));
  return encodedJson.buffer.slice(
    encodedJson.byteOffset,
    encodedJson.byteOffset + encodedJson.byteLength
  ) as ArrayBuffer;
}
test('Tiles3DLoader#Tileset file', async () => {
  const response = await fetchFile(TILESET_URL);
  const tileset = await parse(response, Tiles3DLoader);
  expect(tileset).toBeTruthy();
  expect(tileset.type).toBe('TILES3D');
  expect(tileset.lodMetricType).toBe('geometricError');
  expect(tileset.lodMetricValue).toBe(0);
  expect(tileset.loader).toBe(BundledTiles3DLoader);
  expect(tileset.root.refine).toBe(1);
  expect(tileset.root.boundingVolume.region).toEqual([
    -1.3197004795898053, 0.6988582109, -1.3196595204101946, 0.6988897891, 0, 20
  ]);
  expect(tileset.root.geometricError).toBe(0);
  expect(tileset.root.content.uri).toBe('batchedColors.b3dm');
  expect(tileset.root.lodMetricType).toBe('geometricError');
  expect(tileset.root.lodMetricValue).toBe(0);
  expect(tileset.root.type).toBe('scenegraph');
});
test('Tiles3DLoader#detects extensionless tileset JSON from structure', async () => {
  const tileset = await parse(encodeTilesetJson(), Tiles3DLoader, {worker: false});
  expect(tileset.shape).toBe('tileset3d');
  expect(tileset.asset.version).toBe('1.1');
  expect(tileset.root.lodMetricValue).toBe(0);
});
test('Tiles3DLoader#detects JSON glTF tile content from structure', async () => {
  const gltfJson = new TextEncoder().encode(
    JSON.stringify({asset: {version: '2.0'}, scenes: [{nodes: []}], scene: 0})
  );
  const gltfArrayBuffer = gltfJson.buffer.slice(
    gltfJson.byteOffset,
    gltfJson.byteOffset + gltfJson.byteLength
  ) as ArrayBuffer;
  const tile = await parse(gltfArrayBuffer, Tiles3DLoader, {
    worker: false,
    '3d-tiles': {loadGLTF: false}
  });
  expect(tile.type, 'routes JSON glTF through the shared glTF content parser').toBe('glTF');
  expect(tile.gltfArrayBuffer, 'preserves JSON glTF bytes for deferred parsing').toBe(
    gltfArrayBuffer
  );
});
test('Tiles3DLoader#reuses preprocessed JSON glTF when parsing is enabled', async () => {
  const gltfJson = new TextEncoder().encode(
    JSON.stringify({asset: {version: '2.0'}, scenes: [{nodes: []}], scene: 0})
  );
  const gltfArrayBuffer = gltfJson.buffer.slice(
    gltfJson.byteOffset,
    gltfJson.byteOffset + gltfJson.byteLength
  ) as ArrayBuffer;
  const tile = await parse(gltfArrayBuffer, Tiles3DLoader, {
    worker: false,
    '3d-tiles': {loadGLTF: true}
  });
  expect(tile.type).toBe('glTF');
  expect(tile.gltf?.asset.version, 'parses the preprocessed JSON glTF object').toBe('2.0');
});
test('Tiles3DLoader#reports explicit content-mode mismatches', async () => {
  await await expect(
    parse(encodeTilesetJson(), Tiles3DLoader, {
      worker: false,
      '3d-tiles': {isTileset: false}
    })
  ).rejects.toThrow(/Expected 3D tile render content; detected external tileset JSON/);
  await await expect(
    parse(new TextEncoder().encode(JSON.stringify({asset: {version: '2.0'}})), Tiles3DLoader, {
      worker: false,
      '3d-tiles': {isTileset: true}
    })
  ).rejects.toThrow(/Expected 3D Tiles tileset JSON; detected gltf/);
});
test('Tiles3DLoader#accepts supported required extensions', async () => {
  const extensionsRequired = [
    '3DTILES_implicit_tiling',
    '3DTILES_bounding_volume_S2',
    '3DTILES_batch_table_hierarchy',
    '3DTILES_draco_point_compression',
    '3DTILES_content_gltf'
  ];
  const tileset = await parse(
    encodeTilesetJson({extensionsRequired, extensionsUsed: extensionsRequired}),
    Tiles3DLoader,
    {worker: false, '3d-tiles': {isTileset: true}}
  );
  expect(tileset.extensionsRequired, 'preserves the required extensions').toEqual(
    extensionsRequired
  );
});
test('Tiles3DLoader#normalizes explicit S2 bounding volumes', async () => {
  const s2VolumeInfo = {token: '1', minimumHeight: 0, maximumHeight: 10};
  const s2BoundingVolume = {
    extensions: {'3DTILES_bounding_volume_S2': s2VolumeInfo}
  };
  const tileset = await parse(
    encodeTilesetJson({
      extensionsRequired: ['3DTILES_bounding_volume_S2'],
      root: {
        geometricError: 0,
        refine: 'REPLACE',
        boundingVolume: s2BoundingVolume,
        viewerRequestVolume: s2BoundingVolume,
        content: {uri: 'tile.glb', boundingVolume: s2BoundingVolume}
      }
    }),
    Tiles3DLoader,
    {worker: false, '3d-tiles': {isTileset: true}}
  );
  expect(tileset.root.boundingVolume.box.length, 'normalizes the tile traversal volume').toBe(12);
  expect(
    tileset.root.content.boundingVolume.box.length,
    'normalizes the explicit content volume'
  ).toBe(12);
  expect(
    tileset.root.viewerRequestVolume.box.length,
    'normalizes the explicit viewer request volume'
  ).toBe(12);
  expect(
    tileset.root.boundingVolume.s2VolumeInfo,
    'retains S2 metadata for implicit subdivision and diagnostics'
  ).toEqual(s2VolumeInfo);
});
test('Tiles3DLoader#allows unknown extensionsUsed entries', async () => {
  const tileset = await parse(
    encodeTilesetJson({extensionsUsed: ['VENDOR_optional_extension']}),
    Tiles3DLoader,
    {worker: false, '3d-tiles': {isTileset: true}}
  );
  expect(tileset.extensionsUsed, 'optional unknown extensions do not prevent loading').toEqual([
    'VENDOR_optional_extension'
  ]);
});
test('Tiles3DLoader#rejects unsupported required extensions', async () => {
  await await expect(
    parse(encodeTilesetJson({extensionsRequired: ['VENDOR_required_extension']}), Tiles3DLoader, {
      worker: false,
      '3d-tiles': {isTileset: true}
    }),
    'names an unsupported required extension'
  ).rejects.toThrow(/Unsupported required 3D Tiles extension: VENDOR_required_extension/);
  await await expect(
    parse(
      encodeTilesetJson({
        extensionsRequired: ['VENDOR_first', '3DTILES_multiple_contents', 'VENDOR_first']
      }),
      Tiles3DLoader,
      {worker: false, '3d-tiles': {isTileset: true}}
    ),
    'reports every unsupported extension once in declaration order'
  ).rejects.toThrow(
    /Unsupported required 3D Tiles extensions: VENDOR_first, 3DTILES_multiple_contents/
  );
});
test('Tiles3DLoader#rejects unknown binary tile types', async () => {
  const unknownTile = new TextEncoder().encode('nope').buffer as ArrayBuffer;
  await await expect(
    parse(unknownTile, Tiles3DLoader, {
      worker: false,
      '3d-tiles': {isTileset: false}
    }),
    'reports an unsupported resource-boundary payload'
  ).rejects.toThrow(/Invalid 3D Tiles content: expected supported binary magic or JSON object/);
});
test('Tiles3DLoader#validates required extensions before implicit subtree fetching', async () => {
  let fetchCallCount = 0;
  const implicitRoot = {
    geometricError: 1,
    refine: 'REPLACE',
    boundingVolume: {sphere: [0, 0, 0, 1]},
    content: {uri: 'content/{level}/{x}/{y}.glb'},
    implicitTiling: {
      subdivisionScheme: 'QUADTREE',
      subtreeLevels: 1,
      availableLevels: 2,
      subtrees: {uri: 'subtrees/{level}/{x}/{y}.subtree'}
    }
  };
  await await expect(
    parse(
      encodeTilesetJson({
        extensionsRequired: ['VENDOR_required_before_fetch'],
        root: implicitRoot
      }),
      Tiles3DLoader,
      {
        worker: false,
        '3d-tiles': {isTileset: true},
        fetch: async () => {
          fetchCallCount++;
          throw new Error('subtree fetch should not run');
        }
      }
    ),
    'rejects before normalization starts'
  ).rejects.toThrow(/Unsupported required 3D Tiles extension: VENDOR_required_before_fetch/);
  expect(fetchCallCount, 'does not request an implicit subtree').toBe(0);
});
test('Tiles3DLoader#finishes supported implicit parsing without subtree fetching', async () => {
  let fetchCallCount = 0;
  const tileset = await parse(
    encodeTilesetJson({
      extensionsRequired: ['3DTILES_implicit_tiling'],
      root: {
        geometricError: 8,
        refine: 'REPLACE',
        boundingVolume: {region: [0, 0, 1, 1, 0, 10]},
        content: {uri: 'content/{level}/{x}/{y}.b3dm'},
        implicitTiling: {
          subdivisionScheme: 'QUADTREE',
          subtreeLevels: 1,
          availableLevels: 1,
          subtrees: {uri: 'subtrees/{level}/{x}/{y}.subtree'}
        }
      }
    }),
    Tiles3DLoader,
    {
      worker: false,
      '3d-tiles': {isTileset: true},
      fetch: async () => {
        fetchCallCount++;
        throw new Error('initial tileset parsing must not fetch subtree availability');
      }
    }
  );
  expect(fetchCallCount).toBe(0);
  expect(tileset.root.children.length).toBe(0);
  expect(tileset.root.implicitSubtree.descriptor.maximumLevel).toBe(0);
});
test('Tiles3DLoader#Tile with GLB w/ Draco bufferviews', async () => {
  const response = await fetchFile(TILE_B3DM_WITH_DRACO_URL);
  const tile = await parse(response, [Tiles3DLoader, DracoLoader], {worker: false});
  expect(tile).toBeTruthy();
  // @ts-expect-error type Tiles3DLoader
  expect(tile.gltf).toBeTruthy();
  // @ts-expect-error type Tiles3DLoader
  expect(tile.type, 'Should parse the correct tiles type.').toBe('b3dm');
});
test('Tiles3DLoader#Tile with actual b3dm file', async () => {
  const response = await fetchFile(ACTUAL_B3DM);
  const tile = await parse(response, Tiles3DLoader);
  expect(tile).toBeTruthy();
  expect(tile.batchTableJson).toBeTruthy();
  expect(tile.batchTableJson.id).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  expect(tile.gltf).toBeTruthy();
});
test('Tiles3DLoader#Tile with deprecated 1 b3dm file', async () => {
  const response = await fetchFile(DEPRECATED_B3DM_1);
  const tile = await parse(response, Tiles3DLoader);
  expect(tile).toBeTruthy();
  expect(tile.batchTableJson).toBeTruthy();
  expect(tile.batchTableJson.id).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  expect(tile.gltf).toBeTruthy();
});
test('Tiles3DLoader#Tile with deprecated 2 b3dm file', async () => {
  const response = await fetchFile(DEPRECATED_B3DM_2);
  const tile = await parse(response, Tiles3DLoader);
  expect(tile).toBeTruthy();
  expect(tile.batchTableJson).toBeTruthy();
  expect(tile.batchTableJson.id).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  expect(tile.gltf).toBeTruthy();
});
test('Tiles3DLoader#loads json from base64 URL', async () => {
  // fetching base64 doesn't work in NodeJS
  if (!isBrowser) {
  }
  const tilesetJson = {
    asset: {
      version: '1.1'
    },
    geometricError: 0,
    root: {
      boundingVolume: {sphere: [0, 0, 0, 1]},
      geometricError: 0
    }
  };
  const uri = `data:text/plain;base64,${btoa(JSON.stringify(tilesetJson))}`;
  const response = await fetchFile(uri);
  const tilesetHeader = await parse(response, Tiles3DLoader, {'3d-tiles': {isTileset: true}});
  expect(tilesetHeader.asset, 'should contain asset').toBeTruthy();
  expect(tilesetHeader.asset.version, 'asset should contain version').toBeTruthy();
  expect(tilesetHeader.loader, 'should contain loader the header loaded with').toBeTruthy();
  expect(tilesetHeader.loader.id, 'loaded with supported tiles 3D format loader').toBe('3d-tiles');
  expect(typeof tilesetHeader.url, 'url should be string').toBe('string');
  expect(typeof tilesetHeader.basePath, 'basePath should be string').toBe('string');
  expect('root' in tilesetHeader, 'should contain root tile').toBeTruthy();
  expect(tilesetHeader.type).toBe('TILES3D');
});
test('Tiles3DLoader#Tile GLTF content extension', async () => {
  const tileset = await load(GLTF_CONTENT_TILESET_URL, Tiles3DLoader, {worker: false});
  const glbTileContent = await load(tileset.root.children[0].contentUrl, Tiles3DLoader, {
    worker: false
  });
  expect(glbTileContent.type).toBe('glTF');
  expect(glbTileContent.gltf).toBeTruthy();
});
test('Tiles3DLoader#normalizes an implicit octree without subtree requests', async () => {
  const IMPLICIT_TILING_EXPECTED = {
    subdivisionScheme: 'OCTREE',
    subtreeLevels: 3,
    availableLevels: 6,
    subtrees: {uri: 'subtrees/{level}/{x}/{y}/{z}.subtree'}
  };
  const response = await fetchFile(IMPLICIT_OCTREE_TILESET_URL);
  const tileset = await parse(response, Tiles3DLoader);
  expect(tileset).toBeTruthy();
  expect(tileset.root).toBeTruthy();
  expect(tileset.root.implicitTiling).toEqual(IMPLICIT_TILING_EXPECTED);
  expect(tileset.root.content.uri).toBe('content/{level}/{x}/{y}/{z}.glb');
  expect(tileset.root.lodMetricValue).toBe(32);
  expect(tileset.root.type).toBe('empty');
  expect(tileset.root.refine).toBe(1);
  expect(tileset.root.children.length, 'does not eagerly materialize subtree headers').toBe(0);
  expect(tileset.root.implicitSubtree.coordinates.level).toBe(0);
  expect(tileset.root.implicitSubtree.descriptor.maximumLevel).toBe(5);
  expect(
    tileset.root.implicitSubtree.subtreeUrl.endsWith('/subtrees/0/0/0/0.subtree')
  ).toBeTruthy();
});
test('Tiles3DLoader#normalizes a legacy implicit quadtree as a lazy root', async () => {
  const ROOT_EXTENSION_EXPECTED = {
    '3DTILES_implicit_tiling': {
      subdivisionScheme: 'QUADTREE',
      subtreeLevels: 3,
      maximumLevel: 2,
      subtrees: {uri: 'subtrees/{level}/{x}/{y}.subtree'}
    }
  };
  const response = await fetchFile(IMPLICIT_FULL_AVAILABLE_QUADTREE_TILESET_URL);
  const tileset = await parse(response, Tiles3DLoader);
  expect(tileset).toBeTruthy();
  expect(tileset.extensionsRequired[0]).toBe('3DTILES_implicit_tiling');
  expect(tileset.extensionsUsed[0]).toBe('3DTILES_implicit_tiling');
  expect(tileset.root).toBeTruthy();
  expect(tileset.root.content.uri).toBe('content/{level}/{x}/{y}.b3dm');
  expect(tileset.root.lodMetricValue).toBe(5000);
  expect(tileset.root.type).toBe('empty');
  expect(tileset.root.refine).toBe(1);
  expect(tileset.root.children.length).toBe(0);
  expect(tileset.root.extensions).toEqual(ROOT_EXTENSION_EXPECTED);
  expect(tileset.root.implicitSubtree.descriptor.maximumLevel).toBe(2);
  expect(tileset.root.implicitSubtree.subtreeUrl.endsWith('/subtrees/0/0/0.subtree')).toBeTruthy();
});
test('Tiles3DLoader#preserves ADD refinement on a lazy implicit root', async () => {
  const response = await fetchFile(IMPLICIT_QUADTREE_TILESET_URL);
  const tileset = await parse(response, Tiles3DLoader);
  const ROOT_EXTENSION_EXPECTED = {
    '3DTILES_implicit_tiling': {
      subdivisionScheme: 'QUADTREE',
      subtreeLevels: 2,
      maximumLevel: 1,
      subtrees: {uri: 'subtrees/{level}/{x}/{y}.subtree'}
    }
  };
  expect(tileset).toBeTruthy();
  expect(tileset.extensionsRequired[0]).toBe('3DTILES_implicit_tiling');
  expect(tileset.extensionsUsed[0]).toBe('3DTILES_implicit_tiling');
  expect(tileset.root).toBeTruthy();
  expect(tileset.root.content.uri).toBe('content/{level}/{x}/{y}.b3dm');
  expect(tileset.root.lodMetricValue).toBe(5000);
  expect(tileset.root.type).toBe('empty');
  expect(tileset.root.refine).toBe(2);
  expect(tileset.root.children.length).toBe(0);
  expect(tileset.root.extensions).toEqual(ROOT_EXTENSION_EXPECTED);
  expect(tileset.root.implicitSubtree.descriptor.maximumLevel).toBe(1);
});
test('Tiles3DLoader#parses source-managed implicit subtree resources', async () => {
  const response = await fetchFile(IMPLICIT_QUADTREE_SUBTREE_URL);
  const subtree = await parse(response, BundledTiles3DLoader, {
    worker: false,
    '3d-tiles': {isSubtree: true}
  } as any);
  expect(subtree.tileAvailability.explicitBitstream).toBeTruthy();
  expect(subtree.contentAvailability.explicitBitstream).toBeTruthy();
  expect(subtree.childSubtreeAvailability.constant).toBe(0);
});
test('Tiles3DSource#loads an actual implicit subtree after initialization', async () => {
  const tilesetJson = await load(IMPLICIT_QUADTREE_TILESET_URL, Tiles3DLoader);
  const tileset = new Tileset3D(new Tiles3DSource({...tilesetJson, coreApi}));
  await tileset.tilesetInitializationPromise;
  const root = tileset.root!;
  expect(root.children.length, 'starts with the lazy implicit root only').toBe(0);
  await root.loadChildren({} as any);
  expect(root.childrenState).toBe('ready');
  expect(root.contentUrl.endsWith('/content/0/0/0.b3dm')).toBeTruthy();
  expect(root.children.length, 'installs every available sparse tile header').toBe(3);
  expect(
    root.children.filter(child => child.hasRenderContent).length,
    'preserves the two content-bearing children'
  ).toBe(2);
  expect(root.children.every(child => child.depth === 1)).toBeTruthy();
});
