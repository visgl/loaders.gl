import {expect, test} from 'vitest';
import {load, resolvePath} from '@loaders.gl/core';
import {JSONLoader} from '@loaders.gl/json';

const JSON_URL = '@loaders.gl/core/test/data/files/basic.json';

test('load#Node stream - NODE ONLY', async () => {
  const fs = await import('fs');
  const stream = fs.createReadStream(resolvePath(JSON_URL));
  // @ts-ignore TODO remove this ts-ignore
  const data = await load(stream, JSONLoader);

  expect(typeof data, 'load(Node stream) returned data').toBe('object');
});
