// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  GLTFSchema,
  GLTFKHRMaterialsVariantsSchema,
  GLTFKHRMaterialsVariantsPrimitiveSchema,
  GLTFEXTMeshGPUInstancingSchema,
  GLTFKHRAnimationPointerSchema,
  GLTFKHRNodeVisibilitySchema,
  GLTFKHRNodeSelectabilitySchema,
  GLTFKHRNodeHoverabilitySchema,
  GLTFKHRXMPJSONLDSchema,
  GLTFKHRAudioEmitterExtensionSchema,
  GLTFMPEGAudioSpatialSchema,
  getMaterialVariantMappings,
  getMeshInstances,
  getXMPMetadata,
  type GLTF,
  type GLTF_KHR_materials_variants,
  type GLTF_EXT_mesh_gpu_instancing,
  type GLTF_KHR_animation_pointer
} from '@loaders.gl/scene/gltf';
import {GLTFNodeExtensionsSchema} from '@loaders.gl/scene/gltf/schema';

/** Creates a small glTF document combining supported extension attachment locations. */
function createDocument(): GLTF {
  const variants: GLTF_KHR_materials_variants = {variants: [{name: 'Blue', custom: 1}]};
  const instances: GLTF_EXT_mesh_gpu_instancing = {attributes: {TRANSLATION: 0, _ID: 1}};
  const pointer: GLTF_KHR_animation_pointer = {
    pointer: '/materials/0/pbrMetallicRoughness/baseColorFactor'
  };
  return {
    asset: {version: '2.0', extensions: {KHR_xmp_json_ld: {packet: 0}}},
    extensions: {
      KHR_materials_variants: variants,
      KHR_xmp_json_ld: {
        packets: [{'@context': {dc: 'https://example.invalid/ns'}, 'dc:creator': 'Creator'}]
      },
      FUTURE_extension: {data: [1, 2]}
    },
    materials: [{name: 'Blue'}],
    accessors: [
      {componentType: 5126, type: 'VEC3', count: 2},
      {componentType: 5123, type: 'SCALAR', count: 2}
    ],
    meshes: [
      {
        primitives: [
          {
            attributes: {},
            extensions: {
              KHR_materials_variants: {
                mappings: [{material: 0, variants: [0], customMapping: true}]
              }
            }
          }
        ]
      }
    ],
    nodes: [
      {
        mesh: 0,
        extensions: {
          EXT_mesh_gpu_instancing: instances,
          KHR_node_visibility: {visible: false, customFlag: 1},
          KHR_node_selectability: {},
          KHR_node_hoverability: {hoverable: false},
          KHR_xmp_json_ld: {packet: 0},
          FUTURE_node: {opaque: true}
        }
      }
    ],
    animations: [
      {
        channels: [
          {sampler: 0, target: {path: 'pointer', extensions: {KHR_animation_pointer: pointer}}}
        ],
        samplers: [{input: 0, output: 1}]
      }
    ]
  };
}

describe('permissive glTF extension schemas', () => {
  test('validates known extensions in GLTFSchema while preserving all unknown fields', () => {
    const document = createDocument();
    const original = structuredClone(document);
    expect(GLTFSchema.parse(document)).toEqual(original);
    expect(document).toEqual(original);
    expect(GLTFNodeExtensionsSchema.parse(document.nodes![0].extensions)).toEqual(
      document.nodes![0].extensions
    );
  });

  test.each([
    [GLTFKHRMaterialsVariantsSchema, {variants: [{name: 'Variant', future: 1}]}],
    [
      GLTFKHRMaterialsVariantsPrimitiveSchema,
      {mappings: [{material: 0, variants: [0], future: true}]}
    ],
    [GLTFEXTMeshGPUInstancingSchema, {attributes: {_CUSTOM: 1, TRANSLATION: 0}}],
    [GLTFKHRAnimationPointerSchema, {pointer: '/extensions/FUTURE_extension/value'}],
    [GLTFKHRNodeVisibilitySchema, {}],
    [GLTFKHRNodeSelectabilitySchema, {}],
    [GLTFKHRNodeHoverabilitySchema, {}],
    [
      GLTFKHRXMPJSONLDSchema,
      {packets: [{'@context': {custom: {nested: true}}, 'custom:value': [1, 2]}]}
    ],
    [
      GLTFKHRAudioEmitterExtensionSchema,
      {
        sources: [{future: 1}],
        emitters: [{type: 'futureKind', positional: {distanceModel: 'futureModel'}}]
      }
    ],
    [
      GLTFMPEGAudioSpatialSchema,
      {
        sources: [
          {
            id: -1,
            type: 'futureKind',
            accessors: [0],
            attenuation: 'futureFunction',
            reverbFeed: [-2]
          }
        ]
      }
    ]
  ])('retains unknown properties without inserting defaults (%#)', (schema, fields) => {
    const value = {
      ...fields,
      extensions: {FUTURE_nested: {opaque: true}},
      extras: {tag: 'test'},
      futureProperty: {value: 1}
    };
    expect(schema.parse(value)).toEqual(value);
  });

  test.each([
    [GLTFKHRMaterialsVariantsSchema, {variants: [{name: 1}]}],
    [GLTFKHRMaterialsVariantsPrimitiveSchema, {mappings: [{material: -1, variants: [0]}]}],
    [GLTFEXTMeshGPUInstancingSchema, {attributes: {_ID: 0.5}}],
    [GLTFKHRAnimationPointerSchema, {pointer: 1}],
    [GLTFKHRNodeVisibilitySchema, {visible: 1}],
    [GLTFKHRNodeSelectabilitySchema, {selectable: 'false'}],
    [GLTFKHRNodeHoverabilitySchema, {hoverable: null}],
    [GLTFKHRXMPJSONLDSchema, {packets: [{'@context': 1}]}],
    [GLTFKHRAudioEmitterExtensionSchema, {sources: [{audio: -1}]}],
    [GLTFMPEGAudioSpatialSchema, {sources: [{id: 0, type: 'Object', accessors: []}]}]
  ])('rejects malformed known fields (%#)', (schema, value) => {
    expect(schema.safeParse(value).success).toBe(false);
  });

  test('uses attachment-specific schemas for audio and material variants', () => {
    const document = createDocument();
    document.extensions!.KHR_audio_emitter = {emitters: [{type: 'global'}]};
    document.nodes![0].extensions!.KHR_audio_emitter = {emitters: [0]};
    document.scenes = [{extensions: {KHR_audio_emitter: {emitters: [0]}}}];
    expect(GLTFSchema.parse(document)).toEqual(document);
    document.nodes![0].extensions!.KHR_audio_emitter = {emitters: [-1]};
    const result = GLTFSchema.safeParse(document);
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0].path).toEqual([
        'nodes',
        0,
        'extensions',
        'KHR_audio_emitter',
        'emitters',
        0
      ]);
  });
});

