// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import type {Mesh} from '@loaders.gl/schema';
import {PointCloudTiler, makeMeshArrowTable} from '@loaders.gl/schema-utils';
import type {PointCloudTilerNode, PointCloudTilerOptions} from '@loaders.gl/schema-utils';

/** Small fixture with midpoint, extreme and repeated points and stable IDs. */
function createPoints(count = 24): Mesh {
  const positions = new Float64Array(count * 3);
  for (let row = 0; row < count; row++)
    positions.set([row % 3, Math.floor(row / 3) % 3, Math.floor(row / 9) % 3], row * 3);
  return {
    topology: 'point-list',
    mode: 0,
    schema: {fields: [], metadata: {source: 'fixture'}},
    header: {vertexCount: count},
    attributes: {
      POSITION: {value: positions, size: 3},
      identifier: {value: Uint32Array.from({length: count}, (_, row) => row), size: 1},
      COLOR_0: {
        value: Uint8Array.from({length: count * 3}, (_, component) => component),
        size: 3,
        normalized: true
      }
    }
  };
}

/** Enumerates all additive nodes independently of a camera. */
async function collectNodes(tiler: PointCloudTiler): Promise<PointCloudTilerNode[]> {
  const nodes = [await tiler.getRootNode()];
  for (let index = 0; index < nodes.length; index++)
    nodes.push(...(await tiler.getChildNodes(nodes[index].id)));
  return nodes;
}

test.each([
  0, 1, 3
])('depth %s retains every point exactly once with exact attribute association', async maximumDepth => {
  const input = createPoints();
  const tiler = new PointCloudTiler(input, {nodePointLimit: 2, maximumDepth});
  try {
    const root = await tiler.getRootNode();
    expect(Object.isFrozen(root.bounds[0])).toBe(true);
    const nodes = await collectNodes(tiler);
    const identifiers: number[] = [];
    for (const node of nodes) {
      const tile = await tiler.getTileMesh(node.id);
      expect(tile.header!.vertexCount).toBe(node.pointCount);
      expect(tile.attributes.POSITION.value).toBeInstanceOf(Float64Array);
      expect(tile.schema.metadata.source).toBe('fixture');
      for (let row = 0; row < node.pointCount; row++) {
        const identifier = Number(tile.attributes.identifier.value[row]);
        identifiers.push(identifier);
        for (const name of ['POSITION', 'COLOR_0'])
          expect(Array.from(tile.attributes[name].value.subarray(row * 3, row * 3 + 3))).toEqual(
            Array.from(input.attributes[name].value.subarray(identifier * 3, identifier * 3 + 3))
          );
      }
    }
    expect(identifiers.sort((left, right) => left - right)).toEqual(
      Array.from({length: 24}, (_, row) => row)
    );
    expect(await collectNodes(tiler)).toEqual(nodes);
  } finally {
    tiler.close();
  }
  tiler.close();
  await expect(tiler.getRootNode()).rejects.toThrow('closed');
});

test('concurrent child requests share deterministic midpoint ownership', async () => {
  const tiler = new PointCloudTiler(createPoints(), {nodePointLimit: 1});
  try {
    const [first, second] = await Promise.all([tiler.getChildNodes('r'), tiler.getChildNodes('r')]);
    expect(first).toBe(second);
    expect(first.map(node => node.id)).toEqual([...first.map(node => node.id)].sort());
    for (const node of first) {
      const tile = await tiler.getTileMesh(node.id);
      for (let row = 0; row < node.pointCount; row++)
        for (let axis = 0; axis < 3; axis++)
          expect(Number(tile.attributes.POSITION.value[row * 3 + axis]) >= 1).toBe(
            Boolean(Number(node.id[1]) & (4 >> axis))
          );
      expect(await tiler.getNodeMetadata(node.id)).toBe(node);
    }
    await expect(tiler.getTileMesh('r999')).rejects.toThrow('unknown tile');
  } finally {
    tiler.close();
  }
});

test('Arrow input preserves exact uint64 IDs', async () => {
  const identifiers = new BigUint64Array([2n ** 63n, 2n ** 63n + 1n]);
  const input = makeMeshArrowTable({
    POSITION: {value: new Float64Array([1, 2, 3, 4, 5, 6]), size: 3},
    identifier: {value: identifiers, size: 1}
  });
  const tiler = new PointCloudTiler(input);
  try {
    expect((await tiler.getTileMesh('r')).attributes.identifier.value).toEqual(identifiers);
  } finally {
    tiler.close();
  }
});

