// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTF} from '../types/gltf-types';
import type {GLTFMaterial, GLTFTextureInfo} from '../types/gltf-json-schema';

const COMMON_MATERIAL_EXTENSION = 'KHR_materials_common';
const UNLIT_MATERIAL_EXTENSION = 'KHR_materials_unlit';

/** Legacy programmable material properties retained as provenance after conversion. */
type LegacyMaterial = GLTFMaterial & {
  /** Optional fallback technique identifier. */
  technique?: unknown;
  /** Fallback shader uniform values. */
  values?: unknown;
};

/** A validated legacy color or resolved texture, expressed without changing image bytes. */
type MaterialValue = {
  /** RGBA color, or a white multiplier for texture-only values. */
  readonly factor: number[];
  /** Resolved texture using the default coordinate set. */
  readonly texture?: GLTFTextureInfo;
};

/** Convert conventional and common materials, returning overridden fallback technique IDs. */
export function convertGLTFV1Materials(
  json: GLTF,
  reportUnsupported: (feature: string) => void,
  reportNote: (message: string) => void
): Set<string> {
  const fallbackTechniques = new Set<string>();
  const commonRequired = json.extensionsRequired?.includes(COMMON_MATERIAL_EXTENSION) || false;
  for (const [materialIndex, material] of (json.materials || []).entries()) {
    const legacyMaterial = material as LegacyMaterial;
    const common = material.extensions?.[COMMON_MATERIAL_EXTENSION] as unknown;
    if (common === undefined) {
      convertConventionalMaterial(legacyMaterial, json, reportUnsupported, reportNote);
      continue;
    }
    preserveMaterialSource(legacyMaterial, common);
    const label = `material ${materialIndex}`;
    if (
      !isRecord(common) ||
      typeof common.technique !== 'string' ||
      !['CONSTANT', 'LAMBERT', 'PHONG', 'BLINN'].includes(common.technique)
    ) {
      reportUnsupported(`${label} unknown ${COMMON_MATERIAL_EXTENSION} technique`);
      continue;
    }
    if (common.values !== undefined && !isRecord(common.values)) {
      reportUnsupported(`${label} common material values must be an object`);
      continue;
    }
    const values = (common.values || {}) as Record<string, unknown>;
    const unknownFields = Object.keys(common).filter(
      field => !['technique', 'values', 'doubleSided', 'transparent', 'jointCount'].includes(field)
    );
    const unknownValues = Object.keys(values).filter(
      field =>
        ![
          'ambient',
          'diffuse',
          'emission',
          'specular',
          'shininess',
          'transparency',
          'doubleSided',
          'transparent'
        ].includes(field)
    );
    if (unknownFields.length || unknownValues.length)
      reportUnsupported(
        `${label} unrecognized common material fields ${[...unknownFields, ...unknownValues].join(', ')}`
      );
    if (
      common.jointCount !== undefined &&
      (!Number.isSafeInteger(common.jointCount) || Number(common.jointCount) < 0)
    )
      reportUnsupported(`${label} invalid common material jointCount`);
    const emission = readMaterialValue(
      values.emission,
      json,
      `${label} emission`,
      reportUnsupported
    );
    const constant = common.technique === 'CONSTANT';
    const diffuse = constant
      ? emission
      : readMaterialValue(values.diffuse, json, `${label} diffuse`, reportUnsupported);
    const opacity = values.transparency === undefined ? 1 : values.transparency;
    const validOpacity =
      typeof opacity === 'number' && Number.isFinite(opacity) && opacity >= 0 && opacity <= 1;
    if (!validOpacity) reportUnsupported(`${label} common material transparency must be in [0, 1]`);
    const transparent = readCommonFlag(common, values, 'transparent', label, reportUnsupported);
    const doubleSided = readCommonFlag(common, values, 'doubleSided', label, reportUnsupported);
    if (values.ambient !== undefined && !isBlackColor(values.ambient))
      reportUnsupported(`${label} ambient lighting`);
    if (['PHONG', 'BLINN'].includes(String(common.technique))) {
      if (values.specular !== undefined && !isBlackColor(values.specular))
        reportUnsupported(`${label} specular/shininess lighting`);
      if (
        values.shininess !== undefined &&
        (typeof values.shininess !== 'number' ||
          !Number.isFinite(values.shininess) ||
          values.shininess < 0)
      )
        reportUnsupported(`${label} invalid common material shininess`);
    }
    material.pbrMetallicRoughness ||= {};
    const physicallyBasedMaterial = material.pbrMetallicRoughness;
    physicallyBasedMaterial.metallicFactor ??= 0;
    physicallyBasedMaterial.roughnessFactor ??= 1;
    if (diffuse) {
      const factor = [...diffuse.factor];
      factor[3] *= validOpacity ? opacity : 1;
      physicallyBasedMaterial.baseColorFactor ??= factor;
      if (diffuse.texture) physicallyBasedMaterial.baseColorTexture ??= diffuse.texture;
    }
    material.doubleSided ??= doubleSided;
    material.alphaMode ??= transparent ? 'BLEND' : 'OPAQUE';
    if (constant) {
      material.extensions![UNLIT_MATERIAL_EXTENSION] ??= {};
      declareExtension(json, UNLIT_MATERIAL_EXTENSION, commonRequired);
      reportNote(`Converted ${label} CONSTANT emission to an unlit material.`);
    } else {
      if (emission) {
        material.emissiveFactor ??= emission.factor.slice(0, 3);
        if (emission.texture) material.emissiveTexture ??= emission.texture;
      }
      reportNote(
        `Approximated ${label} ${String(common.technique)} lighting with rough non-metallic PBR factors.`
      );
    }
    if (typeof legacyMaterial.technique === 'string')
      fallbackTechniques.add(legacyMaterial.technique);
    else if (legacyMaterial.technique !== undefined)
      reportUnsupported(`${label} invalid fallback technique ID`);
    delete legacyMaterial.technique;
    delete legacyMaterial.values;
    delete material.extensions![COMMON_MATERIAL_EXTENSION];
    if (!Object.keys(material.extensions!).length) delete material.extensions;
  }
  const remaining = collectExtensionNames(json);
  if (
    json.extensions?.[COMMON_MATERIAL_EXTENSION] !== undefined ||
    (json.nodes || []).some(node => node.extensions?.[COMMON_MATERIAL_EXTENSION] !== undefined)
  )
    reportUnsupported(`${COMMON_MATERIAL_EXTENSION} lights or scene payloads`);
  if (!remaining.has(COMMON_MATERIAL_EXTENSION)) {
    json.extensionsUsed = json.extensionsUsed?.filter(
      extension => extension !== COMMON_MATERIAL_EXTENSION
    );
    json.extensionsRequired = json.extensionsRequired?.filter(
      extension => extension !== COMMON_MATERIAL_EXTENSION
    );
  }
  return fallbackTechniques;
}

