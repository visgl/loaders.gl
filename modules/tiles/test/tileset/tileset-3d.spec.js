// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {Tileset3D} from '@loaders.gl/tiles';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
// import {loadTileset} from '../utils/load-utils';

// Parent tile with content and four child tiles with content
const TILESET_URL = '@loaders.gl/3d-tiles/test/data/Tilesets/Tileset/tileset.json';
const KTX2_TILESET_URL = '@loaders.gl/3d-tiles/test/data/VNext/agi-ktx2/tileset.json';
const TILESET_GLOBAL_URL = '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetGlobal/tileset.json';

/*
// Parent tile with no content and four child tiles with content
const TILESET_EMPTY_ROOT_URL =
  '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetEmptyRoot/tileset.json';

// Tileset with 3 levels of uniform subdivision
const TILESET_UNIFORM = '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetUniform/tileset.json';

const TILESET_REPLACEMENT_1_URL =
  '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetReplacement1/tileset.json';
const TILESET_REPLACEMENT_2_URL =
  '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetReplacement2/tileset.json';
const TILESET_REPLACEMENT_3_URL =
  '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetReplacement3/tileset.json';

// 3 level tree with mix of additive and replacement refinement
const TILESET_REFINEMENT_MIX =
  '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetRefinementMix/tileset.json';

// tileset.json : root content points to tiles2.json
// tiles2.json: root with b3dm content, three children with b3dm content, one child points to tiles3.json
// tiles3.json: root with b3dm content
const TILESET_OF_TILESETS_URL =
  '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetOfTilesets/tileset.json';

const WITHOUT_BATCH_TABLE_URL =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedWithoutBatchTable/tileset.json';
const WITH_BATCH_TABLE_URL =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedWithBatchTable/tileset.json';
const NO_BATCH_IDS_URL = '@loaders.gl/3d-tiles/test/data/Batched/BatchedNoBatchIds/tileset.json';
*/

const TILESET_WITH_BATCH_TABLE_HIERARCHY_URL =
  '@loaders.gl/3d-tiles/test/data/Hierarchy/BatchTableHierarchy/tileset.json';

/*
const WITH_TRANSFORM_BOX_URL =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedWithTransformBox/tileset.json';
const WITH_TRANSFORM_SPHERE_URL =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedWithTransformSphere/tileset.json';
const WITH_TRANSFORM_REGION_URL =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedWithTransformRegion/tileset.json';
const WITH_BOUNDING_SPHERE_URL =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedWithBoundingSphere/tileset.json';

const COMPOSITE_URL = '@loaders.gl/3d-tiles/test/data/Composite/Composite/tileset.json';
const INSTANCED_URL =
  '@loaders.gl/3d-tiles/test/data/Instanced/InstancedWithBatchTable/tileset.json';
const INSTANCED_RED_MATERIAL_URL =
  '@loaders.gl/3d-tiles/test/data/Instanced/InstancedRedMaterial/tileset.json';

// 1 tile where each feature is a different source color
const COLORS_URL = '@loaders.gl/3d-tiles/test/data/Batched/BatchedColors/tileset.json';

// 1 tile where each feature has a reddish texture
const TEXTURED_URL = '@loaders.gl/3d-tiles/test/data/Batched/BatchedTextured/tileset.json';

// 1 tile with translucent features
const TRANSLUCENT_URL = '@loaders.gl/3d-tiles/test/data/Batched/BatchedTranslucent/tileset.json';

// 1 tile with opaque and translucent features
const TRANSLUCENT_OPAQUE_MIX_URL =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedTranslucentOpaqueMix/tileset.json';

// Root tile is transformed from local space to wgs84, child tile is rotated, scaled, and translated locally
const TILESET_WITH_TRANSFORMS_URL =
  '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetWithTransforms/tileset.json';

// Root tile with 4 b3dm children and 1 pnts child with a viewer request volume
const TILESET_WITH_VIEWER_REQUEST_VOLUME_URL =
  '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetWithViewerRequestVolume/tileset.json';

// Parent tile with content and four child tiles with content with viewer request volume for each child
const TILESET_REPLACEMENT_WITH_VIEWER_REQUEST_VOLUME_URL =
  '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetReplacementWithViewerRequestVolume/tileset.json';

const TILESET_WITH_EXTERNAL_RESOURCES_URL =
  '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetWithExternalResources/tileset.json';
const TILESET_URL_WITH_CONTENT_URI =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedWithContentDataUri/tileset.json';

const TILESET_SUBTREE_EXPIRATION_URL =
  '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetSubtreeExpiration/tileset.json';
const TILESET_SUBTREE_URL =
  '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetSubtreeExpiration/subtree.json';
const BATCHED_EXPIRATION_URL =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedExpiration/tileset.json';
const BATCHED_COLORS_B3DM_URL =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedColors/batchedColors.b3dm';
const BATCHED_VERTEX_COLORS_URL =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedWithVertexColors/tileset.json';

const STYLE_URL = '@loaders.gl/3d-tiles/test/data/Style/style.json';

const POINT_CLOUD_URL = '@loaders.gl/3d-tiles/test/data/PointCloud/PointCloudRGB/tileset.json';
const POINT_CLOUD_BATCHED_URL =
  '@loaders.gl/3d-tiles/test/data/PointCloud/PointCloudBatched/tileset.json';
*/

