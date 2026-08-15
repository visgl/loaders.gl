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
type JsonSchemaRecord = Record<string, unknown>;
type JsonSchemaTarget = 'draft-4' | 'draft-2020-12';
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
  'else'
]);

type JsonSchemaConstraintIssue = {
  message: string;
  path: PropertyKey[];
};

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
    // JSON Schema defaults are annotations, not mutations performed during validation.
    if (key === 'default') {
      continue;
    }
    // Zod's exclusive union conversion rejects required-only branches. Convert the supported
    // shape as an inclusive union; findBranchConstraintIssue enforces oneOf exclusivity.
    if (key === 'oneOf') {
      prepared.anyOf = prepareJsonSchemaForZod(item);
      continue;
    }
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

/** Convert an authoritative JSON Schema while retaining constraints unsupported by Zod. */
function createConstrainedZodSchema(
  schema: JsonSchemaRecord,
  defaultTarget: JsonSchemaTarget
): z.ZodType {
  const convertedSchema = z.fromJSONSchema(prepareJsonSchemaForZod(schema) as JsonSchema, {
    defaultTarget
  });
  return convertedSchema.superRefine((value, context) => {
    const issue = findJsonSchemaConstraintIssue(value, schema, schema, defaultTarget, []);
    if (issue) {
      context.addIssue({code: 'custom', message: issue.message, path: issue.path});
    }
  });
}

/** Find the first violation of a JSON Schema keyword omitted during Zod conversion. */
function findJsonSchemaConstraintIssue(
  value: unknown,
  schemaValue: unknown,
  rootSchema: JsonSchemaRecord,
  defaultTarget: JsonSchemaTarget,
  path: PropertyKey[]
): JsonSchemaConstraintIssue | null {
  if (typeof schemaValue === 'boolean') {
    return schemaValue ? null : {message: 'Value is forbidden by the JSON Schema.', path};
  }
  if (!isJsonSchemaRecord(schemaValue)) {
    return null;
  }

  const reference = schemaValue.$ref;
  if (typeof reference === 'string' && reference.startsWith('#/')) {
    const referencedSchema = resolveLocalJsonSchemaReference(rootSchema, reference);
    const issue = findJsonSchemaConstraintIssue(
      value,
      referencedSchema,
      rootSchema,
      defaultTarget,
      path
    );
    if (issue) {
      return issue;
    }
  }

  const dependencyIssue = findDependencyIssue(value, schemaValue, rootSchema, defaultTarget, path);
  if (dependencyIssue) {
    return dependencyIssue;
  }

  if (
    schemaValue.not &&
    matchesPreparedJsonSchema(value, schemaValue.not, rootSchema, defaultTarget) &&
    !findJsonSchemaConstraintIssue(value, schemaValue.not, rootSchema, defaultTarget, path)
  ) {
    return {message: 'Value matches a forbidden JSON Schema.', path};
  }

  const conditionalIssue = findConditionalIssue(
    value,
    schemaValue,
    rootSchema,
    defaultTarget,
    path
  );
  if (conditionalIssue) {
    return conditionalIssue;
  }

  for (const allOfSchema of getSchemaArray(schemaValue.allOf)) {
    const issue = findJsonSchemaConstraintIssue(
      value,
      allOfSchema,
      rootSchema,
      defaultTarget,
      path
    );
    if (issue) {
      return issue;
    }
  }

  const anyOfIssue = findBranchConstraintIssue(
    value,
    schemaValue.anyOf,
    rootSchema,
    defaultTarget,
    path,
    false
  );
  if (anyOfIssue) {
    return anyOfIssue;
  }
  const oneOfIssue = findBranchConstraintIssue(
    value,
    schemaValue.oneOf,
    rootSchema,
    defaultTarget,
    path,
    true
  );
  if (oneOfIssue) {
    return oneOfIssue;
  }

  if (isJsonSchemaRecord(value)) {
    const properties = isJsonSchemaRecord(schemaValue.properties) ? schemaValue.properties : {};
    const patternProperties = isJsonSchemaRecord(schemaValue.patternProperties)
      ? schemaValue.patternProperties
      : {};
    for (const [propertyName, propertySchema] of Object.entries(properties)) {
      if (propertyName in value) {
        const issue = findJsonSchemaConstraintIssue(
          value[propertyName],
          propertySchema,
          rootSchema,
          defaultTarget,
          [...path, propertyName]
        );
        if (issue) {
          return issue;
        }
      }
    }
    for (const [propertyName, propertyValue] of Object.entries(value)) {
      if (propertyName in properties) {
        continue;
      }
      let matchedPattern = false;
      for (const [pattern, propertySchema] of Object.entries(patternProperties)) {
        if (new RegExp(pattern).test(propertyName)) {
          matchedPattern = true;
          const issue = findJsonSchemaConstraintIssue(
            propertyValue,
            propertySchema,
            rootSchema,
            defaultTarget,
            [...path, propertyName]
          );
          if (issue) {
            return issue;
          }
        }
      }
      if (!matchedPattern && isJsonSchemaRecord(schemaValue.additionalProperties)) {
        const issue = findJsonSchemaConstraintIssue(
          propertyValue,
          schemaValue.additionalProperties,
          rootSchema,
          defaultTarget,
          [...path, propertyName]
        );
        if (issue) {
          return issue;
        }
      }
    }
  }

  if (Array.isArray(value)) {
    const prefixItems = getSchemaArray(schemaValue.prefixItems);
    for (let index = 0; index < prefixItems.length && index < value.length; index++) {
      const issue = findJsonSchemaConstraintIssue(
        value[index],
        prefixItems[index],
        rootSchema,
        defaultTarget,
        [...path, index]
      );
      if (issue) {
        return issue;
      }
    }
    if (schemaValue.items && !Array.isArray(schemaValue.items)) {
      for (let index = prefixItems.length; index < value.length; index++) {
        const issue = findJsonSchemaConstraintIssue(
          value[index],
          schemaValue.items,
          rootSchema,
          defaultTarget,
          [...path, index]
        );
        if (issue) {
          return issue;
        }
      }
    }
  }

  return null;
}

