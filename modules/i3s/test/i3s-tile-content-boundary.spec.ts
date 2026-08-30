// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import {parseI3STileContent} from '../src/lib/parsers/parse-i3s-tile-content';

const geometrySchema = {
  store: {
    defaultGeometrySchema: {
      header: [
        {property: 'vertexCount', type: 'UInt32'},
        {property: 'featureCount', type: 'UInt32'}
      ],
      ordering: ['position'],
      vertexAttributes: {position: {valueType: 'Float32', valuesPerElement: 3}},
      featureAttributeOrder: [],
      featureAttributes: {}
    }
  }
} as any;

describe('I3S tile content boundaries', () => {
  test('routes every texture format and material texture slot with raw payloads', async () => {
    const textureFormats = ['jpg', 'png', 'ktx-etc2', 'dds', 'ktx2'] as const;
    const textureSlots = [
      {name: 'base', path: ['pbrMetallicRoughness', 'baseColorTexture']},
      {name: 'metallic', path: ['pbrMetallicRoughness', 'metallicRoughnessTexture']},
      {name: 'normal', path: ['normalTexture']},
      {name: 'occlusion', path: ['occlusionTexture']},
      {name: 'emissive', path: ['emissiveTexture']}
    ] as const;
    const materialDefinition: any = {
      alphaMode: 'mask',
      alphaCutoff: 0,
      emissiveFactor: [255, 128, 0],
      pbrMetallicRoughness: {
        baseColorFactor: [255, 128, 64, 255],
        baseColorTexture: {textureSetDefinitionId: 0, wrapS: 'none'},
        metallicRoughnessTexture: {textureSetDefinitionId: 1, wrapT: 'repeat'}
      },
      normalTexture: {textureSetDefinitionId: 2, wrapS: 'mirror'},
      occlusionTexture: {textureSetDefinitionId: 3},
      emissiveTexture: {textureSetDefinitionId: 4}
    };

    const content = await parseI3STileContent(
      createGeometry(),
      {
        mbs: [0, 0, 0],
        textureUrls: textureFormats.map((textureFormat, textureSetDefinitionId) => ({
          textureSetDefinitionId,
          textureUrl: `/texture-${textureSetDefinitionId}`,
          textureFormat
        })),
        materialDefinition
      } as any,
      geometrySchema,
      {i3s: {decodeTextures: false, token: 'secret', coordinateSystem: 'lnglat-offsets'}} as any,
      createContext()
    );

    expect(content.coordinateSystem).toBe('lnglat-offsets');
    expect(content.material.alphaMode).toBe('MASK');
    expect(content.material.alphaCutoff).toBe(0.25);
    expect(content.material.emissiveFactor).toEqual([1, 128 / 255, 0]);
    expect(content.material.pbrMetallicRoughness.baseColorFactor).toEqual([
      1,
      128 / 255,
      64 / 255,
      1
    ]);
    for (const [textureSetDefinitionId, textureSlot] of textureSlots.entries()) {
      let value: any = content.material;
      for (const pathPart of textureSlot.path) value = value[pathPart];
      expect(value.texture.source.image).toBeInstanceOf(ArrayBuffer);
      expect(content.textures[String(textureSetDefinitionId)]).toBeInstanceOf(ArrayBuffer);
    }
    expect(content.material.pbrMetallicRoughness.baseColorTexture.texture.sampler).toEqual({
      wrapS: 33071,
      wrapT: 10497
    });
  });

  test('routes a legacy singleton texture through every first-compatible slot', async () => {
    const materialDefinitions = [
      {pbrMetallicRoughness: {baseColorTexture: {textureSetDefinitionId: 5}}},
      {emissiveTexture: {textureSetDefinitionId: 6}},
      {pbrMetallicRoughness: {metallicRoughnessTexture: {textureSetDefinitionId: 7}}},
      {normalTexture: {textureSetDefinitionId: 8}},
      {occlusionTexture: {textureSetDefinitionId: 9}}
    ];

    for (const materialDefinition of materialDefinitions) {
      const content = await parseI3STileContent(
        createGeometry(),
        {
          mbs: [0, 0, 0],
          textureUrl: '/legacy-texture',
          textureFormat: 'jpg',
          materialDefinition
        } as any,
        geometrySchema,
        {i3s: {decodeTextures: false}} as any,
        createContext()
      );
      expect(Object.keys(content.textures || {})).toHaveLength(1);
      expect(content.texture).toBeNull();
    }
  });

  test('keeps geometry usable when optional texture requests fail', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const content = await parseI3STileContent(
      createGeometry(),
      {mbs: [0, 0, 0], textureUrl: '/missing', textureFormat: 'png'} as any,
      geometrySchema,
      {i3s: {decodeTextures: false}} as any,
      {
        ...createContext(),
        fetch: async () => new Response(null, {status: 404, statusText: 'Not Found'})
      } as any
    );

    expect(content.vertexCount).toBe(3);
    expect(content.material.pbrMetallicRoughness.baseColorFactor).toEqual([1, 1, 1, 1]);
    expect(warning).toHaveBeenCalledOnce();
    warning.mockRestore();
  });
});

/** Create one triangle using the default uncompressed I3S geometry schema. */
function createGeometry(): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(44);
  const dataView = new DataView(arrayBuffer);
  dataView.setUint32(0, 3, true);
  dataView.setUint32(4, 0, true);
  for (let index = 0; index < 9; index++) {
    dataView.setFloat32(8 + index * 4, index % 3, true);
  }
  return arrayBuffer;
}

/** Create a hermetic loader context for raw texture requests. */
function createContext(): any {
  return {
    fetch: async (url: string) => new Response(new TextEncoder().encode(url).buffer),
    coreApi: {},
    _parse: async () => null
  };
}
