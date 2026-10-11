// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import type {Mesh} from '@loaders.gl/schema';
import {parse} from '@loaders.gl/core';
import {PotreeBinLoader} from '@loaders.gl/potree';
import {PointCloudTiler, convertTableToMesh, makeMeshArrowTable} from '@loaders.gl/schema-utils';
import {convertPointCloudToPotree, openPointCloudFile} from '@loaders.gl/tile-converter/v5/browser';
import {convertPointCloudToPotree as convertRoot} from '@loaders.gl/tile-converter/v5';
import {readZip} from 'test/common/read-zip';

/** Small native-coordinate dataset, including exact IDs above Number precision. */
function createPoints(includeIds = true): Mesh {
  return {
    topology: 'point-list',
    mode: 0,
    schema: {fields: [], metadata: {}},
    attributes: {
      POSITION: {size: 3, value: new Float64Array([1, 2, 3, 2, 3, 4, 3, 4, 5, 4, 5, 6])},
      COLOR_0: {size: 3, value: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])},
      CLASSIFICATION: {size: 1, value: new Uint8Array([1, 2, 3, 4])},
      ...(includeIds
        ? {
            id: {
              size: 1,
              value: new BigUint64Array([
                2n ** 63n + 1n,
                2n ** 63n + 2n,
                2n ** 63n + 3n,
                2n ** 63n + 4n
              ])
            }
          }
        : {})
    }
  };
}

/** Independent allocation ceilings force multiple sampled nodes without expensive input. */
const OPTIONS = {
  projection: 'EPSG:4978',
  maxGatheredBytes: 1024,
  maxOutputBytes: 16384,
  tiling: {
    nodePointLimit: 1,
    maximumDepth: 2,
    maxInputBytes: 1024,
    maxIndexBytes: 1024,
    maxTileBytes: 1024,
    maxNodes: 16
  },
  potree: {scale: [0.001, 0.001, 0.001] as [number, number, number], maxPositionError: 0},
  archive: {maxArchiveBytes: 32768}
};

afterEach(() => vi.restoreAllMocks());

test.each([
  'mesh',
  'arrow'
] as const)('Potree authoring preserves %s rows, octree addresses and exact attributes', async shape => {
  expect(convertRoot).toBe(convertPointCloudToPotree);
  const input = createPoints();
  const close = vi.spyOn(PointCloudTiler.prototype, 'close');
  const result = await convertPointCloudToPotree(
    shape === 'mesh' ? input : makeMeshArrowTable(input.attributes),
    OPTIONS
  );
  expect(close).toHaveBeenCalledOnce();
  expect(result.pointCount).toBe(4);
  expect(result.nodeCount).toBeGreaterThan(1);
  expect(result.dataset.metadata).toMatchObject({
    version: '2.0',
    points: 4,
    projection: 'EPSG:4978',
    encoding: 'DEFAULT'
  });
  const zip = await readZip(await result.archive!.arrayBuffer());
  for (const [path, bytes] of result.dataset.files)
    expect(new Uint8Array(zip.files[path])).toEqual(bytes);
  const opened = await openPointCloudFile(result.archive!, {
    format: 'potree-zip',
    maxFileBytes: 32768
  });
  try {
    const pending = [await opened.source.getRootTile()];
    const ids: string[] = [];
    const rows: {position: number[]; id: bigint; classification: number; color: number[]}[] = [];
    while (pending.length) {
      const header = pending.pop()!;
      ids.push(header.id);
      const content = await opened.source.loadTileContent(header);
      if (content) {
        const {attributes} = convertTableToMesh(content.data);
        for (let row = 0; row < content.pointCount; row++)
          rows.push({
            position: Array.from(attributes.POSITION.value.slice(row * 3, row * 3 + 3)),
            id: attributes.id.value[row] as bigint,
            classification: Number(attributes.CLASSIFICATION.value[row]),
            color: Array.from(attributes.COLOR_0.value.slice(row * 3, row * 3 + 3))
          });
      }
      pending.push(...(await opened.source.getChildren(header)));
    }
    expect(ids.length).toBe(result.nodeCount);
    expect(new Set(ids).size).toBe(result.nodeCount);
    expect(ids).toContain('r');
    expect(ids.every(id => /^r[0-7]*$/.test(id))).toBe(true);
    expect(rows.sort((left, right) => left.position[0] - right.position[0])).toEqual(
      [0, 1, 2, 3].map(row => ({
        position: Array.from(input.attributes.POSITION.value.slice(row * 3, row * 3 + 3)),
        id: input.attributes.id.value[row],
        classification: input.attributes.CLASSIFICATION.value[row],
        color: Array.from(input.attributes.COLOR_0.value.slice(row * 3, row * 3 + 3)).map(
          value => value * 257
        )
      }))
    );
  } finally {
    await opened.close();
  }
});

