// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {encodeSync} from '@loaders.gl/core';
import {COPCWriter} from '@loaders.gl/copc';
import {deduceMeshSchema} from '@loaders.gl/schema-utils';
import {Copc} from 'copc';
import {expect, test} from 'vitest';

test('COPCWriter output is readable by the independent copc implementation', async () => {
  const mesh = createConformanceMesh();
  const arrayBuffer = encodeSync(mesh, COPCWriter, {
    copc: {
      nodePointLimit: 2,
      maximumDepth: 8,
      hierarchyPageDepth: 1,
      pointDataRecordFormat: 7,
      scale: [0.01, 0.01, 0.01],
      wkt: 'LOCAL_CS["loaders.gl COPCWriter conformance"]'
    }
  });
  const getBytes = async (begin: number, end: number): Promise<Uint8Array> =>
    new Uint8Array(arrayBuffer.slice(begin, end));
  const copc = await Copc.create(getBytes);
  const pendingPages = [copc.info.rootHierarchyPage];
  const nodes = [];
  let pageCount = 0;

  while (pendingPages.length > 0) {
    const page = pendingPages.shift()!;
    const hierarchy = await Copc.loadHierarchyPage(getBytes, page);
    nodes.push(...Object.values(hierarchy.nodes));
    for (const childPage of Object.values(hierarchy.pages)) {
      if (childPage) {
        pendingPages.push(childPage);
      }
    }
    pageCount++;
  }

  expect(copc.header.pointDataRecordFormat).toBe(7);
  expect(copc.header.pointCount).toBe(mesh.attributes.POSITION.value.length / 3);
  expect(copc.wkt).toBe('LOCAL_CS["loaders.gl COPCWriter conformance"]');
  expect(pageCount).toBeGreaterThan(1);
  expect(nodes.reduce((sum, node) => sum + node.pointCount, 0)).toBe(copc.header.pointCount);
  const compressedRoot = await Copc.loadCompressedPointDataBuffer(getBytes, nodes[0]);
  expect(compressedRoot.byteLength).toBe(nodes[0].pointDataLength);
});

/** Create a deterministic point cloud with a deep, sparse octree. */
function createConformanceMesh() {
  const positions: number[] = [];
  const colors: number[] = [];
  const gpsTimes: number[] = [];
  for (let pointIndex = 0; pointIndex < 64; pointIndex++) {
    const reversedBits = Number.parseInt(
      pointIndex.toString(2).padStart(6, '0').split('').reverse().join(''),
      2
    );
    positions.push(pointIndex * 2, reversedBits * 3, (pointIndex % 7) * 11);
    colors.push(pointIndex, 255 - pointIndex, pointIndex * 3);
    gpsTimes.push(20_000 + pointIndex / 4);
  }
  const attributes = {
    POSITION: {value: new Float64Array(positions), size: 3},
    COLOR_0: {value: new Uint16Array(colors), size: 3},
    gpsTime: {value: new Float64Array(gpsTimes), size: 1}
  };
  return {
    attributes,
    topology: 'point-list' as const,
    mode: 0,
    schema: deduceMeshSchema(attributes, {topology: 'point-list', mode: '0'})
  };
}