/** Validate property dependency keywords from draft-04 and draft-2020-12. */
function findDependencyIssue(
  value: unknown,
  schema: JsonSchemaRecord,
  rootSchema: JsonSchemaRecord,
  defaultTarget: JsonSchemaTarget,
  path: PropertyKey[]
): JsonSchemaConstraintIssue | null {
  if (!isJsonSchemaRecord(value)) {
    return null;
  }
  const dependencyGroups = [schema.dependencies, schema.dependentRequired];
  for (const dependencyGroup of dependencyGroups) {
    if (!isJsonSchemaRecord(dependencyGroup)) {
      continue;
    }
    for (const [propertyName, requiredProperties] of Object.entries(dependencyGroup)) {
      if (!(propertyName in value)) {
        continue;
      }
      if (Array.isArray(requiredProperties)) {
        for (const requiredProperty of requiredProperties) {
          if (typeof requiredProperty === 'string' && !(requiredProperty in value)) {
            return {
              message: `${requiredProperty} is required when ${propertyName} is defined.`,
              path
            };
          }
        }
      } else if (!matchesPreparedJsonSchema(value, requiredProperties, rootSchema, defaultTarget)) {
        return {message: `Dependency for ${propertyName} is not satisfied.`, path};
      } else {
        const issue = findJsonSchemaConstraintIssue(
          value,
          requiredProperties,
          rootSchema,
          defaultTarget,
          path
        );
        if (issue) {
          return {
            message: `Dependency for ${propertyName} is not satisfied: ${issue.message}`,
            path: issue.path
          };
        }
      }
    }
  }
  const dependentSchemas = isJsonSchemaRecord(schema.dependentSchemas)
    ? schema.dependentSchemas
    : {};
  for (const [propertyName, dependentSchema] of Object.entries(dependentSchemas)) {
    if (!(propertyName in value)) {
      continue;
    }
    if (!matchesPreparedJsonSchema(value, dependentSchema, rootSchema, defaultTarget)) {
      return {message: `Dependency for ${propertyName} is not satisfied.`, path};
    }
    const issue = findJsonSchemaConstraintIssue(
      value,
      dependentSchema,
      rootSchema,
      defaultTarget,
      path
    );
    if (issue) {
      return issue;
    }
  }
  return null;
}

