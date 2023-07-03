import test from 'tape-promise/tape';
import SLPKConverter from '../../src/slpk-extractor/slpk-extractor';
import {isBrowser} from '@loaders.gl/core';
import {BROWSER_ERROR_MESSAGE} from '../../src/constants';
import {cleanUpPath} from '../utils/file-utils';

const SLPKUrl = 'modules/i3s/test/data/DA12_subset.slpk';
const outputUrl = 'data';

test('tile-converter - searchFromTheEnd', async (t) => {
  const converter = new SLPKConverter();
  const conversionResult = await converter.extract({
    inputUrl: SLPKUrl,
    outputPath: outputUrl
  });
  if (!isBrowser) {
    t.ok(conversionResult);
    await cleanUpPath('data');
  } else {
    t.equals(conversionResult, BROWSER_ERROR_MESSAGE);
  }
  t.end();
});
