// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {beforeAll, describe, expect, test} from 'vitest';
import {coreApi, load} from '@loaders.gl/core';
import {Tiles3DLoader, type Tiles3DTilesetJSONPostprocessed} from '@loaders.gl/3d-tiles';
import {Tiles3DSource, Tileset3D} from '@loaders.gl/tiles';

const VECTOR_PREVIEW_URL = '@loaders.gl/3d-tiles/test/data/3d-tiles-2/vector-preview/tileset.json';
const NATIVE_DRAFT_URL = '@loaders.gl/3d-tiles/test/data/3d-tiles-2/native-draft/tileset.gltf';

describe('experimental 3D Tiles 2.0 conformance fixtures', () => {
  const parsedHeaders: Record<string, Tiles3DTilesetJSONPostprocessed> = {};

  beforeAll(async () => {
    [parsedHeaders[VECTOR_PREVIEW_URL], parsedHeaders[NATIVE_DRAFT_URL]] = await Promise.all([
      load(VECTOR_PREVIEW_URL, Tiles3DLoader, {
        worker: false
      }) as Promise<Tiles3DTilesetJSONPostprocessed>,
      load(NATIVE_DRAFT_URL, Tiles3DLoader, {
        worker: false
      }) as Promise<Tiles3DTilesetJSONPostprocessed>
    ]);
  });

  test.each([
    ['Cesium 1.1 vector preview', VECTOR_PREVIEW_URL, '1.1', false, '3DTILES_content_gltf_vector'],
    ['native draft 2.0', NATIVE_DRAFT_URL, '2.0-draft', true, '3DTILES_tileset_vectors']
  ] as const)('loads %s through the transfer and runtime boundaries', async (_name, url, version, clip, requiredVectorExtension) => {
    const serializedHeader = Tiles3DLoader.serializeWorkerResult!(parsedHeaders[url]);
    const header = Tiles3DLoader.deserializeWorkerResult!(structuredClone(serializedHeader));
    const source = new Tiles3DSource({...header, coreApi}, {worker: false});
    const tileset = new Tileset3D(source);
    await tileset.tilesetInitializationPromise;
    await tileset.root!.loadContent();

    expect(header.formatVersion).toBe(version);
    expect(header.extensionsUsed).toContain('VENDOR_optional');
    expect(header.extensionsRequired).toContain(requiredVectorExtension);
    expect(tileset.root!.vectorContent).toMatchObject({
      clip,
      primitives: [{type: 'polylines', ranges: [{offset: 0, count: 3}]}]
    });
    tileset.destroy();
  });

  test('preserves optional draft extensions without treating them as required', () => {
    const header = parsedHeaders[NATIVE_DRAFT_URL];

    expect(header.extensions.VENDOR_optional).toEqual({fixture: true});
    expect(header.extensionsRequired).toEqual(['3DTILES_tileset', '3DTILES_tileset_vectors']);
  });
});
