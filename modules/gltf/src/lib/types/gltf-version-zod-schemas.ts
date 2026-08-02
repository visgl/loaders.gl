// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {z} from 'zod';
import {
  GLTF1_JSON_SCHEMA,
  GLTF2_JSON_SCHEMA,
  GLTF21_JSON_SCHEMA,
  GLTF_EXTENSION_JSON_SCHEMAS,
  GLTF_SCHEMA_SOURCE_COMMITS
} from './gltf-official-json-schemas';
import {GLTFSchema} from './gltf-zod-schema';

type JsonSchema = Parameters<typeof z.fromJSONSchema>[0];
type ExtensionFragmentSchemas = Record<string, z.ZodType>;
type NamedExtensionSchemas = Record<string, ExtensionFragmentSchemas>;
type ExtensionStatusSchemas = Record<string, NamedExtensionSchemas>;
type VersionedExtensionSchemas = Record<string, ExtensionStatusSchemas>;

const UNSUPPORTED_ZOD_JSON_SCHEMA_KEYWORDS = new Set([
  'dependencies',
  'dependentRequired',
  'dependentSchemas',
  'if',
  'then',
  'else',
  'unevaluatedItems',
  'unevaluatedProperties'
]);

/** Creates a Zod-compatible copy of an authoritative Khronos JSON Schema. */
function prepareJsonSchemaForZod(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(prepareJsonSchemaForZod);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  const prepared: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (UNSUPPORTED_ZOD_JSON_SCHEMA_KEYWORDS.has(key)) {
      continue;
    }
    if (key === 'not' && item && typeof item === 'object' && Object.keys(item).length > 0) {
      continue;
    }
    prepared[key] = prepareJsonSchemaForZod(item);
  }
  return prepared;
}

/** Converts nested Khronos extension JSON Schemas into an equivalent nested Zod schema map. */
function createExtensionSchemaMap(value: Record<string, unknown>): VersionedExtensionSchemas {
  const result: VersionedExtensionSchemas = {};
  for (const [version, statuses] of Object.entries(value)) {
    result[version] = {};
    for (const [status, extensions] of Object.entries(statuses as Record<string, unknown>)) {
      result[version][status] = {};
      for (const [extensionName, fragments] of Object.entries(
        extensions as Record<string, unknown>
      )) {
        result[version][status][extensionName] = {};
        for (const [fragmentName, schema] of Object.entries(fragments as Record<string, unknown>)) {
          result[version][status][extensionName][fragmentName] = z.fromJSONSchema(
            prepareJsonSchemaForZod(schema) as JsonSchema,
            {defaultTarget: 'draft-4'}
          );
        }
      }
    }
  }
  return result;
}

/** Zod schema for a glTF 1.0 JSON document. */
export const GLTF1Schema = z
  .fromJSONSchema(prepareJsonSchemaForZod(GLTF1_JSON_SCHEMA) as JsonSchema, {
    defaultTarget: 'draft-4'
  })
  .and(
    z
      .object({asset: z.object({version: z.literal('1.0')}).catchall(z.unknown())})
      .catchall(z.unknown())
  );

/** Zod schema for a glTF 2.0 JSON document. */
export const GLTF2Schema = GLTFSchema.and(
  z
    .object({asset: z.object({version: z.literal('2.0')}).catchall(z.unknown())})
    .catchall(z.unknown())
);

/** Zod schema for a draft glTF 2.1 JSON document. */
export const GLTF21Schema = z
  .fromJSONSchema(prepareJsonSchemaForZod(GLTF21_JSON_SCHEMA) as JsonSchema, {
    defaultTarget: 'draft-2020-12'
  })
  .and(
    z
      .object({asset: z.object({version: z.literal('2.1')}).catchall(z.unknown())})
      .catchall(z.unknown())
  );

/** Zod schema accepting glTF 1.0, glTF 2.0, or draft glTF 2.1 JSON documents. */
export const GLTFVersionSchema = z.union([GLTF1Schema, GLTF2Schema, GLTF21Schema]);

/** Zod schemas for every Khronos glTF extension schema fragment. */
export const GLTFExtensionSchemas = createExtensionSchemaMap(GLTF_EXTENSION_JSON_SCHEMAS);

/** Zod schemas for glTF 1.0 extension fragments, grouped by extension status and name. */
export const GLTF1ExtensionSchemas = GLTFExtensionSchemas['1.0']!;

/** Zod schemas for glTF 2.0 extension fragments, grouped by extension status and name. */
export const GLTF2ExtensionSchemas = GLTFExtensionSchemas['2.0']!;

/** Authoritative bundled Khronos JSON Schemas used to construct the Zod schemas. */
export {
  GLTF1_JSON_SCHEMA,
  GLTF2_JSON_SCHEMA,
  GLTF21_JSON_SCHEMA,
  GLTF_EXTENSION_JSON_SCHEMAS,
  GLTF_SCHEMA_SOURCE_COMMITS
};
