import test from 'tape-promise/tape';

import {intToRgba, getChannelStats, isInterleaved} from '../src/utils';

test('getChannelStats: All zeros', t => {
  t.plan(7);
  try {
    const data = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ];
    const channelStats = data.map(arr => getChannelStats(arr));
    const means = channelStats.map(stat => stat.mean);
    const domains = channelStats.map(stat => stat.domain);
    const standardDeviations = channelStats.map(stat => stat.sd);
    const thirdQuartiles = channelStats.map(stat => stat.q3);
    const firstQuartiles = channelStats.map(stat => stat.q1);
    const medians = channelStats.map(stat => stat.median);
    const sliders = channelStats.map(stat => stat.autoSliders);

    t.deepEqual(means, [0, 0, 0]);
    t.deepEqual(domains, [
      [0, 0],
      [0, 0],
      [0, 0]
    ]);
    t.deepEqual(sliders, [
      [0, 0],
      [0, 0],
      [0, 0]
    ]);
    t.deepEqual(standardDeviations, [0, 0, 0]);
    t.deepEqual(firstQuartiles, [0, 0, 0]);
    t.deepEqual(thirdQuartiles, [0, 0, 0]);
    t.deepEqual(medians, [0, 0, 0]);
    t.end();
  } catch (e) {
    t.fail(e);
  }
});

test('getChannelStats: Small', t => {
  t.plan(6);
  try {
    const data = [
      [0, 1, 2, 3],
      [0, 2, 0, 2],
      [0, 0, 1, 1]
    ];
    const channelStats = data.map(arr => getChannelStats(arr));
    const means = channelStats.map(stat => stat.mean);
    const domains = channelStats.map(stat => stat.domain);
    const standardDeviations = channelStats.map(stat => stat.sd);
    const thirdQuartiles = channelStats.map(stat => stat.q3);
    const firstQuartiles = channelStats.map(stat => stat.q1);
    const medians = channelStats.map(stat => stat.median);

    t.deepEqual(means, [1.5, 1, 0.5]);
    t.deepEqual(domains, [
      [0, 3],
      [0, 2],
      [0, 1]
    ]);
    t.deepEqual(standardDeviations, [1.118033988749895, 1, 0.5]);
    t.deepEqual(firstQuartiles, [1, 0, 0]);
    t.deepEqual(thirdQuartiles, [3, 2, 1]);
    t.deepEqual(medians, [2, 2, 1]);
    t.end();
  } catch (e) {
    t.fail(e);
  }
});

test('getChannelStats: Large Array', t => {
  t.plan(6);
  try {
    const data = [
      [0, 1, 2, 3, 7, 8, 9, 10, 4, 5, 6, 11],
      [0, 1, 5, 6, 7, 2, 9, 10, 3, 4, 8, 11, 12]
    ];
    const channelStats = data.map(arr => getChannelStats(arr));

    const means = channelStats.map(stat => stat.mean);
    const domains = channelStats.map(stat => stat.domain);
    const standardDeviations = channelStats.map(stat => stat.sd);
    const thirdQuartiles = channelStats.map(stat => stat.q3);
    const firstQuartiles = channelStats.map(stat => stat.q1);
    const medians = channelStats.map(stat => stat.median);

    t.deepEqual(means, [5.5, 6]);
    t.deepEqual(domains, [
      [0, 11],
      [0, 12]
    ]);
    t.deepEqual(standardDeviations, [3.452052529534663, 3.7416573867739413]);
    t.deepEqual(firstQuartiles, [3, 3]);
    t.deepEqual(thirdQuartiles, [9, 9]);
    t.deepEqual(medians, [6, 6]);
    t.end();
  } catch (e) {
    t.fail(e);
  }
});

test('Convert int to RGBA color', t => {
  t.plan(2);
  t.deepEqual(intToRgba(0), [0, 0, 0, 0]);
  t.deepEqual(intToRgba(100100), [0, 1, 135, 4]);
});

test('isInterleaved', t => {
  t.plan(4);
  t.ok(isInterleaved([1, 2, 400, 400, 4]));
  t.ok(isInterleaved([1, 2, 400, 400, 3]));
  t.ok(!isInterleaved([1, 2, 400, 400]));
  t.ok(!isInterleaved([1, 3, 4, 4000000]));
});
