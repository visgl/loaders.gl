import test from 'tape-promise/tape';
import {fetchFile, parse} from '@loaders.gl/core';
import {LASLoader} from '@loaders.gl/las';
import {ArrowLoader} from '@loaders.gl/arrow';
import {lasToArrow} from '../../src/lib/las-to-arrow';

const LAS_BINARY_URL = '@loaders.gl/las/test/data/indoor.laz';

test('LASLoader#parse(binary)', async (t) => {
  const data = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {las: {skip: 10}, worker: false});
  const result = lasToArrow(data);
  t.ok(result);
  const arrowData = await parse(result, ArrowLoader);
  t.ok(arrowData);
  t.equals(arrowData.classification.length, 1);
  t.equals(arrowData.classification[0].values.length, 80805);
  t.equals(arrowData.COLOR_0.length, 1);
  t.equals(arrowData.COLOR_0[0].values.length, 323220);
  t.equals(arrowData.intensity.length, 1);
  t.equals(arrowData.intensity[0].values.length, 80805);
  t.equals(arrowData.POSITION.length, 1);
  t.equals(arrowData.POSITION[0].values.length, 242415);
  t.end();
});