test('strided coincident positions gather packed without losing rows', async () => {
  const input = createPoints(2);
  input.attributes.POSITION = {
    value: new Float32Array([99, 1, 2, 3, 99, 1, 2, 3]),
    size: 3,
    byteOffset: 4,
    byteStride: 16
  };
  const tiler = new PointCloudTiler(input, {nodePointLimit: 1});
  try {
    expect((await tiler.getRootNode()).pointCount).toBe(2);
    const tile = await tiler.getTileMesh('r');
    expect(tile.attributes.POSITION.value).toEqual(new Float32Array([1, 2, 3, 1, 2, 3]));
    expect(tile.attributes.POSITION.byteStride).toBe(0);
    expect(await tiler.getChildNodes('r')).toEqual([]);
  } finally {
    tiler.close();
  }
});

test('empty data provides an empty root', async () => {
  const tiler = new PointCloudTiler(createPoints(0));
  try {
    expect(await tiler.getRootNode()).toMatchObject({
      pointCount: 0,
      geometricError: 0,
      bounds: [
        [0, 0, 0],
        [0, 0, 0]
      ]
    });
    expect((await tiler.getTileMesh('r')).header!.vertexCount).toBe(0);
    expect(await tiler.getChildNodes('r')).toEqual([]);
  } finally {
    tiler.close();
  }
});

test.each([
  {nodePointLimit: 0},
  {nodePointLimit: 1_000_001},
  {maximumDepth: -1},
  {maximumDepth: 25},
  {maxInputBytes: NaN},
  {maxIndexBytes: 0},
  {maxTileBytes: 1.5},
  {maxNodes: Infinity}
])('invalid options %j fail before indexing', options => {
  expect(() => new PointCloudTiler(createPoints(), options)).toThrow('PointCloudTiler');
});

test.each([
  [
    'topology',
    (mesh: Mesh) => {
      mesh.topology = 'triangle-list';
    }
  ],
  [
    'indices',
    (mesh: Mesh) => {
      mesh.indices = {value: new Uint32Array(1), size: 1};
    }
  ],
  [
    'missing position',
    (mesh: Mesh) => {
      delete mesh.attributes.POSITION;
    }
  ],
  [
    'position width',
    (mesh: Mesh) => {
      mesh.attributes.POSITION.size = 2;
    }
  ],
  [
    'integer position',
    (mesh: Mesh) => {
      mesh.attributes.POSITION.value = new Uint32Array(72);
    }
  ],
  [
    'normalized position',
    (mesh: Mesh) => {
      mesh.attributes.POSITION.normalized = true;
    }
  ],
  [
    'invalid count',
    (mesh: Mesh) => {
      mesh.header!.vertexCount = -1;
    }
  ],
  [
    'nonfinite position',
    (mesh: Mesh) => {
      mesh.attributes.POSITION.value[0] = NaN;
    }
  ],
  [
    'unaligned offset',
    (mesh: Mesh) => {
      mesh.attributes.identifier.byteOffset = 1;
    }
  ],
  [
    'small stride',
    (mesh: Mesh) => {
      mesh.attributes.identifier.byteStride = 2;
    }
  ],
  [
    'short attribute',
    (mesh: Mesh) => {
      mesh.attributes.identifier.value = new Uint32Array(1);
    }
  ],
  [
    'extent overflow',
    (mesh: Mesh) => {
      mesh.attributes.POSITION.value[0] = -1e308;
      mesh.attributes.POSITION.value[3] = 1e308;
    }
  ]
] as const)('unsupported input: %s', async (_name, mutate) => {
  const mesh = createPoints();
  mutate(mesh);
  await expect(new PointCloudTiler(mesh).ready).rejects.toThrow('PointCloudTiler');
});

test.each([
  {maxInputBytes: 1},
  {maxIndexBytes: 1},
  {maxIndexBytes: 100, nodePointLimit: 2}
])('initial byte budgets %j reject allocation', async options => {
  await expect(new PointCloudTiler(createPoints(), options).ready).rejects.toThrow(
    'budget exceeded'
  );
});

