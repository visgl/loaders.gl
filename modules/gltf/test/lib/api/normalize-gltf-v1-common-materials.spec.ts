// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import {validateString, validateBytes} from 'gltf-validator';
import {parse, encodeSync} from '@loaders.gl/core';
import {convertGLTFV1ToGLTF2, GLTFLoader, GLTFWriter} from '@loaders.gl/gltf';
import type {GLTFWithBuffers} from '../../../src/lib/types/gltf-types';

const COMMON = 'KHR_materials_common';
const UNLIT = 'KHR_materials_unlit';
const IMAGE_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAGUExURf///wAAAFXC034AAAAMSURBVAjXY3BgaAAAAUQAwetZAwkAAAAASUVORK5CYII=';

describe('glTF 1 common materials', () => {
  test.each([
    'LAMBERT',
    'PHONG',
    'BLINN'
  ])('converts diffuse-only %s with explicit approximation notes', technique => {
    const source = createCommonMaterialAsset(technique, {
      diffuse: [0.2, 0.4, 0.6, 1],
      emission: 'texture'
    });
    const original = JSON.stringify(source);
    const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
    const material = converted.json.materials![0];
    expect(material.pbrMetallicRoughness).toEqual({
      baseColorFactor: [0.2, 0.4, 0.6, 1],
      metallicFactor: 0,
      roughnessFactor: 1
    });
    expect(material.emissiveFactor).toEqual([1, 1, 1]);
    expect(material.emissiveTexture).toEqual({index: 0});
    expect(material.extensions).toBeUndefined();
    expect(material.extras.gltf1.commonMaterial.technique).toBe(technique);
    expect(converted.normalizationReport.unsupported).toEqual([]);
    expect(converted.normalizationReport.warnings.join(' ')).toContain(
      `Approximated material 0 ${technique}`
    );
    expect(JSON.stringify(source)).toBe(original);
  });

  test('CONSTANT uses emission rather than diffuse and declares required unlit behavior', () => {
    const converted = convertGLTFV1ToGLTF2(
      createCommonMaterialAsset('CONSTANT', {
        diffuse: [1, 0, 0, 1],
        emission: [0, 0.5, 0, 0.8],
        transparent: true,
        transparency: 0.5,
        doubleSided: true
      }),
      {normalize: 'strict'}
    );
    const material = converted.json.materials![0];
    expect(material.pbrMetallicRoughness?.baseColorFactor).toEqual([0, 0.5, 0, 0.4]);
    expect(material.emissiveFactor).toBeUndefined();
    expect(material.extensions).toEqual({[UNLIT]: {}});
    expect(material.alphaMode).toBe('BLEND');
    expect(material.doubleSided).toBe(true);
    expect(converted.json.extensionsUsed).toEqual([UNLIT]);
    expect(converted.json.extensionsRequired).toEqual([UNLIT]);
  });

  test.each(['CONSTANT', 'LAMBERT'])('retains the black defaults of %s', technique => {
    const converted = convertGLTFV1ToGLTF2(createCommonMaterialAsset(technique, {}));
    const material = converted.json.materials![0];
    expect(material.pbrMetallicRoughness?.baseColorFactor).toEqual([0, 0, 0, 1]);
    expect(material.alphaMode).toBe('OPAQUE');
    expect(material.doubleSided).toBe(false);
  });

  test('resolves diffuse and emission textures without suppressing emission through its default factor', () => {
    const material = convertGLTFV1ToGLTF2(
      createCommonMaterialAsset('LAMBERT', {
        diffuse: 'texture',
        emission: [0.1, 0.2, 0.3, 1]
      })
    ).json.materials![0];
    expect(material.pbrMetallicRoughness?.baseColorTexture).toEqual({index: 0});
    expect(material.pbrMetallicRoughness?.baseColorFactor).toEqual([1, 1, 1, 1]);
    expect(material.emissiveFactor).toEqual([0.1, 0.2, 0.3]);
  });

  test('honors explicit opaque flags and accepts exporter-style flags outside values', () => {
    const source = createCommonMaterialAsset('CONSTANT', {emission: 'texture', transparency: 0.2});
    const common = (source.json.materials as any).material.extensions[COMMON];
    common.transparent = false;
    common.doubleSided = true;
    const material = convertGLTFV1ToGLTF2(source).json.materials![0];
    expect(material.alphaMode).toBe('OPAQUE');
    expect(material.doubleSided).toBe(true);
    expect(material.pbrMetallicRoughness?.baseColorFactor[3]).toBe(0.2);
  });

  test('preserves explicit target material fields and unrelated extensions', () => {
    const source = createCommonMaterialAsset('LAMBERT', {
      diffuse: 'texture',
      emission: 'texture',
      transparent: true,
      doubleSided: true
    });
    const material = (source.json.materials as any).material;
    material.pbrMetallicRoughness = {
      baseColorFactor: [1, 0, 0, 1],
      baseColorTexture: {index: 0, texCoord: 1},
      metallicFactor: 0.7,
      roughnessFactor: 0.3
    };
    material.emissiveFactor = [0.5, 0, 0];
    material.emissiveTexture = {index: 0, texCoord: 1};
    material.alphaMode = 'MASK';
    material.doubleSided = false;
    material.extensions.EXT_custom = {value: 1};
    const converted = convertGLTFV1ToGLTF2(source).json.materials![0];
    expect(converted.pbrMetallicRoughness).toEqual(material.pbrMetallicRoughness);
    expect(converted.emissiveFactor).toEqual([0.5, 0, 0]);
    expect(converted.emissiveTexture).toEqual({index: 0, texCoord: 1});
    expect(converted.alphaMode).toBe('MASK');
    expect(converted.doubleSided).toBe(false);
    expect(converted.extensions).toEqual({EXT_custom: {value: 1}});
  });

  test.each([
    {ambient: [0.1, 0, 0, 1]},
    {ambient: 'texture'},
    {specular: [1, 1, 1, 1]},
    {specular: 'texture'},
    {shininess: -1},
    {diffuse: 'missing'},
    {diffuse: [1, 1, 1]},
    {emission: [1, 1, 1, 2]},
    {transparency: -1},
    {transparency: null},
    {transparent: null},
    {doubleSided: 'yes'},
    {unknownValue: 1}
  ])('reports unsupported or malformed common values %j and rejects them in strict mode', values => {
    const source = createCommonMaterialAsset('PHONG', values);
    const converted = convertGLTFV1ToGLTF2(source);
    expect(converted.normalizationReport.unsupported.length).toBeGreaterThan(0);
    expect(converted.json.materials![0].extras.gltf1.commonMaterial.values).toEqual(values);
    expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow('does not support');
  });

  test.each([
    null,
    {technique: 'TOON'},
    {technique: 'LAMBERT', values: []}
  ])('retains unknown or malformed common payload %j', common => {
    const source = createCommonMaterialAsset('LAMBERT', {});
    (source.json.materials as any).material.extensions[COMMON] = common;
    const converted = convertGLTFV1ToGLTF2(source);
    expect(converted.json.materials![0].extensions?.[COMMON]).toEqual(common);
    expect(converted.json.extensionsRequired).toContain(COMMON);
    expect(converted.normalizationReport.unsupported.length).toBeGreaterThan(0);
  });

  test.each([
    {jointCount: -1},
    {unknownField: 1},
    {transparent: true}
  ])('diagnoses extension fields or conflicting flags %j', fields => {
    const source = createCommonMaterialAsset('CONSTANT', {transparent: false});
    Object.assign((source.json.materials as any).material.extensions[COMMON], fields);
    expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow('does not support');
  });

  test('preserves scalar extras and conflicting prior provenance', () => {
    const source = createCommonMaterialAsset('CONSTANT', {});
    (source.json.materials as any).material.extras = 7;
    expect(convertGLTFV1ToGLTF2(source).json.materials![0].extras.originalExtras).toBe(7);
    (source.json.materials as any).material.extras = {
      application: true,
      gltf1: {commonMaterial: 'previous'}
    };
    const extras = convertGLTFV1ToGLTF2(source).json.materials![0].extras;
    expect(extras.application).toBe(true);
    expect(extras.gltf1.originalExtras.commonMaterial).toBe('previous');
    expect(extras.gltf1.commonMaterial.technique).toBe('CONSTANT');
  });

  test('preserves converted fallback resources without claiming arbitrary shader translation', () => {
    const source = createCommonMaterialAsset('CONSTANT', {emission: [0.5, 0.5, 0.5, 1]});
    addFallbackResources(source);
    const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
    expect(converted.json.extras.gltf1Resources).toEqual({
      techniques: (source.json as any).techniques,
      programs: (source.json as any).programs,
      shaders: (source.json as any).shaders
    });
    expect((converted.json.materials![0] as any).technique).toBeUndefined();
    expect((converted.json.materials![0] as any).values).toBeUndefined();
    expect(converted.normalizationReport.unsupported).toEqual([]);
    expect(converted.normalizationReport.warnings.join(' ')).toContain(
      'overridden by converted common materials'
    );
  });

  test.each([
    'unused technique',
    'unused program',
    'unused shader',
    'opaque extension',
    'shared legacy material',
    'malformed resource'
  ])('does not silently ignore %s', feature => {
    const source = createCommonMaterialAsset('CONSTANT', {});
    addFallbackResources(source);
    const json = source.json as any;
    if (feature === 'unused technique') json.techniques.other = {program: 'program'};
    if (feature === 'unused program')
      json.programs.other = {vertexShader: 'vertex', fragmentShader: 'fragment'};
    if (feature === 'unused shader') json.shaders.other = {uri: 'data:text/plain,unused'};
    if (feature === 'opaque extension') json.extensions = {EXT_unknown: {program: 'program'}};
    if (feature === 'shared legacy material') json.materials.legacy = {technique: 'fallback'};
    if (feature === 'malformed resource') json.shaders = [];
    expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow('does not support');
  });

  test('retains unresolved lights and common declarations while generating unlit declarations', () => {
    const source = createCommonMaterialAsset('CONSTANT', {});
    source.json.extensions = {[COMMON]: {lights: {light: {type: 'ambient'}}}};
    source.json.nodes = {lightNode: {extensions: {[COMMON]: {light: 'light'}}}} as any;
    const converted = convertGLTFV1ToGLTF2(source);
    expect(converted.json.extensions).toEqual(source.json.extensions);
    expect(converted.json.extensionsUsed).toEqual([COMMON, UNLIT]);
    expect(converted.json.extensionsRequired).toEqual([COMMON, UNLIT]);
    expect(converted.normalizationReport.unsupported).toContain(
      `${COMMON} lights or scene payloads`
    );
  });

  test('keeps generated unlit optional when the legacy common extension was optional', () => {
    const source = createCommonMaterialAsset('CONSTANT', {});
    delete source.json.extensionsRequired;
    source.json.extensionsUsed!.push(UNLIT);
    const converted = convertGLTFV1ToGLTF2(source);
    expect(converted.json.extensionsUsed).toEqual([UNLIT]);
    expect(converted.json.extensionsRequired).toBeUndefined();
  });

  test('invokes the caller probe-compatible logger for assumptions and unsupported lighting', () => {
    const emitWarning = vi.fn();
    const logger = {log: vi.fn(() => vi.fn()), warn: vi.fn(() => emitWarning)};
    const converted = convertGLTFV1ToGLTF2(
      createCommonMaterialAsset('PHONG', {specular: [1, 0, 0, 1]}),
      {log: logger}
    );
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('specular/shininess lighting')
    );
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Approximated material 0 PHONG')
    );
    expect(emitWarning).toHaveBeenCalledTimes(
      converted.normalizationReport.unsupported.length +
        converted.normalizationReport.warnings.length -
        1
    );
  });

  test.each([
    'CONSTANT',
    'LAMBERT'
  ])('passes independent Khronos validation for converted %s materials', async technique => {
    const converted = convertGLTFV1ToGLTF2(
      createCommonMaterialAsset(technique, {
        diffuse: 'texture',
        emission: 'texture',
        transparent: true
      }),
      {normalize: 'strict'}
    );
    const report = await validateString(JSON.stringify(converted.json), {
      writeTimestamp: false,
      externalResourceFunction: rejectExternalResource
    });
    expect(report.issues.messages.filter(message => message.severity === 0)).toEqual([]);
    expect(report.issues.numErrors).toBe(0);
  });

  test('loads common materials through GLTFLoader and writes an independently valid GLB 2', async () => {
    const source = createCommonMaterialAsset('CONSTANT', {
      emission: 'texture',
      transparent: true,
      transparency: 0.5
    });
    const parsed = await parse(JSON.stringify(source.json), GLTFLoader, {
      gltf: {loadImages: false, normalize: 'strict'}
    });
    expect(parsed.json.materials![0].pbrMetallicRoughness?.baseColorTexture).toEqual({index: 0});
    const encoded = encodeSync(parsed, GLTFWriter, {gltf: {version: 2}});
    const report = await validateBytes(new Uint8Array(encoded), {
      writeTimestamp: false,
      externalResourceFunction: rejectExternalResource
    });
    expect(report.issues.messages.filter(message => message.severity === 0)).toEqual([]);
    const reparsed = await parse(encoded, GLTFLoader, {gltf: {loadImages: false}});
    expect(reparsed.json.materials![0].pbrMetallicRoughness?.baseColorFactor).toEqual([
      1, 1, 1, 0.5
    ]);
    expect((reparsed.json.materials![0] as any).unlit).toBe(true);
  });
});

