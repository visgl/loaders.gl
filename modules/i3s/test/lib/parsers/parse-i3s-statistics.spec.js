import test from 'tape-promise/tape';
import {loadTilesetStatisticsInfo} from '../../../src/lib/parsers/parse-i3s-statistics';

test('parse-i3s-statistics#loadTilesetStatisticsInfo Should return empty array if no statistics info', async (t) => {
  const statisticsInfo = [];

  const options = {
    baseUri: ''
  };

  const statistics = await loadTilesetStatisticsInfo(statisticsInfo, options);

  t.ok(statistics);
  t.deepEqual(statistics, []);
  t.end();
});

test('parse-i3s-statistics#loadTilesetStatisticsInfo Should return empty array if statistics loading is failed', async (t) => {
  const statisticsInfo = [
    {
      key: 'f_1',
      name: 'NAME',
      href: './statistics/f_1/0'
    }
  ];

  const options = {
    baseUri: 'https://local_test.com'
  };
  const statistics = await loadTilesetStatisticsInfo(statisticsInfo, options);

  t.ok(statistics);
  t.deepEqual(statistics, []);
  t.end();
});

test('parse-i3s-statistics#loadTilesetStatisticsInfo Should return loaded statistics info', async (t) => {
  const statisticsInfo = [
    {
      key: 'f_0',
      name: 'NAME',
      href: '/statistics/f_0/0'
    }
  ];

  const options = {
    baseUri: '@loaders.gl/i3s/test/data/SanFrancisco_3DObjects_1_7/SceneServer/layers/0'
  };
  const statistics = await loadTilesetStatisticsInfo(statisticsInfo, options);

  const expectedResult = [
    {
      key: 'f_0',
      name: 'NAME',
      href: '/statistics/f_0/0',
      stats: {
        totalValuesCount: 83254,
        mostFrequentValues: [
          {value: 'SanfranQ_3417.flt', count: 1},
          {value: 'SanfranO_04872.flt', count: 1}
        ]
      }
    }
  ];

  t.ok(statistics);
  t.deepEqual(statistics, expectedResult);
  t.end();
});
