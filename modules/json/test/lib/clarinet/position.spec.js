import {expect, test} from 'vitest';
import ClarinetParser from '../../../src/lib/clarinet/clarinet';
import {fetchFile} from '@loaders.gl/core';
const SAMPLE_PATH = '@loaders.gl/json/test/data/clarinet/sample.json';
test('clarinet#track position', async () => {
  const response = await fetchFile(SAMPLE_PATH);
  const data = await response.text();
  const parser = new ClarinetParser({
    onend: () => {
      expect(parser.position, 'parser.position is correct').toBe(696);
    }
  });
  parser.write(data);
  parser.close();
});
