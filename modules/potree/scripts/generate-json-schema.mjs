// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {z} from 'zod';
import {PotreeMetadataSchema} from '../dist/types/potree-metadata.js';

const outputUrl = new URL('../dist/potree-metadata.schema.json', import.meta.url);
const jsonSchema = z.toJSONSchema(PotreeMetadataSchema, {
  target: 'draft-7',
  reused: 'ref'
});

jsonSchema.$id = 'https://unpkg.com/@loaders.gl/potree/potree-metadata.schema.json';
jsonSchema.title = 'Potree 1.x cloud.js metadata';

await writeFile(fileURLToPath(outputUrl), `${JSON.stringify(jsonSchema, null, 2)}\n`);
