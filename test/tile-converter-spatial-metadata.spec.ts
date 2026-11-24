// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import {parse} from '@loaders.gl/core';
import {Tiles3DLoader, type Tiles3DTilesetJSON} from '@loaders.gl/tiles-3d/3d-tiles';
import {Tiles3DSource} from '@loaders.gl/tiles-3d/3d-tiles';
import {Tileset3D} from '@loaders.gl/tiles-3d/tileset';
import {createMeshTilesetConversionSource} from '@loaders.gl/tile-converter/v5/adapters';

/** Dedicated runtimes released after each qualification attempt. */
const runtimes: Tileset3D[] = [];

/** Minimal declared ECEF document with box bounds, without a region or magnitude inference. */
function createDocument(epoch?: number): Tiles3DTilesetJSON {
  return {
    asset: {version: '1.1'},
    schema: {
      classes: {
        frame: {
          properties: {
            crs: {type: 'STRING', semantic: 'TILESET_CRS_GEOCENTRIC'},
            ...(epoch === undefined
              ? {}
              : {
                  epoch: {
                    type: 'SCALAR',
                    componentType: 'FLOAT64',
                    semantic: 'TILESET_CRS_COORDINATE_EPOCH'
                  }
                })
          }
        }
      }
    },
    metadata: {
      class: 'frame',
      properties: {crs: 'EPSG:4978', ...(epoch === undefined ? {} : {epoch})}
    },
    geometricError: 0,
    root: {
      boundingVolume: {box: [6378137, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1]},
      geometricError: 0,
      content: {uri: 'mesh.glb'}
    }
  };
}

/** Uses real loader discovery and runtime qualification, without fetching any mesh content. */
async function createSource(document: Tiles3DTilesetJSON) {
  /** Normalize the same document consumed by the spatial resolver. */
  const parsed = await parse(new TextEncoder().encode(JSON.stringify(document)), Tiles3DLoader, {
    core: {worker: false}
  });
  /** Supplies a parsed root rather than a URL transport. */
  const source = new Tiles3DSource(parsed);
  /** Any accidental geometry request during qualification must fail the test. */
  const loadContent = vi
    .spyOn(source, 'loadTileContent')
    .mockRejectedValue(new Error('Unexpected content read'));
  /** Source-backed runtime resolves the actual native frame and epoch. */
  const runtime = new Tileset3D(source);
  runtimes.push(runtime);
  await runtime.tilesetInitializationPromise;
  return {source: createMeshTilesetConversionSource(runtime), loadContent};
}

afterEach(() => {
  for (const runtime of runtimes.splice(0)) runtime.destroy();
});

test.each([
  undefined,
  2020.5
])('mesh qualification consumes inline ECEF metadata with epoch %s', async epoch => {
  /** A fresh document allows independent metadata mutations. */
  const document = createDocument(epoch);
  /** Qualification must not rewrite authored metadata or bounds. */
  const original = structuredClone(document);
  /** Real runtime qualification is separate from content transport. */
  const {source, loadContent} = await createSource(document);
  /** Accepted values remain available in the normalized source reference. */
  const metadata = await source.inspect();
  expect(metadata.spatialReference).toMatchObject({
    status: 'native',
    sourceCrs: 'EPSG:4978',
    coordinateEpoch: epoch
  });
  expect(metadata.tileset.metadata).toEqual(document.metadata);
  expect(document).toEqual(original);
  expect(loadContent).not.toHaveBeenCalled();
});