/** Recognize resources overridden by converted common materials, without claiming shader translation. */
export function canPreserveGLTFV1MaterialFallbacks(
  json: GLTF,
  fallbackTechniques: Set<string>
): boolean {
  if (
    !fallbackTechniques.size ||
    [...collectExtensionNames(json)].some(
      extension => ![COMMON_MATERIAL_EXTENSION, UNLIT_MATERIAL_EXTENSION].includes(extension)
    )
  )
    return false;
  if (
    (json.materials || []).some(
      material =>
        (material as LegacyMaterial).technique !== undefined ||
        (material as LegacyMaterial).values !== undefined
    )
  )
    return false;
  const legacyJson = json as unknown as Record<string, unknown>;
  if (
    ['techniques', 'programs', 'shaders'].some(
      collection => legacyJson[collection] !== undefined && !isRecord(legacyJson[collection])
    )
  )
    return false;
  const techniques = isRecord(legacyJson.techniques) ? legacyJson.techniques : {};
  const programs = isRecord(legacyJson.programs) ? legacyJson.programs : {};
  const shaders = isRecord(legacyJson.shaders) ? legacyJson.shaders : {};
  const coveredPrograms = new Set<string>();
  const coveredShaders = new Set<string>();
  if (Object.keys(techniques).some(identifier => !fallbackTechniques.has(identifier))) return false;
  for (const technique of Object.values(techniques))
    if (isRecord(technique) && typeof technique.program === 'string')
      coveredPrograms.add(technique.program);
  if (Object.keys(programs).some(identifier => !coveredPrograms.has(identifier))) return false;
  for (const program of Object.values(programs))
    if (isRecord(program))
      for (const field of ['vertexShader', 'fragmentShader'])
        if (typeof program[field] === 'string') coveredShaders.add(program[field]);
  return Object.keys(shaders).every(identifier => coveredShaders.has(identifier));
}

