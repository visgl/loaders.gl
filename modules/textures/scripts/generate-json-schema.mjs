// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {z} from 'zod';
import {CompositeImageManifestSchema} from '../dist/lib/composite-image/composite-image-manifest-schema.js';

const outputUrl = new URL('../dist/texture-manifest.schema.json', import.meta.url);
const jsonSchema = z.toJSONSchema(CompositeImageManifestSchema, {
  target: 'draft-7',
  reused: 'ref'
});

jsonSchema.$id = 'https://unpkg.com/@loaders.gl/textures/texture-manifest.schema.json';
jsonSchema.title = 'loaders.gl composite image texture manifest';

await writeFile(fileURLToPath(outputUrl), `${JSON.stringify(jsonSchema, null, 2)}\n`);
