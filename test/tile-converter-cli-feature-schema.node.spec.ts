// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterAll, beforeAll, expect, test} from 'vitest';
import {mkdtemp, writeFile, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {readFeatureSchema} from '../apps/tile-converter/src/v5/node-feature-schema';

let directory: string;
const mapping = {
  metadataClass: 'building',
  sourceFeatureIdProperty: 'object_id',
  schema: {
    fields: [
      {name: 'feature_id', type: 'uint64', nullable: false},
      {name: 'label', type: 'utf8', nullable: true}
    ]
  }
};
beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'tile-feature-schema-'));
});
afterAll(async () => rm(directory, {recursive: true, force: true}));

test('CLI schema reader retains explicit exact types and format-specific controls', async () => {
  const path = join(directory, 'valid.json');
  const features = {...mapping, batchSize: 1, integer64Encoding: 'decimal-string'};
  await writeFile(path, JSON.stringify(features));
  expect(await readFeatureSchema(path, false)).toEqual({features});
  await writeFile(path, JSON.stringify(features).padEnd(65536));
  expect(await readFeatureSchema(path, false)).toEqual({features});
  const i3sFeatures = {...features, objectIdProperty: 'OBJECTID', maxAttributeBytes: 1024};
  await writeFile(path, JSON.stringify(i3sFeatures));
  expect(await readFeatureSchema(path, true)).toEqual({i3sFeatures});
  await expect(readFeatureSchema(path, false)).rejects.toMatchObject({
    code: 'CLI_FEATURE_SCHEMA_INVALID'
  });
});

test.each([
  null,
  [],
  {},
  {...mapping, typo: true},
  {...mapping, metadataClass: ''},
  {...mapping, sourceFeatureIdProperty: 42},
  {...mapping, batchSize: 0},
  {...mapping, batchSize: 65537},
  {...mapping, integer64Encoding: 'number'},
  {...mapping, rawMetadataField: 'raw'},
  {...mapping, schema: {fields: []}},
  {...mapping, schema: {fields: [{name: 'feature_id', type: 'float64'}]}},
  {...mapping, schema: {fields: [{name: 'feature_id', type: 'uint64', nullable: true}]}},
  {
    ...mapping,
    schema: {
      fields: [
        {name: 'feature_id', type: 'uint64'},
        {name: 'feature_id', type: 'uint32'}
      ]
    }
  },
  {...mapping, schema: {fields: [{name: 'feature_id', type: 'uint64', nullable: 'true'}]}},
  {...mapping, schema: {fields: [{name: 'feature_id', type: {type: 'list'}}]}},
  {...mapping, schema: {...mapping.schema, metadata: {key: 1}}}
])('CLI schema reader rejects invalid mappings %j', async value => {
  const path = join(directory, 'invalid.json');
  await writeFile(path, JSON.stringify(value));
  await expect(readFeatureSchema(path, false)).rejects.toMatchObject({
    code: 'CLI_FEATURE_SCHEMA_INVALID'
  });
});

test('CLI schema reader enforces local regular files, valid JSON, size and cancellation', async () => {
  const path = join(directory, 'bytes.json');
  for (const bytes of [
    new Uint8Array([255]),
    new TextEncoder().encode('{'),
    new Uint8Array(65537)
  ]) {
    await writeFile(path, bytes);
    await expect(readFeatureSchema(path, false)).rejects.toMatchObject({
      code: 'CLI_FEATURE_SCHEMA_INVALID'
    });
  }
  await expect(readFeatureSchema(directory, false)).rejects.toMatchObject({
    code: 'CLI_FEATURE_SCHEMA_INVALID'
  });
  const controller = new AbortController();
  controller.abort();
  await expect(readFeatureSchema(path, false, controller.signal)).rejects.toThrow();
  await writeFile(path, JSON.stringify(mapping));
  await expect(readFeatureSchema(path, true)).rejects.toMatchObject({
    code: 'CLI_FEATURE_SCHEMA_INVALID'
  });
  await writeFile(
    path,
    JSON.stringify({...mapping, objectIdProperty: 'OBJECTID', maxAttributeBytes: 16777217})
  );
  await expect(readFeatureSchema(path, true)).rejects.toMatchObject({
    code: 'CLI_FEATURE_SCHEMA_INVALID'
  });
});
