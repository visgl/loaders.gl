// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTF} from '../types/gltf-types';

/** Preserve obsolete fields under extras, reporting rendering semantics that cannot be removed safely. */
export function cleanGLTFV1Fields(json: GLTF, reportUnsupported: (feature: string) => void): void {
  const asset = json.asset as unknown as Record<string, unknown>;
  if (asset.premultipliedAlpha) reportUnsupported('asset premultipliedAlpha rendering');
  preserveLegacyFields(asset, ['profile', 'premultipliedAlpha']);
  for (const [textureIndex, texture] of (json.textures || []).entries()) {
    const legacyTexture = texture as unknown as Record<string, unknown>;
    for (const [field, defaultValue] of Object.entries({
      format: 6408,
      internalFormat: 6408,
      target: 3553,
      type: 5121
    })) {
      if (legacyTexture[field] !== undefined && legacyTexture[field] !== defaultValue) {
        reportUnsupported(`texture ${textureIndex} non-default ${field} rendering`);
      }
    }
    preserveLegacyFields(legacyTexture, ['format', 'internalFormat', 'target', 'type']);
  }
}

/** Move specified source properties without discarding application extras or existing provenance. */
function preserveLegacyFields(object: Record<string, unknown>, fields: string[]): void {
  const legacyFields: Record<string, unknown> = {};
  for (const field of fields)
    if (Object.hasOwn(object, field)) {
      legacyFields[field] = object[field];
      delete object[field];
    }
  if (!Object.keys(legacyFields).length) return;
  const extras = isRecord(object.extras)
    ? object.extras
    : object.extras === undefined
      ? {}
      : {originalExtras: object.extras};
  const provenance = isRecord(extras.gltf1)
    ? extras.gltf1
    : extras.gltf1 === undefined
      ? {}
      : {originalExtras: extras.gltf1};
  const previousFields = isRecord(provenance.legacyFields)
    ? provenance.legacyFields
    : provenance.legacyFields === undefined
      ? {}
      : {originalExtras: provenance.legacyFields};
  const conflictingFields = Object.keys(legacyFields).some(field =>
    Object.hasOwn(previousFields, field)
  );
  object.extras = {
    ...extras,
    gltf1: {
      ...provenance,
      legacyFields: {
        ...previousFields,
        ...legacyFields,
        ...(conflictingFields ? {originalExtras: previousFields} : {})
      }
    }
  };
}

/** JSON extras may be scalar or array values, rather than mergeable objects. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Rename conventional indexed semantics and put application-specific names in their glTF 2 namespace. */
export function convertGLTFV1AttributeName(name: string): string {
  const indexed = /^(JOINTS?|WEIGHTS?|TEXCOORD|COLOR)(?:_(\d+))?$/.exec(name);
  if (indexed) {
    const semantic = indexed[1].startsWith('JOINT')
      ? 'JOINTS'
      : indexed[1].startsWith('WEIGHT')
        ? 'WEIGHTS'
        : indexed[1];
    const index = Number(indexed[2] || 0);
    if (!Number.isSafeInteger(index) || index > 999999999)
      throw new Error(`glTF v1: invalid attribute set index ${name}`);
    return `${semantic}_${index}`;
  }
  if (
    ['POSITION', 'NORMAL', 'TANGENT'].includes(name) ||
    name.startsWith('_') ||
    name.includes(':')
  )
    return name;
  return `_${name}`;
}