test.each([
  [
    'unmapped property',
    (document: Tiles3DTilesetJSON) => {
      (document.schema!.classes!.frame as {properties: Record<string, unknown>}).properties.label =
        {type: 'STRING'};
      document.metadata!.properties!.label = 'building';
    }
  ],
  [
    'missing class',
    (document: Tiles3DTilesetJSON) => {
      document.metadata!.class = 'absent';
      document.root.boundingVolume = {region: [-0.001, -0.001, 0.001, 0.001, -100, 100]};
    }
  ],
  [
    'external schema',
    (document: Tiles3DTilesetJSON) => {
      document.schemaUri = 'schema.json';
    }
  ],
  [
    'entity extras',
    (document: Tiles3DTilesetJSON) => {
      document.metadata!.extras = {owner: 'city'};
    }
  ],
  [
    'groups',
    (document: Tiles3DTilesetJSON) => {
      document.groups = [{class: 'frame', properties: {crs: 'EPSG:4978'}}];
    }
  ],
  [
    'duplicate semantic',
    (document: Tiles3DTilesetJSON) => {
      (document.schema!.classes!.frame as {properties: Record<string, unknown>}).properties.other =
        {type: 'STRING', semantic: 'TILESET_CRS_GEOCENTRIC'};
      document.metadata!.properties!.other = 'EPSG:4978';
    }
  ],
  [
    'implicit default',
    (document: Tiles3DTilesetJSON) => {
      (document.schema!.classes!.frame as {properties: Record<string, unknown>}).properties.label =
        {type: 'STRING', default: 'building'};
    }
  ],
  [
    'transformed epoch',
    (document: Tiles3DTilesetJSON) => {
      (document.schema!.classes!.frame as {properties: Record<string, unknown>}).properties.epoch =
        {
          type: 'SCALAR',
          componentType: 'FLOAT64',
          semantic: 'TILESET_CRS_COORDINATE_EPOCH',
          offset: 1
        };
      document.metadata!.properties!.epoch = 2020;
    }
  ],
  [
    'invalid epoch',
    (document: Tiles3DTilesetJSON) => {
      (document.schema!.classes!.frame as {properties: Record<string, unknown>}).properties.epoch =
        {type: 'SCALAR', componentType: 'FLOAT64', semantic: 'TILESET_CRS_COORDINATE_EPOCH'};
      document.metadata!.properties!.epoch = 'invalid';
    }
  ],
  [
    'conflicting CRS',
    (document: Tiles3DTilesetJSON) => {
      document.extensions = {
        EXT_geospatial_crs: {
          format: 'wkid',
          extensions: {EXT_geospatial_crs_wkid: {authority: 'EPSG', wkid: 4978}}
        }
      };
      document.metadata!.properties!.crs = 'EPSG:4326';
    }
  ],
  [
    'conflicting epoch',
    (document: Tiles3DTilesetJSON) => {
      document.extensions = {
        EXT_geospatial_crs: {
          format: 'wkid',
          extensions: {EXT_geospatial_crs_wkid: {authority: 'EPSG', wkid: 4978, epoch: 2021}}
        }
      };
      (document.schema!.classes!.frame as {properties: Record<string, unknown>}).properties.epoch =
        {type: 'SCALAR', componentType: 'FLOAT64', semantic: 'TILESET_CRS_COORDINATE_EPOCH'};
      document.metadata!.properties!.epoch = 2020;
    }
  ]
] as const)('mesh qualification rejects %s before content I/O', async (_name, change) => {
  /** A fresh document allows independent metadata mutations. */
  const document = createDocument();
  change(document);
  /** Real runtime qualification is separate from content transport. */
  const {source, loadContent} = await createSource(document);
  await expect(source.inspect()).rejects.toMatchObject({code: 'MESH_SOURCE_METADATA_UNSUPPORTED'});
  expect(loadContent).not.toHaveBeenCalled();
});

test.each([
  'undeclared',
  'non-ECEF'
] as const)('box-only %s coordinates remain rejected', async variant => {
  /** A fresh document allows independent metadata mutations. */
  const document = createDocument();
  if (variant === 'undeclared') {
    delete document.schema;
    delete document.metadata;
  } else document.metadata!.properties!.crs = 'EPSG:4326';
  /** Real runtime qualification is separate from content transport. */
  const {source, loadContent} = await createSource(document);
  await expect(source.inspect()).rejects.toMatchObject({code: 'MESH_SOURCE_FRAME_UNSUPPORTED'});
  expect(loadContent).not.toHaveBeenCalled();
});
