// loaders.gl, MIT license

// Forked from https://github.com/Esri/lerc/blob/master/OtherLanguages/js/tests/
// under Apache 2 license
// (only used for test cases)

import test from 'tape-promise/tape';
// import {validateLoader} from 'test/common/conformance';

// import {LERCLoader, LERCData} from '@loaders.gl/wms';
import type {LERCData} from '../../src/lib/parsers/lerc/lerc-types';
import {LERCLoader} from '../../src/lerc-loader';
import {load, isBrowser} from '@loaders.gl/core';

const LERC_FILES = [
  '@loaders.gl/wms/test/data/lerc/bluemarble_256_256_3_byte.lerc2',
  '@loaders.gl/wms/test/data/lerc/california_400_400_1_float.lerc2',
  '@loaders.gl/wms/test/data/lerc/world.lerc1'
];

test('LERCLoader#level2', async (t) => {
  if (isBrowser) {
    t.end();
    return;
  }
  for (const lercFileName of LERC_FILES) {
    const result = await load(lercFileName, LERCLoader);

    const actual = formatPixelBlock(result);

    // TODO - verify against known data
    // const base = JSON.parse(fs.readFileSync(baseFilePath, {encoding: 'utf-8'}));
    // const keys = ['width', 'height', 'pixelType', 'statistics', 'pixels', 'dimCount', 'bandMasks'];
    // let diff = '';
    // keys.forEach((key) => {
    //   if (JSON.stringify(base[key]) !== JSON.stringify(actual[key])) {
    //     diff += key + ' ';
    //   }
    // });

    t.ok(actual, lercFileName);
  }
  t.end();
});

/** Helper function */
function formatPixelBlock(pb1: LERCData) {
  const pb: Partial<LERCData> = {...pb1};
  const pixels = pb1.pixels.map((band) => band.join(','));
  const mask = pb1.mask?.join(',');
  const statistics = pb1.statistics;
  if (statistics?.length) {
    statistics.forEach((bandStat) => {
      const {depthStats} = bandStat;
      if (depthStats) {
        // @ts-expect-error
        depthStats.minValues = depthStats.minValues.join(',');
        // @ts-expect-error
        depthStats.maxValues = depthStats.maxValues.join(',');
      }
    });
  }
  const validPixelCountFromMask = pb.mask
    ? pb.mask.reduce((a, b) => a + b)
    : pb1.width * pb1.height;
  const validPixelCountPerBand = pb.bandMasks
    ? pb.bandMasks.map((mask) => mask.reduce((a, b) => a + b)).join(',')
    : null;
  const bandMasks = pb.bandMasks ? pb.bandMasks.map((mask) => mask.join(',')) : pb.bandMasks;
  // push properties to the end
  delete pb.pixels;
  delete pb.mask;
  delete pb.bandMasks;
  return {...pb, validPixelCountFromMask, validPixelCountPerBand, pixels, mask, bandMasks};
}
