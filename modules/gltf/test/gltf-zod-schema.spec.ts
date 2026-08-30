// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  GLTFSchema,
  GLTFEXTMeshoptCompressionSchema,
  GLTFKHRMeshoptCompressionSchema
} from '@loaders.gl/gltf';
import {
  GLTF1Schema,
  GLTF2Schema,
  GLTF21Schema,
  GLTFVersionSchema,
  GLTF1ExtensionSchemas,
  GLTF2ExtensionSchemas
} from '@loaders.gl/gltf/schema';
import {describe, expect, it} from 'vitest';

describe('GLTFSchema', () => {
  it('validates each supported glTF version', () => {
    const gltf1 = {asset: {version: '1.0'}};
    const gltf2 = {asset: {version: '2.0'}};
    const gltf21 = {asset: {version: '2.1'}};

    expect(GLTF1Schema.safeParse(gltf1).success).toBe(true);
    expect(GLTF2Schema.safeParse(gltf2).success).toBe(true);
    expect(GLTF21Schema.safeParse(gltf21).success).toBe(true);
    expect(GLTF1Schema.safeParse(gltf2).success).toBe(false);
    expect(GLTF2Schema.safeParse(gltf21).success).toBe(false);
    expect(GLTF21Schema.safeParse(gltf2).success).toBe(false);
    expect(GLTFVersionSchema.safeParse(gltf1).success).toBe(true);
    expect(GLTFVersionSchema.safeParse(gltf2).success).toBe(true);
    expect(GLTFVersionSchema.safeParse(gltf21).success).toBe(true);
  });

  it('exports every official extension schema group', () => {
    const extensionStatuses = [
      ...Object.values(GLTF1ExtensionSchemas),
      ...Object.values(GLTF2ExtensionSchemas)
    ];
    const extensionGroups = extensionStatuses.flatMap(status => Object.values(status));
    const extensionFragments = extensionGroups.flatMap(extension => Object.values(extension));

    expect(Object.keys(GLTF1ExtensionSchemas)).toEqual(['Khronos', 'Vendor']);
    expect(Object.keys(GLTF2ExtensionSchemas)).toEqual(['Archived', 'Khronos', 'Vendor']);
    expect(extensionGroups).toHaveLength(63);
    expect(extensionFragments).toHaveLength(119);
    expect(Object.keys(GLTF2ExtensionSchemas.Khronos)).toContain('KHR_lights_punctual');
    expect(Object.keys(GLTF2ExtensionSchemas.Vendor)).toContain('EXT_mesh_gpu_instancing');
  });

  it('preserves constraints unsupported by Zod JSON Schema conversion', () => {
    const perspective = {yfov: 1, znear: 0.1};
    const orthographic = {xmag: 1, ymag: 1, zfar: 100, znear: 0};
    const iesProfileSchema = GLTF2ExtensionSchemas.Vendor.EXT_lights_ies.lightProfile;

    expect(
      GLTF21Schema.safeParse({
        asset: {version: '2.1'},
        cameras: [{type: 'perspective', perspective, orthographic}]
      }).success
    ).toBe(false);
    expect(GLTF21Schema.safeParse({asset: {version: '2.1'}, nodes: [{skin: 0}]}).success).toBe(
      false
    );
    expect(GLTF1Schema.safeParse({asset: {version: '1.0'}, scene: 'default'}).success).toBe(false);
    expect(iesProfileSchema.safeParse({bufferView: 0}).success).toBe(false);
    const validProfile = iesProfileSchema.safeParse({
      bufferView: 0,
      mimeType: 'application/x-ies-lm-63'
    });
    expect(validProfile.success, validProfile.error?.message).toBe(true);
  });

  it('validates a structurally rich glTF 2.1 document through nested official constraints', () => {
    const document = {
      asset: {version: '2.1', generator: 'loaders.gl'},
      buffers: [{byteLength: 128, uri: 'mesh.bin'}],
      bufferViews: [
        {buffer: 0, byteOffset: 0, byteLength: 72, target: 34962},
        {buffer: 0, byteOffset: 72, byteLength: 12, target: 34963}
      ],
      accessors: [
        {
          bufferView: 0,
          componentType: 5126,
          count: 3,
          type: 'VEC3',
          min: [0, 0, 0],
          max: [1, 1, 0]
        },
        {bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR'}
      ],
      images: [{uri: 'texture.png'}],
      samplers: [{magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 33071}],
      textures: [{sampler: 0, source: 0}],
      materials: [
        {
          pbrMetallicRoughness: {
            baseColorFactor: [1, 0.5, 0.25, 1],
            baseColorTexture: {index: 0, texCoord: 0},
            metallicFactor: 0.2,
            roughnessFactor: 0.8
          },
          alphaMode: 'BLEND',
          doubleSided: true
        }
      ],
      meshes: [{primitives: [{attributes: {POSITION: 0}, indices: 1, material: 0, mode: 4}]}],
      cameras: [{type: 'perspective', perspective: {yfov: 1, znear: 0.1, zfar: 100}}],
      animations: [
        {
          channels: [{sampler: 0, target: {node: 0, path: 'translation'}}],
          samplers: [{input: 1, output: 0, interpolation: 'LINEAR'}]
        }
      ],
      scenes: [{nodes: [0]}],
      scene: 0,
      extensionsUsed: ['EXT_mesh_gpu_instancing'],
      extensionsRequired: ['EXT_mesh_gpu_instancing'],
      extras: {owner: 'coverage'}
    };

    const result = GLTF21Schema.safeParse(document);
    expect(result.success, result.error?.message).toBe(true);
  });

  it('rejects nested exclusive, dependency, and conditional violations', () => {
    const asset = {version: '2.1'};
    const invalidDocuments = [
      {asset, nodes: [{matrix: new Array(16).fill(0), translation: [0, 0, 0]}]},
      {asset, nodes: [{skin: 0}], skins: [{joints: [0]}]},
      {asset, images: [{uri: 'image.png', bufferView: 0, mimeType: 'image/png'}]},
      {
        asset,
        accessors: [
          {
            componentType: 5126,
            count: 1,
            type: 'SCALAR',
            sparse: {count: 1, indices: {componentType: 5123}, values: {}}
          }
        ]
      }
    ];
    for (const document of invalidDocuments) {
      expect(GLTF21Schema.safeParse(document).success, JSON.stringify(document)).toBe(false);
    }
  });

  it('accepts a glTF document and preserves extension properties', () => {
    const document = {
      asset: {version: '2.0'},
      extensionsUsed: ['EXT_meshopt_compression'],
      extensions: {EXT_example: {enabled: true}},
      customProperty: 'preserved'
    };

    expect(GLTFSchema.parse(document)).toEqual(document);
  });

  it('rejects malformed core properties', () => {
    expect(GLTFSchema.safeParse({asset: {version: 2}}).success).toBe(false);
    expect(GLTFSchema.safeParse({asset: {version: '2.0'}, scene: -1}).success).toBe(false);
  });

  it('validates draft glTF 2.1 external asset references', () => {
    const asset = {version: '2.1'};

    expect(
      GLTFSchema.safeParse({
        asset,
        externalAssets: [{file: 0}],
        nodes: [{externalAsset: 0}]
      }).success
    ).toBe(true);
    expect(GLTFSchema.safeParse({asset, externalAssets: {file: 0}}).success).toBe(false);
    expect(GLTFSchema.safeParse({asset, externalAssets: [{file: '0'}]}).success).toBe(false);
    expect(GLTFSchema.safeParse({asset, nodes: [{externalAsset: '0'}]}).success).toBe(false);
  });

  it('validates draft glTF 2.1 thumbnail references', () => {
    expect(
      GLTFSchema.safeParse({
        asset: {version: '2.1', thumbnail: 0},
        images: [{uri: 'thumbnail.png'}]
      }).success
    ).toBe(true);
    expect(GLTFSchema.safeParse({asset: {version: '2.1', thumbnail: -1}}).success).toBe(false);
    expect(GLTFSchema.safeParse({asset: {version: '2.1', thumbnail: 0.5}}).success).toBe(false);
  });

  it('accepts extension-defined animation target paths', () => {
    const document = {
      asset: {version: '2.0'},
      animations: [
        {
          channels: [{sampler: 0, target: {path: 'pointer'}}],
          samplers: [{input: 0, output: 1}]
        }
      ]
    };

    expect(GLTFSchema.safeParse(document).success).toBe(true);
  });

  it('requires the camera projection matching its type', () => {
    const asset = {version: '2.0'};
    const perspective = {yfov: 1, znear: 0.1};
    const orthographic = {xmag: 1, ymag: 1, zfar: 100, znear: 0};

    expect(
      GLTFSchema.safeParse({asset, cameras: [{type: 'perspective', perspective}]}).success
    ).toBe(true);
    expect(GLTFSchema.safeParse({asset, cameras: [{type: 'perspective'}]}).success).toBe(false);
    expect(
      GLTFSchema.safeParse({
        asset,
        cameras: [{type: 'perspective', perspective, orthographic}]
      }).success
    ).toBe(false);
  });

  it('requires exactly one valid image source', () => {
    const asset = {version: '2.0'};

    expect(GLTFSchema.safeParse({asset, images: [{uri: 'image.png'}]}).success).toBe(true);
    expect(
      GLTFSchema.safeParse({asset, images: [{bufferView: 0, mimeType: 'image/png'}]}).success
    ).toBe(true);
    expect(GLTFSchema.safeParse({asset, images: [{}]}).success).toBe(false);
    expect(GLTFSchema.safeParse({asset, images: [{bufferView: 0}]}).success).toBe(false);
    expect(
      GLTFSchema.safeParse({
        asset,
        images: [{uri: 'image.png', bufferView: 0, mimeType: 'image/png'}]
      }).success
    ).toBe(false);
  });
});

describe('meshopt compression extension schemas', () => {
  const extension = {
    buffer: 0,
    byteLength: 64,
    byteStride: 4,
    count: 16,
    mode: 'ATTRIBUTES',
    filter: 'COLOR'
  };

  it('accepts the KHR COLOR filter', () => {
    expect(GLTFKHRMeshoptCompressionSchema.safeParse(extension).success).toBe(true);
  });

  it('keeps COLOR out of the EXT extension schema', () => {
    expect(GLTFEXTMeshoptCompressionSchema.safeParse(extension).success).toBe(false);
  });
});
