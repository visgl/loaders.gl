// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TableQuery} from '@loaders.gl/core/scan';
import {
  queryScales,
  queryScalesInBatches,
  queryScalesProgressive
} from '../../core/src/scan/query-scales';
import {createScaleQuerySources} from './scale-query-fixtures';

/** Measures scale projection over ordered in-memory sources with warm metadata. */
export default async function scaleQueryBench(suite) {
  const rowCount = 65_536;
  const batchSize = 1024;
  const sources = await createScaleQuerySources(rowCount, batchSize);
  const query: TableQuery = {
    select: ['value'],
    where: {op: '>=', args: [{property: 'id'}, rowCount / 2]}
  };
  const fixed = {color: "SCALE_COLOR(value, DOMAIN(0, 190), PALETTE('viridis'))"};
  const percentile = {
    color: "SCALE_COLOR(value, DOMAIN_QUANTILE(value, 0.02, 0.98), PALETTE('viridis'))"
  };
  const options = {time: 100, minIterations: 3, maxTimeMs: 1000, unit: 'queries'};
  const group = suite.group('Scale queries: 65536 source rows, 32768 selected');
  for (const [format, source] of Object.entries(sources)) {
    await source.getQueryMetadata();
    group.addAsync(`${format} fixed append`, options, async () => {
      let count = 0;
      for await (const result of queryScalesInBatches(query, fixed, {source})) {
        count += result.columns.color.length;
      }
      return count;
    });
    group.addAsync(`${format} exact percentile collect`, options, async () => {
      return (await queryScales(query, percentile, {source})).columns.color.length;
    });
    group.addAsync(`${format} approximate percentile snapshot`, options, async () => {
      let count = 0;
      for await (const result of queryScalesProgressive(query, percentile, {
        source,
        emitEveryBatches: 64
      })) {
        count = result.columns.color.length;
      }
      return count;
    });
  }
}