test.each([
  '1.3',
  '1.4',
  '1.8'
])('Potree %s uses the existing legacy writer profile', async version => {
  const points = createPoints(false);
  // Early binary versions only support positions and RGBA; removal is explicit.
  if (version === '1.3') delete points.attributes.CLASSIFICATION;
  const result = await convertPointCloudToPotree(points, {
    ...OPTIONS,
    projection: 'EPSG:3857',
    potree: {...OPTIONS.potree, version}
  });
  expect(result.dataset.metadata).toMatchObject({
    version,
    points: 4,
    projection: 'EPSG:3857'
  });
  const opened = await openPointCloudFile(result.archive!, {
    format: 'potree-zip',
    maxFileBytes: 32768
  });
  try {
    const pending = [await opened.source.getRootTile()];
    let count = 0;
    let nodes = 0;
    while (pending.length) {
      const header = pending.pop()!;
      nodes++;
      count += (await opened.source.loadTileContent(header))?.pointCount ?? 0;
      pending.push(...(await opened.source.getChildren(header)));
    }
    expect(count).toBe(4);
    expect(nodes).toBe(result.nodeCount);
  } finally {
    await opened.close();
  }
});

test('Potree files are deterministic, and zero-depth/empty roots retain the complete input', async () => {
  const options = {...OPTIONS, archive: undefined, tiling: {...OPTIONS.tiling, maximumDepth: 0}};
  const first = await convertPointCloudToPotree(createPoints(), options);
  const second = await convertPointCloudToPotree(createPoints(), options);
  expect(first.dataset.files).toEqual(second.dataset.files);
  expect(first.nodeCount).toBe(1);
  expect(first.archive).toBeUndefined();
  expect(first.dataset.metadata.points).toBe(4);
  const empty = createPoints();
  for (const attribute of Object.values(empty.attributes))
    attribute.value = attribute.value.slice(0, 0);
  const result = await convertPointCloudToPotree(empty, options);
  expect(result.pointCount).toBe(0);
  expect(result.nodeCount).toBe(1);
  expect(result.dataset.metadata.points).toBe(0);
});

test.each([
  {projection: ''},
  {maxGatheredBytes: 0},
  {maxOutputBytes: NaN},
  {maxGatheredBytes: undefined},
  {maxOutputBytes: undefined},
  {archive: {maxArchiveBytes: -1}}
])('Potree authoring rejects invalid declarations before indexing: %j', async patch => {
  const root = vi.spyOn(PointCloudTiler.prototype, 'getRootNode');
  await expect(
    convertPointCloudToPotree(createPoints(), {...OPTIONS, ...patch} as typeof OPTIONS)
  ).rejects.toThrow();
  expect(root).not.toHaveBeenCalled();
});

test.each([
  {maxGatheredBytes: 40},
  {maxOutputBytes: 1},
  {archive: {maxArchiveBytes: 1}},
  {tiling: {...OPTIONS.tiling, maxInputBytes: 1}},
  {potree: {...OPTIONS.potree, maxNodes: 1}},
  {potree: {...OPTIONS.potree, version: '1.8'}}
])('Potree authoring releases the tiler on limits and unsupported attributes: %j', async patch => {
  const close = vi.spyOn(PointCloudTiler.prototype, 'close');
  await expect(convertPointCloudToPotree(createPoints(), {...OPTIONS, ...patch})).rejects.toThrow();
  expect(close).toHaveBeenCalled();
});

