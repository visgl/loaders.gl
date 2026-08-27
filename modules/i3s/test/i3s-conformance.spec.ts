// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fetchFile, parse} from '@loaders.gl/core';
import {I3SNodePageLoader} from '@loaders.gl/i3s';
import {I3SSceneLayerSchema} from '@loaders.gl/i3s/i3s-zod-schema';
import {describe, expect, it} from 'vitest';
import {parseI3STileContent, parseUint64Values} from '../src/lib/parsers/parse-i3s-tile-content';
import {getLegacyMaterialDefinition, normalizeTileData} from '../src/lib/parsers/parse-i3s';

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
    name: 'I3S 1.9 3D Object',
    url: '@loaders.gl/i3s/test/data/conformance/i3s-1.9-3d-object.json',
    expectedVersion: '1.9'
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

  it('preserves UInt64 feature IDs through face-range expansion', async () => {
    const featureId = 0x1_89abcdef;
    const buffer = new ArrayBuffer(60);
    const dataView = new DataView(buffer);
    dataView.setUint32(0, 3, true);
    dataView.setUint32(4, 1, true);
    for (let index = 0; index < 9; index++) {
      dataView.setFloat32(8 + index * 4, index % 3 === 2 ? 0 : index % 3, true);
    }
    dataView.setUint32(44, featureId >>> 0, true);
    dataView.setUint32(48, Math.floor(featureId / 2 ** 32), true);
    dataView.setUint32(52, 0, true);
    dataView.setUint32(56, 0, true);

    const content = await parseI3STileContent(
      buffer,
      {mbs: [0, 0, 0]} as any,
      {
        store: {
          defaultGeometrySchema: {
            header: [
              {property: 'vertexCount', type: 'UInt32'},
              {property: 'featureCount', type: 'UInt32'}
            ],
            ordering: ['position'],
            vertexAttributes: {
              position: {valueType: 'Float32', valuesPerElement: 3}
            },
            featureAttributeOrder: ['id', 'faceRange'],
            featureAttributes: {
              id: {valueType: 'UInt64', valuesPerElement: 1},
              faceRange: {valueType: 'UInt32', valuesPerElement: 2}
            }
          }
        }
      } as any
    );

    expect(content.featureIds).toBeInstanceOf(Float64Array);
    expect(Array.from(content.featureIds as Float64Array)).toEqual([
      featureId,
      featureId,
      featureId
    ]);
  });

  it('preserves legacy mesh-segmentation bytes after schema-defined attributes', async () => {
    const buffer = new ArrayBuffer(48);
    const dataView = new DataView(buffer);
    dataView.setUint32(0, 3, true);
    dataView.setUint32(4, 0, true);
    for (let index = 0; index < 9; index++) {
      dataView.setFloat32(8 + index * 4, index % 3, true);
    }
    new Uint8Array(buffer, 44).set([0x53, 0x45, 0x47, 0x01]);

    const content = await parseI3STileContent(
      buffer,
      {mbs: [0, 0, 0]} as any,
      {
        store: {
          defaultGeometrySchema: {
            header: [
              {property: 'vertexCount', type: 'UInt32'},
              {property: 'featureCount', type: 'UInt32'}
            ],
            ordering: ['position'],
            vertexAttributes: {
              position: {valueType: 'Float32', valuesPerElement: 3}
            },
            featureAttributeOrder: [],
            featureAttributes: {}
          }
        }
      } as any
    );

    expect(content.meshSegmentation).toBeInstanceOf(ArrayBuffer);
    expect(Array.from(new Uint8Array(content.meshSegmentation!))).toEqual([0x53, 0x45, 0x47, 0x01]);
  });

  it('loads and normalizes a legacy shared-resource material', async () => {
    const sharedResources = {
      materialDefinitions: {
        '0': {
          params: {
            diffuse: [0.2, 0.4, 0.6],
            transparency: 0.25,
            renderMode: 'textured',
            cullFace: 'none'
          }
        }
      },
      textureDefinitions: {
        '0': {encoding: ['image/png'], images: []}
      }
    };
    const tile = await normalizeTileData(
      {
        id: 'legacy',
        mbs: [0, 0, 0, 1],
        sharedResource: {href: './shared'}
      },
      {
        url: '/layers/0/nodes/legacy',
        baseUrl: '/layers/0/nodes',
        queryString: '',
        fetch: async () => new Response(JSON.stringify(sharedResources)),
        coreApi: {} as any,
        _parse: async () => null
      }
    );

    expect(tile.textureFormat).toBe('png');
    expect(tile.sharedResources).toEqual(sharedResources);
    expect(tile.materialDefinition?.alphaMode).toBe('blend');
    expect(tile.materialDefinition?.doubleSided).toBe(true);
    expect(tile.materialDefinition?.pbrMetallicRoughness.baseColorFactor).toEqual([
      51, 102, 153, 191.25
    ]);
    expect(getLegacyMaterialDefinition(undefined)).toBeUndefined();
  });
});
