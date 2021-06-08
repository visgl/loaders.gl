import test from 'tape-promise/tape';
import ClarinetParser from '@loaders.gl/json/lib/clarinet/clarinet';
import {fetchFile} from '@loaders.gl/core';

const SAMPLE_PATH = '@loaders.gl/json/test/data/clarinet/sample.json';

test('clarinet#track position', async (t) => {
  const response = await fetchFile(SAMPLE_PATH);
  const data = await response.text();

  const parser = new ClarinetParser();

  parser.onend = () => {
    t.equals(parser.position, 696, 'parser.position is correct');
    t.end();
  };
  parser.write(data);
  parser.close();
});