/** Validate draft conditional keywords omitted during Zod conversion. */
function findConditionalIssue(
  value: unknown,
  schema: JsonSchemaRecord,
  rootSchema: JsonSchemaRecord,
  defaultTarget: JsonSchemaTarget,
  path: PropertyKey[]
): JsonSchemaConstraintIssue | null {
  if (!schema.if) {
    return null;
  }
  const branch = matchesPreparedJsonSchema(value, schema.if, rootSchema, defaultTarget)
    ? schema.then
    : schema.else;
  if (!branch) {
    return null;
  }
  if (!matchesPreparedJsonSchema(value, branch, rootSchema, defaultTarget)) {
    return {message: 'Value violates a conditional JSON Schema branch.', path};
  }
  return findJsonSchemaConstraintIssue(value, branch, rootSchema, defaultTarget, path);
}

/** Validate unsupported constraints inside matching anyOf and oneOf branches. */
function findBranchConstraintIssue(
  value: unknown,
  schemaValue: unknown,
  rootSchema: JsonSchemaRecord,
  defaultTarget: JsonSchemaTarget,
  path: PropertyKey[],
  requireExactlyOne: boolean
): JsonSchemaConstraintIssue | null {
  const schemas = getSchemaArray(schemaValue);
  if (!schemas.length) {
    return null;
  }
  const matchingSchemas = schemas.filter(schema =>
    matchesPreparedJsonSchema(value, schema, rootSchema, defaultTarget)
  );
  const issues = matchingSchemas.map(schema =>
    findJsonSchemaConstraintIssue(value, schema, rootSchema, defaultTarget, path)
  );
  const validBranchCount = issues.filter(issue => !issue).length;
  if (validBranchCount === 0 && issues.length) {
    return issues.find(Boolean) || {message: 'Value violates a JSON Schema branch.', path};
  }
  if (requireExactlyOne && validBranchCount > 1) {
    return {message: 'Value matches more than one exclusive JSON Schema branch.', path};
  }
  return null;
}

/** Test the supported portion of a schema while retaining its local definitions. */
function matchesPreparedJsonSchema(
  value: unknown,
  schemaValue: unknown,
  rootSchema: JsonSchemaRecord,
  defaultTarget: JsonSchemaTarget
): boolean {
  if (!isJsonSchemaRecord(schemaValue)) {
    return schemaValue !== false;
  }
  if (Array.isArray(schemaValue.required)) {
    if (!isJsonSchemaRecord(value)) {
      return false;
    }
    for (const requiredProperty of schemaValue.required) {
      if (typeof requiredProperty === 'string' && !(requiredProperty in value)) {
        return false;
      }
    }
  }
  const schema = {
    ...schemaValue,
    ...(rootSchema.definitions ? {definitions: rootSchema.definitions} : {}),
    ...(rootSchema.$defs ? {$defs: rootSchema.$defs} : {})
  };
  try {
    return z
      .fromJSONSchema(prepareJsonSchemaForZod(schema) as JsonSchema, {defaultTarget})
      .safeParse(value).success;
  } catch {
    return false;
  }
}

/** Resolve a local JSON Pointer reference within a bundled schema. */
function resolveLocalJsonSchemaReference(rootSchema: JsonSchemaRecord, reference: string): unknown {
  return reference
    .slice(2)
    .split('/')
    .map(segment => segment.replace(/~1/g, '/').replace(/~0/g, '~'))
    .reduce<unknown>(
      (value, segment) => (isJsonSchemaRecord(value) ? value[segment] : undefined),
      rootSchema
    );
}

/** Return an unknown value as a schema array when possible. */
function getSchemaArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** Check whether a value is a non-array JSON object. */
function isJsonSchemaRecord(value: unknown): value is JsonSchemaRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
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
          result[version][status][extensionName][fragmentName] = createConstrainedZodSchema(
            schema as JsonSchemaRecord,
            'draft-4'
          );
        }
      }
    }
  }
  return result;
}

/** Zod schema for a glTF 1.0 JSON document. */
export const GLTF1Schema = createConstrainedZodSchema(GLTF1_JSON_SCHEMA, 'draft-4').and(
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
export const GLTF21Schema = createConstrainedZodSchema(GLTF21_JSON_SCHEMA, 'draft-2020-12').and(
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
