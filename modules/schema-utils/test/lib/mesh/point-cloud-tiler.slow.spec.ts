// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {PointCloudTiler} from '@loaders.gl/schema-utils';
import type {Mesh} from '@loaders.gl/schema';

/** Generated scale fixture kept out of the fast suite. */
function createLargeInput(): Mesh {
  const count = 100000;
  return {
    topology: 'point-list',
    mode: 0,
    schema: {fields: [], metadata: {}},
    header: {vertexCount: count},
    attributes: {
      POSITION: {
        size: 3,
        value: Float64Array.from({length: count * 3}, (_, component) => {
          const row = Math.floor(component / 3);
          return component % 3 === 0
            ? row % 100
            : component % 3 === 1
              ? Math.floor(row / 100) % 100
              : Math.floor(row / 10000);
        })
      },
      identifier: {size: 1, value: Uint32Array.from({length: count}, (_, row) => row)}
    }
  };
}

test('100000 points partition lazily with complete additive ownership', async () => {
  const tiler = new PointCloudTiler(createLargeInput(), {nodePointLimit: 4096, maximumDepth: 3});
  try {
    const nodes = [await tiler.getRootNode()];
    const seen = new Uint8Array(100000);
    for (let index = 0; index < nodes.length; index++) {
      const mesh = await tiler.getTileMesh(nodes[index].id);
      for (const identifier of mesh.attributes.identifier.value) {
        expect(seen[Number(identifier)]).toBe(0);
        seen[Number(identifier)] = 1;
      }
      nodes.push(...(await tiler.getChildNodes(nodes[index].id)));
    }
    expect(seen.every(value => value === 1)).toBe(true);
    expect(nodes.length).toBeGreaterThan(8);
  } finally {
    tiler.close();
  }
});

test('cancellation interrupts gathering a large terminal tile', async () => {
  const controller = new AbortController();
  const tiler = new PointCloudTiler(createLargeInput(), {
    maximumDepth: 0,
    signal: controller.signal
  });
  try {
    await tiler.ready;
    const gathering = tiler.getTileMesh('r');
    controller.abort(new Error('Stop gathering'));
    await expect(gathering).rejects.toThrow('Stop gathering');
  } finally {
    tiler.close();
  }
});
