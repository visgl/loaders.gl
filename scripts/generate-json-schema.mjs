// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {z} from 'zod';

const {values} = parseArgs({
  options: {
    schema: {type: 'string'},
    export: {type: 'string'},
    output: {type: 'string'},
    id: {type: 'string'},
    title: {type: 'string'}
  },
  strict: true
});

for (const option of ['schema', 'export', 'output', 'id', 'title']) {
  if (!values[option]) {
    throw new Error(`Missing required --${option} option`);
  }
}

const schemaModule = await import(pathToFileURL(resolve(values.schema)).href);
const schema = schemaModule[values.export];

if (!schema) {
  throw new Error(`Module ${values.schema} does not export ${values.export}`);
}

const jsonSchema = z.toJSONSchema(schema, {
  target: 'draft-7',
  reused: 'ref'
});

jsonSchema.$id = values.id;
jsonSchema.title = values.title;

await writeFile(resolve(values.output), `${JSON.stringify(jsonSchema, null, 2)}\n`);
