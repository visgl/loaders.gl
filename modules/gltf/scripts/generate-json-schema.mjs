// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {z} from 'zod';
import {GLTFSchema} from '../dist/lib/types/gltf-zod-schema.js';

const outputUrl = new URL('../dist/gltf.schema.json', import.meta.url);
const jsonSchema = z.toJSONSchema(GLTFSchema, {
  target: 'draft-7',
  reused: 'ref'
});

jsonSchema.$id = 'https://unpkg.com/@loaders.gl/gltf/gltf.schema.json';
jsonSchema.title = 'glTF 2.0';

await writeFile(fileURLToPath(outputUrl), `${JSON.stringify(jsonSchema, null, 2)}\n`);