describe('glTF extension data helpers', () => {
  test('distinguishes raw documents with a custom json property from loader results', () => {
    const document = {...createDocument(), json: {applicationData: true}};
    const wrapped = {json: document, buffers: []};
    expect(getMaterialVariantMappings(document)).toEqual(getMaterialVariantMappings(wrapped));
    expect(getMaterialVariantMappings(document)).toHaveLength(1);
    expect(getMeshInstances(document)).toEqual(getMeshInstances(wrapped));
    expect(getMeshInstances(document)).toHaveLength(1);
    expect(getXMPMetadata(document, document.asset)).toBe(
      document.extensions!.KHR_xmp_json_ld!.packets[0]
    );
    expect(getXMPMetadata(wrapped, document.asset)).toBe(getXMPMetadata(document, document.asset));
  });

  test('resolves material variants without applying a choice or changing source JSON', () => {
    const document = createDocument();
    const original = structuredClone(document);
    const mappings = getMaterialVariantMappings({json: document, buffers: []});
    expect(mappings).toHaveLength(1);
    expect(mappings[0].material).toBe(document.materials![0]);
    expect(mappings[0].variants).toEqual([{name: 'Blue', custom: 1}]);
    expect(mappings[0]).toMatchObject({meshIndex: 0, primitiveIndex: 0});
    expect(document).toEqual(original);
    document.meshes![0].primitives[0].extensions!.KHR_materials_variants!.mappings[0].variants = [
      1
    ];
    expect(() => getMaterialVariantMappings(document)).toThrow('invalid variant');
  });

  test('exposes lazy instance accessors and rejects unequal counts or missing meshes', () => {
    const document = createDocument();
    const descriptors = getMeshInstances(document);
    expect(descriptors[0]).toMatchObject({
      nodeIndex: 0,
      meshIndex: 0,
      count: 2,
      attributes: {TRANSLATION: 0, _ID: 1}
    });
    expect(descriptors[0].accessors._ID).toBe(document.accessors![1]);
    document.accessors![1].count = 3;
    expect(() => getMeshInstances(document)).toThrow('counts must match');
    document.nodes![0].mesh = undefined;
    expect(() => getMeshInstances(document)).toThrow('invalid instanced mesh');
  });

  test('resolves shared XMP metadata without interpreting or fetching namespace URLs', () => {
    const document = createDocument();
    const packet = getXMPMetadata(document, document.asset);
    expect(packet).toBe(document.extensions!.KHR_xmp_json_ld!.packets[0]);
    expect(getXMPMetadata(document, document.nodes![0])).toBe(packet);
    expect(getXMPMetadata(document, {})).toBeUndefined();
    expect(() => getXMPMetadata(document, {extensions: {KHR_xmp_json_ld: {packet: 3}}})).toThrow(
      'invalid XMP packet'
    );
  });

  test('returns no descriptors for documents without these extensions', () => {
    const document: GLTF = {
      asset: {version: '2.0'},
      nodes: [{}],
      meshes: [{primitives: [{attributes: {}}]}]
    };
    expect(getMeshInstances(document)).toEqual([]);
    expect(getMaterialVariantMappings(document)).toEqual([]);
  });
});