/** Preserve the existing conventional uniform heuristic for programmable materials. */
function convertConventionalMaterial(
  material: LegacyMaterial,
  json: GLTF,
  reportUnsupported: (feature: string) => void,
  reportNote: (message: string) => void
): void {
  preserveMaterialSource(material);
  const values = isRecord(material.values) ? material.values : {};
  const textureIdentifier = values.tex || values.texture2d_0 || values.diffuseTex || values.diffuse;
  const textureIndex = findTextureIndex(json, textureIdentifier);
  const diffuseColor = isUnitColorFactor(values.diffuse) ? values.diffuse : undefined;
  if (textureIndex !== -1 || diffuseColor) {
    const factor = diffuseColor ? [...diffuseColor] : [1, 1, 1, 1];
    const transparency = values.transparency;
    if (typeof transparency === 'number' && transparency >= 0 && transparency <= 1)
      factor[3] *= transparency;
    material.pbrMetallicRoughness ||= {};
    material.pbrMetallicRoughness.metallicFactor ??= 0;
    material.pbrMetallicRoughness.roughnessFactor ??= 1;
    material.pbrMetallicRoughness.baseColorFactor ??= factor;
    if (textureIndex !== -1)
      material.pbrMetallicRoughness.baseColorTexture ??= {index: textureIndex};
    if (material.pbrMetallicRoughness.baseColorFactor[3] < 1) material.alphaMode ||= 'BLEND';
    reportNote('Approximated glTF v1 diffuse material values with PBR material factors.');
  }
  if (material.technique || material.values)
    reportUnsupported(`material technique ${material.technique || '<unnamed>'}`);
}

/** Resolve a common color/texture, using its specified black default rather than inventing a diffuse value. */
function readMaterialValue(
  value: unknown,
  json: GLTF,
  label: string,
  reportUnsupported: (feature: string) => void
): MaterialValue | null {
  if (value === undefined) return {factor: [0, 0, 0, 1]};
  if (isUnitColorFactor(value)) return {factor: [...value]};
  const textureIndex = findTextureIndex(json, value);
  if (textureIndex !== -1) return {factor: [1, 1, 1, 1], texture: {index: textureIndex}};
  reportUnsupported(`${label} requires an RGBA factor in [0, 1] or a resolved texture ID`);
  return null;
}

/** Resolve string texture IDs retained during dictionary-to-array conversion. */
function findTextureIndex(json: GLTF, value: unknown): number {
  if (typeof value !== 'string') return -1;
  return (json.textures || []).findIndex(
    texture => (texture as unknown as {id?: string}).id === value
  );
}

/** Accept common flags in values or the exporter-style extension location, diagnosing conflicts. */
function readCommonFlag(
  common: Record<string, unknown>,
  values: Record<string, unknown>,
  field: string,
  label: string,
  reportUnsupported: (feature: string) => void
): boolean {
  if (common[field] !== undefined && values[field] !== undefined && common[field] !== values[field])
    reportUnsupported(`${label} conflicting common material ${field}`);
  const value =
    values[field] !== undefined
      ? values[field]
      : common[field] !== undefined
        ? common[field]
        : false;
  if (typeof value === 'boolean') return value;
  reportUnsupported(`${label} common material ${field} must be boolean`);
  return false;
}

/** Retain caller extras and previous provenance alongside all source material values. */
function preserveMaterialSource(material: LegacyMaterial, common?: unknown): void {
  const extras: Record<string, unknown> = isRecord(material.extras)
    ? material.extras
    : material.extras === undefined
      ? {}
      : {originalExtras: material.extras};
  const previous = isRecord(extras.gltf1)
    ? extras.gltf1
    : extras.gltf1 === undefined
      ? {}
      : {originalExtras: extras.gltf1};
  const source = {
    technique: material.technique,
    values: material.values,
    ...(common === undefined ? {} : {commonMaterial: common})
  };
  const conflicting = Object.keys(source).some(field => Object.hasOwn(previous, field));
  material.extras = {
    ...extras,
    gltf1: {...previous, ...source, ...(conflicting ? {originalExtras: previous} : {})}
  };
}

/** Add accurate, duplicate-free declarations for generated material extensions. */
function declareExtension(json: GLTF, extension: string, required: boolean): void {
  json.extensionsUsed = [...new Set([...(json.extensionsUsed || []), extension])];
  if (required)
    json.extensionsRequired = [...new Set([...(json.extensionsRequired || []), extension])];
}

/** Inventory live extension owners, excluding application extras and copied legacy provenance. */
function collectExtensionNames(value: unknown): Set<string> {
  const names = new Set<string>();
  const pending = [value];
  const visited = new Set<object>();
  while (pending.length) {
    const object = pending.pop();
    if (!object || typeof object !== 'object' || visited.has(object)) continue;
    visited.add(object);
    if (isRecord(object) && isRecord(object.extensions))
      for (const name of Object.keys(object.extensions)) names.add(name);
    for (const [field, child] of Object.entries(object))
      if (field !== 'extras') pending.push(child);
  }
  return names;
}

/** Check finite RGBA factors accepted by core glTF 2 material properties. */
function isUnitColorFactor(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every(
      component =>
        typeof component === 'number' &&
        Number.isFinite(component) &&
        component >= 0 &&
        component <= 1
    )
  );
}

/** Recognize a zero RGB lighting term independently of its unused alpha component. */
function isBlackColor(value: unknown): boolean {
  return isUnitColorFactor(value) && value.slice(0, 3).every(component => component === 0);
}

/** Distinguish JSON objects from scalar and array extras or malformed extension payloads. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