test.each([
  [{maxTileBytes: 1}, 'tile'],
  [{maxNodes: 1, nodePointLimit: 1}, 'node'],
  [{maxIndexBytes: 200, nodePointLimit: 1}, 'index']
] as const)('later %j budget rejects', async (options, operation) => {
  const tiler = new PointCloudTiler(createPoints(), options as PointCloudTilerOptions);
  try {
    await tiler.ready;
    await expect(
      operation === 'tile' ? tiler.getTileMesh('r') : tiler.getChildNodes('r')
    ).rejects.toThrow('budget exceeded');
  } finally {
    tiler.close();
  }
});

test('Arrow buffers and null attributes are checked before conversion', async () => {
  const input = makeMeshArrowTable({POSITION: {value: new Float32Array([1, 2, 3]), size: 3}});
  await expect(new PointCloudTiler(input, {maxInputBytes: 1}).ready).rejects.toThrow(
    'input byte budget'
  );
  const nullable = {
    ...input,
    data: new arrow.Table({
      POSITION: input.data.getChild('POSITION')!,
      identifier: arrow.vectorFromArray([null], new arrow.Int32())
    })
  };
  await expect(new PointCloudTiler(nullable).ready).rejects.toThrow('null point attributes');
});

test('cancellation and close interrupt indexing', async () => {
  const controller = new AbortController();
  controller.abort(new Error('Canceled tiler'));
  await expect(
    new PointCloudTiler(createPoints(), {signal: controller.signal}).ready
  ).rejects.toThrow('Canceled tiler');
  const tiler = new PointCloudTiler(createPoints());
  tiler.close();
  await expect(tiler.ready).rejects.toThrow('closed');
});

test('packed positions infer their count and gathers are independent copies', async () => {
  const input = createPoints(2);
  delete input.header;
  const tiler = new PointCloudTiler(input);
  try {
    const first = await tiler.getTileMesh('r');
    first.attributes.POSITION.value[0] = -123;
    expect((await tiler.getTileMesh('r')).attributes.POSITION.value[0]).toBe(0);
    expect(tiler.pointCount).toBe(2);
  } finally {
    tiler.close();
  }
  input.attributes.POSITION.byteStride = 24;
  await expect(new PointCloudTiler(input).ready).rejects.toThrow('requires vertexCount');
});

test('closing a source immediately never reports readiness', async () => {
  const tiler = new PointCloudTiler(createPoints(0));
  tiler.close();
  await expect(tiler.ready).rejects.toThrow('closed');
});

test('retained buffer budgets count large backing buffers, and count shared buffers once', async () => {
  const input = createPoints(1);
  const backing = new Float64Array(100);
  input.attributes.POSITION.value = backing.subarray(0, 3);
  await expect(new PointCloudTiler(input, {maxInputBytes: 100}).ready).rejects.toThrow(
    'input byte budget'
  );
  input.attributes.identifier.value = new Uint32Array(backing.buffer, 0, 1);
  input.attributes.COLOR_0.value = new Uint8Array(backing.buffer, 0, 3);
  const tiler = new PointCloudTiler(input, {maxInputBytes: backing.byteLength});
  try {
    await tiler.ready;
    expect(tiler.pointCount).toBe(1);
  } finally {
    tiler.close();
  }
});

test('concurrent splits cannot exceed the discovered node budget', async () => {
  const mesh = createPoints(8);
  mesh.attributes.POSITION.value = Float64Array.from(
    [0, 1, 2, 3, 7, 8, 9, 10].flatMap(value => [value, value, value])
  );
  const tiler = new PointCloudTiler(mesh, {nodePointLimit: 1, maxNodes: 5});
  try {
    const children = await tiler.getChildNodes('r');
    expect(children.map(child => child.id)).toEqual(['r0', 'r7']);
    const results = await Promise.allSettled(children.map(child => tiler.getChildNodes(child.id)));
    expect(
      results.some(
        result => result.status === 'rejected' && result.reason.message.includes('node budget')
      )
    ).toBe(true);
    await expect(tiler.getRootNode()).rejects.toThrow('closed');
  } finally {
    tiler.close();
  }
});
