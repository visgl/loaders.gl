// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {ClusterIndex} from '@loaders.gl/geoarrow';

test('large deterministic point set conserves membership and aggregates across the hierarchy', () => {
  const count = 50000;
  const coordinates = new Float64Array(count * 2);
  let randomState = 1234567;
  for (let index = 0; index < count; index++) {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    coordinates[index * 2] = (randomState / 2 ** 32) * 360 - 180;
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    coordinates[index * 2 + 1] = (randomState / 2 ** 32) * 160 - 80;
  }
  const clusters = new ClusterIndex(coordinates, {
    maxZoom: 10,
    aggregations: {total: {values: new Float64Array(count).fill(1), operation: 'sum'}}
  });
  for (const zoom of [0, 3, 7, 11]) {
    const nodes = clusters.getClusters([-180, -90, 180, 90], zoom);
    expect(nodes.reduce((total, node) => total + node.pointCount, 0)).toBe(count);
    expect(nodes.reduce((total, node) => total + node.properties.total, 0)).toBe(count);
    const rows = nodes.flatMap(node =>
      node.isCluster ? clusters.getLeaves(node.id, {limit: Infinity}) : [node.rowIndex!]
    );
    expect(new Set(rows).size).toBe(count);
  }
});
