// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readFile, readdir, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const mainRepositoryPath = process.argv[2];
const draft21RepositoryPath = process.argv[3];

if (!mainRepositoryPath || !draft21RepositoryPath) {
  throw new Error(
    'Usage: node scripts/update-official-schemas.mjs <Khronos glTF main checkout> <Khronos glTF draft-2.1 checkout>'
  );
}

const modulePath = path.resolve(import.meta.dirname, '..');
const outputPath = path.join(modulePath, 'src', 'lib', 'types', 'gltf-official-json-schemas.ts');
const mainCommit = execFileSync('git', ['-C', mainRepositoryPath, 'rev-parse', 'HEAD'], {
  encoding: 'utf8'
}).trim();
const draft21Commit = execFileSync('git', ['-C', draft21RepositoryPath, 'rev-parse', 'HEAD'], {
  encoding: 'utf8'
}).trim();

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

function createDefinitionName(filePath, schemaRootPath) {
  return path.relative(schemaRootPath, filePath).replaceAll(/[^a-zA-Z0-9]+/g, '_');
}

async function bundleSchema(rootFilePath, coreSchemaPath) {
  const rootSchemaPath = path.dirname(rootFilePath);
  const rootSchema = await readJson(rootFilePath);
  const definitionKeyword = rootSchema.$schema?.includes('2020-12') ? '$defs' : 'definitions';
  const definitions = {};
  const processing = new Map();

  async function resolveReferenceFile(reference, currentFilePath) {
    const [referenceFile] = reference.split('#');
    const adjacentPath = path.resolve(path.dirname(currentFilePath), referenceFile);
    try {
      await readFile(adjacentPath);
      return adjacentPath;
    } catch {
      return path.resolve(coreSchemaPath, referenceFile);
    }
  }

  async function rewrite(value, currentFilePath) {
    if (Array.isArray(value)) {
      return Promise.all(value.map((item) => rewrite(item, currentFilePath)));
    }
    if (!value || typeof value !== 'object') {
      return value;
    }

    if (
      typeof value.$ref === 'string' &&
      value.$ref.startsWith('#') &&
      currentFilePath !== rootFilePath
    ) {
      const referenceKey = `${currentFilePath}${value.$ref}`;
      const definitionName = createDefinitionName(referenceKey, rootSchemaPath);
      if (!processing.has(referenceKey)) {
        processing.set(referenceKey, definitionName);
        const referencedSchema = await readJson(currentFilePath);
        const referencedValue = value.$ref
          .slice(2)
          .split('/')
          .map((part) => part.replaceAll('~1', '/').replaceAll('~0', '~'))
          .reduce((current, part) => current[part], referencedSchema);
        definitions[definitionName] = await rewrite(referencedValue, currentFilePath);
      }
      return {...value, $ref: `#/${definitionKeyword}/${definitionName}`};
    }

    if (typeof value.$ref === 'string' && !value.$ref.startsWith('#')) {
      const [referenceFile, fragment] = value.$ref.split('#');
      const referenceFilePath = await resolveReferenceFile(referenceFile, currentFilePath);
      const referenceKey = `${referenceFilePath}${fragment ? `#${fragment}` : ''}`;
      const definitionName = createDefinitionName(referenceKey, rootSchemaPath);
      if (!processing.has(referenceKey)) {
        processing.set(referenceKey, definitionName);
        const referencedSchema = await readJson(referenceFilePath);
        delete referencedSchema.$schema;
        delete referencedSchema.$id;
        delete referencedSchema.id;
        definitions[definitionName] = await rewrite(referencedSchema, referenceFilePath);
      }
      return {
        ...value,
        $ref: `#/${definitionKeyword}/${definitionName}`
      };
    }

    const rewritten = {};
    for (const [key, item] of Object.entries(value)) {
      rewritten[key] = await rewrite(item, currentFilePath);
    }
    return rewritten;
  }

  const bundledSchema = await rewrite(rootSchema, rootFilePath);
  if (Object.keys(definitions).length) {
    bundledSchema[definitionKeyword] = {
      ...(bundledSchema[definitionKeyword] || {}),
      ...definitions
    };
  }
  return bundledSchema;
}

async function listSchemaFiles(directoryPath) {
  const entries = await readdir(directoryPath, {withFileTypes: true});
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directoryPath, entry.name);
      return entry.isDirectory()
        ? listSchemaFiles(entryPath)
        : entry.name.endsWith('.schema.json')
          ? [entryPath]
          : [];
    })
  );
  return files.flat().sort();
}

async function createExtensionSchemas(repositoryPath) {
  const extensionsPath = path.join(repositoryPath, 'extensions');
  const schemaFiles = await listSchemaFiles(extensionsPath);
  const result = {};
  for (const schemaFile of schemaFiles) {
    const relativePath = path.relative(extensionsPath, schemaFile);
    const [version, status, extensionName, ...schemaPathParts] = relativePath.split(path.sep);
    const coreSchemaPath = path.join(repositoryPath, 'specification', version, 'schema');
    const schemaName = schemaPathParts.at(-1).replace('.schema.json', '');
    result[version] ??= {};
    result[version][status] ??= {};
    result[version][status][extensionName] ??= {};
    result[version][status][extensionName][schemaName] = await bundleSchema(
      schemaFile,
      coreSchemaPath
    );
  }
  return result;
}

const gltf1JsonSchema = await bundleSchema(
  path.join(mainRepositoryPath, 'specification', '1.0', 'schema', 'glTF.schema.json'),
  path.join(mainRepositoryPath, 'specification', '1.0', 'schema')
);
const gltf2JsonSchema = await bundleSchema(
  path.join(mainRepositoryPath, 'specification', '2.0', 'schema', 'glTF.schema.json'),
  path.join(mainRepositoryPath, 'specification', '2.0', 'schema')
);
const gltf21JsonSchema = await bundleSchema(
  path.join(draft21RepositoryPath, 'specification', '2.1', 'schema', 'glTF.schema.json'),
  path.join(draft21RepositoryPath, 'specification', '2.1', 'schema')
);
const gltfExtensionJsonSchemas = await createExtensionSchemas(mainRepositoryPath);

const source = `// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// This file is generated by scripts/update-official-schemas.mjs.

/** Khronos glTF repository commits used to generate the bundled schemas. */
export const GLTF_SCHEMA_SOURCE_COMMITS = {
  main: '${mainCommit}',
  draft21: '${draft21Commit}'
} as const;

/** Khronos glTF 1.0 JSON Schema, bundled with local references. */
export const GLTF1_JSON_SCHEMA: Record<string, unknown> = ${JSON.stringify(gltf1JsonSchema, null, 2)};

/** Khronos glTF 2.0 JSON Schema, bundled with local references. */
export const GLTF2_JSON_SCHEMA: Record<string, unknown> = ${JSON.stringify(gltf2JsonSchema, null, 2)};

/** Draft Khronos glTF 2.1 JSON Schema, bundled with local references. */
export const GLTF21_JSON_SCHEMA: Record<string, unknown> = ${JSON.stringify(gltf21JsonSchema, null, 2)};

/** Khronos extension JSON Schema fragments grouped by version, status, and extension. */
export const GLTF_EXTENSION_JSON_SCHEMAS: Record<string, unknown> = ${JSON.stringify(gltfExtensionJsonSchemas, null, 2)};
`;

await writeFile(outputPath, source);