test('Potree gathered bytes reject before the first allocation beyond the aggregate boundary', async () => {
  const points = createPoints();
  const total = Object.values(points.attributes).reduce(
    (bytes, attribute) => bytes + attribute.value.byteLength,
    0
  );
  const complete = await convertPointCloudToPotree(points, {...OPTIONS, maxGatheredBytes: total});
  expect(complete.pointCount).toBe(4);
  const gather = vi.spyOn(PointCloudTiler.prototype, 'getTileMesh');
  await expect(
    convertPointCloudToPotree(points, {...OPTIONS, maxGatheredBytes: total - 1})
  ).rejects.toThrow('gathered node byte budget');
  expect(gather.mock.calls.length).toBeLessThan(complete.nodeCount);
});

test('Potree cancellation before indexing and during gathering returns no partial files', async () => {
  const controller = new AbortController();
  const close = vi.spyOn(PointCloudTiler.prototype, 'close');
  const gather = PointCloudTiler.prototype.getTileMesh;
  vi.spyOn(PointCloudTiler.prototype, 'getTileMesh').mockImplementationOnce(async function (id) {
    const mesh = await gather.call(this, id);
    controller.abort(new Error('cancel Potree authoring'));
    return mesh;
  });
  await expect(
    convertPointCloudToPotree(createPoints(), {...OPTIONS, signal: controller.signal})
  ).rejects.toThrow('cancel Potree authoring');
  expect(close).toHaveBeenCalled();
  close.mockClear();
  await expect(
    convertPointCloudToPotree(createPoints(), {...OPTIONS, signal: controller.signal})
  ).rejects.toThrow('cancel Potree authoring');
  expect(close).not.toHaveBeenCalled();
});

test.each([
  'mesh',
  'arrow'
] as const)('Potree %s aliases remain canonical without extra gathered bytes', async shape => {
  const bytes = new Uint8Array(4 * 16);
  const view = new DataView(bytes.buffer);
  for (let row = 0; row < 4; row++) {
    for (let axis = 0; axis < 3; axis++) view.setInt32(row * 16 + axis * 4, row + axis + 1, true);
    bytes.set([row * 3 + 1, row * 3 + 2, row * 3 + 3, row + 1], row * 16 + 12);
  }
  const input = await parse(bytes.buffer, PotreeBinLoader, {
    worker: false,
    potree: {
      shape: shape === 'mesh' ? 'mesh' : 'arrow-table',
      pointAttributes: ['POSITION_CARTESIAN', 'RGB_PACKED', 'CLASSIFICATION'],
      scale: 1,
      positionOrigin: [0, 0, 0]
    }
  });
  const points = 'shape' in input ? convertTableToMesh(input) : input;
  const maxGatheredBytes =
    points.attributes.POSITION.value.byteLength +
    points.attributes.COLOR_0.value.byteLength +
    points.attributes.CLASSIFICATION.value.byteLength;
  const result = await convertPointCloudToPotree(input, {
    ...OPTIONS,
    maxGatheredBytes,
    archive: undefined
  });
  expect(result.dataset.metadata).toMatchObject({points: 4});
  expect(result.dataset.metadata).toHaveProperty('attributes');
  if ('attributes' in result.dataset.metadata)
    expect(result.dataset.metadata.attributes.map(attribute => attribute.name)).toEqual([
      'position',
      'rgb',
      'CLASSIFICATION'
    ]);
  const legacy = await convertPointCloudToPotree(points, {
    ...OPTIONS,
    maxGatheredBytes,
    archive: undefined,
    projection: 'EPSG:3857',
    potree: {...OPTIONS.potree, version: '1.8'}
  });
  expect(legacy.dataset.metadata).toMatchObject({
    pointAttributes: ['POSITION_CARTESIAN', 'RGB_PACKED', 'CLASSIFICATION'],
    points: 4
  });
  expect(points.attributes.POSITION_CARTESIAN.value).toBe(points.attributes.POSITION.value);
});