test('Tileset3D#throws with undefined url', (t) => {
  // @ts-ignore
  t.throws(() => new Tileset3D());
  t.end();
});

test('Tileset3D#url set up correctly given tileset JSON filepath', async (t) => {
  const path = '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetOfTilesets/tileset.json';

  const tilesetJson = await load(path, Tiles3DLoader);
  const tileset = new Tileset3D(tilesetJson);
  // NOTE: The url has been resolved (@loaders.gl/3d-tiles => localhost) so initial part is now different
  t.equals(tileset.url.slice(-30), path.slice(-30));
  t.end();
});

// TODO
test.skip('Tileset3D#url set up correctly given path with query string', async (t) => {
  const path = '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetOfTilesets/tileset.json';
  const param = '?param1=1&param2=2';
  // TODO - params do not work with fetchFile...
  const tilesetJson = await load(path, Tiles3DLoader);
  const tileset = new Tileset3D(tilesetJson);
  t.equals(tileset.url, path + param);
  t.end();
});

test('Tileset3D#loads and initializes with tileset JSON file', async (t) => {
  const tilesetJson = await load(TILESET_URL, Tiles3DLoader);
  const tileset = new Tileset3D(tilesetJson);

  t.ok('asset' in tileset);
  t.equals(tileset.asset.version, '1.0');
  t.equals(tileset.asset.tilesetVersion, '1.2.3');

  t.ok('properties' in tileset);
  t.ok('id' in tileset.properties);
  t.equals(tileset.properties.id.minimum, 0);
  t.equals(tileset.properties.id.maximum, 9);

  t.equals(tileset.geometricError, 240.0);
  t.ok(tileset.root);
  // NOTE: The url has been resolved (@loaders.gl/3d-tiles => localhost) so initial part is now different
  t.equals(tileset.url.slice(-30), TILESET_URL.slice(-30));

  t.end();
});

test('Tileset3D#loads tileset with extras', async (t) => {
  const tilesetJson = await load(TILESET_URL, Tiles3DLoader);
  const tileset = new Tileset3D(tilesetJson);
  const extras = tileset.root?.extras;

  t.deepEquals(tileset.extras, {name: 'Sample Tileset'});
  t.equals(extras, undefined);

  let taggedChildren = 0;
  const children = tileset.root?.children || [];

  for (const child of children) {
    if (child.extras) {
      t.deepEquals(child.extras, {id: 'Special Tile'});
      ++taggedChildren;
    }
  }

  t.equals(taggedChildren, 1);
  t.end();
});

test('Tileset3D#gets root tile', async (t) => {
  const tilesetJson = await load(TILESET_URL, Tiles3DLoader);
  const tileset = new Tileset3D(tilesetJson);

  t.ok(tileset.root);
  t.end();
});

test('Tileset3D#handles global tilesets without error', async (t) => {
  const tilesetJson = await load(TILESET_GLOBAL_URL, Tiles3DLoader);

  try {
    const tileset = new Tileset3D(tilesetJson);
    await tileset.tilesetInitializationPromise;

    t.deepEqual(
      tileset.cartographicCenter ? tileset.cartographicCenter.toArray() : null,
      [0, 0, -6378137]
    );
  } catch (e) {
    t.fail('exception thrown when loading tileset with bbox-center at [0,0,0]');
  }

  t.end();
});

test('Tileset3D#hasExtension returns true if the tileset JSON file uses the specified extension', async (t) => {
  const tilesetJson = await load(TILESET_WITH_BATCH_TABLE_HIERARCHY_URL, Tiles3DLoader);
  const tileset = new Tileset3D(tilesetJson);

  t.equals(tileset.hasExtension('3DTILES_batch_table_hierarchy'), true);
  t.equals(tileset.hasExtension('3DTILES_nonexistant_extension'), false);
  t.end();
});
