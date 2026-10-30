// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {load, resolvePath} from '@loaders.gl/core';
import {JSONLoaderWithParser} from '@loaders.gl/tables/json-loader';
import {setupLoaderTestEnvironment} from '../../../../../test/vitest-setup-loaders';

await setupLoaderTestEnvironment();

const JSON_URL = '@loaders.gl/core/test/data/files/basic.json';

test('load#Node stream - NODE ONLY', async () => {
  const fs = await import('fs');
  const stream = fs.createReadStream(resolvePath(JSON_URL));
  // @ts-ignore TODO remove this ts-ignore
  const data = await load(stream, JSONLoaderWithParser);

  expect(typeof data, 'load(Node stream) returned data').toBe('object');
});