/** Create an immutable-by-convention material fixture with a tiny embedded image and no external URLs. */
function createCommonMaterialAsset(
  technique: string,
  values: Record<string, unknown>
): GLTFWithBuffers {
  return {
    json: {
      asset: {version: '1.0'},
      materials: {material: {extensions: {[COMMON]: {technique, values}}}},
      textures: {texture: {source: 'image'}},
      images: {image: {uri: IMAGE_URI}},
      extensionsUsed: [COMMON],
      extensionsRequired: [COMMON]
    },
    buffers: []
  } as unknown as GLTFWithBuffers;
}

/** Add a complete fallback pipeline that common materials may legally override. */
function addFallbackResources(source: GLTFWithBuffers): void {
  const json = source.json as any;
  json.materials.material.technique = 'fallback';
  json.materials.material.values = {uninterpreted: 9};
  json.techniques = {fallback: {program: 'program'}};
  json.programs = {program: {vertexShader: 'vertex', fragmentShader: 'fragment'}};
  json.shaders = {
    vertex: {uri: 'data:text/plain,vertex'},
    fragment: {uri: 'data:text/plain,fragment'}
  };
}

/** Fail immediately if independent validation tries to resolve a non-embedded fixture resource. */
async function rejectExternalResource(uri: string): Promise<Uint8Array> {
  throw new Error(`Unexpected external fixture resource: ${uri}`);
}
