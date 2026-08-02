// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {
  GLTF1_JSON_SCHEMA,
  GLTF2_JSON_SCHEMA,
  GLTF21_JSON_SCHEMA,
  GLTF_EXTENSION_JSON_SCHEMAS
} from '../dist/lib/types/gltf-official-json-schemas.js';

const distUrl = new URL('../dist/', import.meta.url);

async function writeSchema(relativePath, schema) {
  const outputUrl = new URL(relativePath, distUrl);
  await mkdir(fileURLToPath(new URL('.', outputUrl)), {recursive: true});
  await writeFile(fileURLToPath(outputUrl), `${JSON.stringify(schema, null, 2)}\n`);
}

function withIdentity(schema, id, title, version) {
  return {
    ...schema,
    $id: id,
    title,
    allOf: [
      ...(schema.allOf || []),
      {
        properties: {
          asset: {
            properties: {version: {enum: [version]}},
            required: ['version']
          }
        },
        required: ['asset']
      }
    ]
  };
}

const gltf1Schema = withIdentity(
  GLTF1_JSON_SCHEMA,
  'https://unpkg.com/@loaders.gl/gltf/gltf-1.schema.json',
  'glTF 1.0',
  '1.0'
);
const gltf2Schema = withIdentity(
  GLTF2_JSON_SCHEMA,
  'https://unpkg.com/@loaders.gl/gltf/gltf-2.schema.json',
  'glTF 2.0',
  '2.0'
);
const gltf21Schema = withIdentity(
  GLTF21_JSON_SCHEMA,
  'https://unpkg.com/@loaders.gl/gltf/gltf-2.1.schema.json',
  'glTF 2.1 (Draft)',
  '2.1'
);

await writeSchema('gltf.schema.json', gltf2Schema);
await writeSchema('gltf-1.schema.json', gltf1Schema);
await writeSchema('gltf-2.schema.json', gltf2Schema);
await writeSchema('gltf-2.1.schema.json', gltf21Schema);
await writeSchema('gltf-all.schema.json', {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://unpkg.com/@loaders.gl/gltf/gltf-all.schema.json',
  title: 'glTF JSON',
  oneOf: [gltf1Schema, gltf2Schema, gltf21Schema]
});

async function writeExtensionSchemas(value, pathParts = []) {
  for (const [key, item] of Object.entries(value)) {
    const nextPathParts = [...pathParts, key];
    const isJsonSchema = item && typeof item === 'object' && ('$schema' in item || 'type' in item);
    if (isJsonSchema) {
      await writeSchema(`schemas/extensions/${nextPathParts.join('/')}.schema.json`, item);
    } else {
      await writeExtensionSchemas(item, nextPathParts);
    }
  }
}

await writeExtensionSchemas(GLTF_EXTENSION_JSON_SCHEMAS);
