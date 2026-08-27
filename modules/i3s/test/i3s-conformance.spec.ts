// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fetchFile, parse} from '@loaders.gl/core';
import {I3SNodePageLoader} from '@loaders.gl/i3s';
import {I3SSceneLayerSchema} from '@loaders.gl/i3s/i3s-zod-schema';
import {describe, expect, it} from 'vitest';
import {parseUint64Values} from '../src/lib/parsers/parse-i3s-tile-content';

const SCENE_LAYER_FIXTURES = [
  {
    name: 'I3S 1.6 3D Object',
    url: '@loaders.gl/i3s/test/data/SanFrancisco_Bldgs/SceneServer/layers/0',
    expectedVersion: '1.6'
  },
  {
    name: 'I3S 1.8 3D Object',
    url: '@loaders.gl/i3s/test/data/conformance/i3s-1.8-3d-object.json',
    expectedVersion: '1.8'
  },
  {
    name: 'I3S 1.10 3D Object with forward fields',
    url: '@loaders.gl/i3s/test/data/conformance/i3s-1.10-3d-object.json',
    expectedVersion: '1.10'
  }
] as const;

describe('I3S conformance fixtures', () => {
  it.each(SCENE_LAYER_FIXTURES)('accepts $name scene-layer metadata', async fixture => {
    const response = await fetchFile(fixture.url);
    const document = await response.json();
    const sceneLayer = I3SSceneLayerSchema.parse(document);

    expect(sceneLayer.layerType).toBe('3DObject');
    expect(sceneLayer.store.version).toBe(fixture.expectedVersion);
  });

  it('accepts the representative I3S 1.7 node-page fixture', async () => {
    const response = await fetchFile(
      '@loaders.gl/i3s/test/data/SanFrancisco_3DObjects_1_7/SceneServer/layers/0/nodepages/0'
    );
    const nodePage = await parse(response, I3SNodePageLoader);

    expect(nodePage.nodes).toHaveLength(16);
    expect(nodePage.nodes[2].lodThreshold).toBe(870638.071285568);
  });

  it('preserves UInt64 values through Number.MAX_SAFE_INTEGER', () => {
    const buffer = new ArrayBuffer(16);
    const dataView = new DataView(buffer);
    dataView.setUint32(0, 0x89abcdef, true);
    dataView.setUint32(4, 0x1, true);
    dataView.setUint32(8, 0xffffffff, true);
    dataView.setUint32(12, 0x1fffff, true);

    const values = parseUint64Values(buffer, 2, 8);

    expect(values).toBeInstanceOf(Float64Array);
    expect(values[0]).toBe(0x1_89abcdef);
    expect(values[1]).toBe(Number.MAX_SAFE_INTEGER);
  });
});
