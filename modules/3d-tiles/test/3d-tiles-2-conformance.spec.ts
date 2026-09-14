// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {describe, expect, test} from 'vitest';
import {coreApi, load} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {Tiles3DSource, Tileset3D} from '@loaders.gl/tiles';

const VECTOR_PREVIEW_URL = '@loaders.gl/3d-tiles/test/data/3d-tiles-2/vector-preview/tileset.json';
const NATIVE_DRAFT_URL = '@loaders.gl/3d-tiles/test/data/3d-tiles-2/native-draft/tileset.gltf';

describe('experimental 3D Tiles 2.0 conformance fixtures', () => {
  test.each([
    ['Cesium 1.1 vector preview', VECTOR_PREVIEW_URL, '1.1', false],
    ['native draft 2.0', NATIVE_DRAFT_URL, '2.0-draft', true]
  ] as const)('loads %s through the worker and runtime boundaries', async (_name, url, version, clip) => {
    const header = await load(url, Tiles3DLoader, {worker: true});
    const source = new Tiles3DSource({...header, coreApi}, {worker: true});
    const tileset = new Tileset3D(source);
    await tileset.tilesetInitializationPromise;
    await tileset.root!.loadContent();

    expect(header.formatVersion).toBe(version);
    expect(header.extensionsUsed).toContain('VENDOR_optional');
    expect(tileset.root!.vectorContent).toMatchObject({
      clip,
      primitives: [{type: 'polylines', ranges: [{offset: 0, count: 3}]}]
    });
    tileset.destroy();
  });

  test('preserves optional draft extensions without treating them as required', async () => {
    const header = await load(NATIVE_DRAFT_URL, Tiles3DLoader, {worker: false});

    expect(header.extensions.VENDOR_optional).toEqual({fixture: true});
    expect(header.extensionsRequired).toEqual(['3DTILES_tileset']);
  });
});
