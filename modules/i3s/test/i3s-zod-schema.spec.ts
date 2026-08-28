// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {parse} from '@loaders.gl/core';
import {I3SLoader, I3SNodePageLoader} from '@loaders.gl/i3s';
import {
  I3SNodePageSchema,
  I3SPointCloudSceneLayerSchema,
  I3SSceneLayerSchema
} from '@loaders.gl/i3s/i3s-zod-schema';
import {describe, expect, it} from 'vitest';
import {z} from 'zod';

const obb = {
  center: [8.67, 50.1, 189],
  halfSize: [10, 20, 30],
  quaternion: [0, 0, 0, 1]
};

describe('I3S metadata schemas', () => {
  it('validates scene-layer metadata and preserves extensions', () => {
    const sceneLayer = I3SSceneLayerSchema.parse({
      id: 0,
      layerType: '3DObject',
      version: '1.8',
      capabilities: ['View'],
      disablePopup: false,
      spatialReference: {wkid: 4326},
      store: {
        profile: 'meshpyramids',
        version: '1.8',
        defaultGeometrySchema: {},
        vendorSetting: true
      },
      nodePages: {
        nodesPerPage: 64,
        lodSelectionMetricType: 'maxScreenThresholdSQ'
      },
      vendor: {dataset: 'buildings'}
    });

    expect(sceneLayer.vendor).toEqual({dataset: 'buildings'});
    expect(sceneLayer.store.vendorSetting).toBe(true);
  });

  it('validates node pages and nested mesh references', () => {
    const nodePage = I3SNodePageSchema.parse({
      nodes: [
        {
          index: 0,
          obb,
          children: [],
          mesh: {
            material: {definition: 0, resource: 1},
            geometry: {definition: 0, resource: 1, vertexCount: 12},
            attribute: {definition: 0, resource: 1}
          }
        }
      ],
      pageIndex: 0
    });

    expect(nodePage.nodes[0].mesh?.geometry.vertexCount).toBe(12);
    expect(nodePage.pageIndex).toBe(0);
  });

  it('rejects malformed metadata at loader boundaries', async () => {
    await expect(parse('{"nodes":[{"index":0}]}', I3SNodePageLoader)).rejects.toThrow();
    const invalidSceneLayer = new TextEncoder().encode('{"id":0,"layerType":"3DObject"}').buffer;
    await expect(
      parse(invalidSceneLayer, I3SLoader, {
        i3s: {isTileset: true}
      })
    ).rejects.toThrow();
  });

  it('requires a WKID or WKT spatial reference', () => {
    expect(() => I3SSceneLayerSchema.parse(createSceneLayer({spatialReference: {}}))).toThrow();
  });

  it('exports scene-layer and node-page JSON Schemas', () => {
    const sceneLayerJsonSchema = z.toJSONSchema(I3SSceneLayerSchema, {target: 'draft-7'});
    const nodePageJsonSchema = z.toJSONSchema(I3SNodePageSchema, {target: 'draft-7'});

    expect(sceneLayerJsonSchema.required).toEqual(
      expect.arrayContaining(['id', 'layerType', 'version', 'capabilities', 'store'])
    );
    expect(nodePageJsonSchema.required).toContain('nodes');
  });

  it('represents the Point Cloud index alternative in JSON Schema', () => {
    const pointCloudJsonSchema = z.toJSONSchema(I3SPointCloudSceneLayerSchema, {target: 'draft-7'});
    expect(JSON.stringify(pointCloudJsonSchema)).toContain('nodePerIndexBlock');
    expect(JSON.stringify(pointCloudJsonSchema)).toContain('anyOf');
  });
});

/** Creates minimal valid I3S scene-layer metadata with optional overrides. */
function createSceneLayer(overrides: Record<string, unknown> = {}) {
  return {
    id: 0,
    layerType: '3DObject',
    version: '1.8',
    capabilities: ['View'],
    disablePopup: false,
    store: {
      profile: 'meshpyramids',
      version: '1.8',
      defaultGeometrySchema: {}
    },
    ...overrides
  };
}
