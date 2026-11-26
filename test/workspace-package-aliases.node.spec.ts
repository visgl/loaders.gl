// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {resolve} from 'node:path';
import {expect, test} from 'vitest';
import {
  getWorkspaceEntrypointAliases,
  getWorkspaceSourceAliases
} from '../scripts/workspace-package-aliases.js';

test('workspace aliases use the published source targets for exact format subpaths', () => {
  const aliases = getWorkspaceEntrypointAliases('@loaders.gl', process.cwd());
  const parser = aliases.find(({find}) => find.test('@loaders.gl/pointclouds/pcd/parser'));
  expect(parser?.replacement).toBe(resolve('modules/pointclouds/src/pcd-loader.ts'));
  const bundled = aliases.find(({find}) => find.test('@loaders.gl/geospatial/flatgeobuf/bundled'));
  expect(bundled?.replacement).toBe(resolve('modules/geospatial/src/flatgeobuf/bundled-entry.ts'));
  expect(parser?.find.test('@loaders.gl/pointclouds/pcd/parser/private')).toBe(false);
});

test('workspace root fallbacks come after the published subpaths', () => {
  const aliases = getWorkspaceSourceAliases('@loaders.gl', process.cwd());
  const parserIndex = aliases.findIndex(
    ({find}) => find instanceof RegExp && find.test('@loaders.gl/pointclouds/pcd/parser')
  );
  const rootIndex = aliases.findIndex(({find}) => find === '@loaders.gl/pointclouds');
  expect(parserIndex).toBeGreaterThanOrEqual(0);
  expect(rootIndex).toBeGreaterThan(parserIndex);
});

test('workspace aliases route generated workers and schemas to the emitted assets', () => {
  const aliases = getWorkspaceEntrypointAliases('@loaders.gl', process.cwd());
  const worker = aliases.find(({find}) => find.test('@loaders.gl/images/basis-worker.js'));
  expect(worker?.replacement).toBe(resolve('modules/images/dist/basis-worker.js'));

  const schemaPath = '@loaders.gl/tiles/mvt/tilejson.schema.json';
  const schema = aliases.find(({find}) => find.test(schemaPath));
  expect(schema?.replacement).toBe(resolve('modules/tiles/dist/mvt/tilejson.schema.json'));

  const nestedSchemaPath = '@loaders.gl/scene/gltf/schemas/glTF.schema.json';
  const nestedSchema = aliases.find(({find}) => find.test(nestedSchemaPath));
  expect(nestedSchemaPath.replace(nestedSchema!.find, nestedSchema!.replacement)).toBe(
    resolve('modules/scene/dist/gltf/schemas/glTF.schema.json')
  );
});
