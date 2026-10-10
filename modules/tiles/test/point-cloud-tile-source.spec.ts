// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {Mesh} from '@loaders.gl/schema';
import {
  PointCloudTileSourceLoader,
  PointCloudTileset,
  createTilesetSpatialReference
} from '@loaders.gl/tiles';
import {PointCloudTileSourceLoaderWithParser} from '../src/point-cloud-tile-source-loader';
import {PointCloudTileSource} from '../src/point-cloud-tile-source';

/** Minimal native-coordinate point data with a scalar attribute. */
function createInput(count = 4): Mesh {
  return {
    topology: 'point-list',
    mode: 0,
    schema: {fields: [], metadata: {}},
    header: {vertexCount: count},
    attributes: {
      POSITION: {
        value: Float64Array.from({length: count * 3}, (_, component) => component),
        size: 3
      },
      classification: {value: Uint8Array.from({length: count}, (_, row) => row), size: 1}
    }
  };
}

test('dynamic point source satisfies the native PointCloudTileset source contract', async () => {
  const spatialReference = createTilesetSpatialReference({sourceCrs: 'EPSG:4978'});
  const source = PointCloudTileSourceLoaderWithParser.createDataSource(createInput(), {
    pointCloudTiler: {nodePointLimit: 1, spatialReference}
  });
  try {
    await source.initialize();
    expect(source.isReady).toBe(true);
    expect(await source.getMetadata()).toEqual({pointCount: 4, refinement: 'ADD'});
    const root = await source.getRootTile();
    expect(root.boundingVolume.coordinateFrame).toBe('cartesian');
    const nodes = [root];
    const classifications: number[] = [];
    for (let index = 0; index < nodes.length; index++) {
      const content = await source.loadTileContent(nodes[index]);
      expect(content!.coordinateSystem).toBe('cartesian');
      expect(content!.cartographicOrigin).toEqual([0, 0, 0]);
      expect(content!.spatialReference).toEqual(spatialReference);
      expect(content!.data.data.getChild('POSITION')!.type.toString()).toContain('Float64');
      classifications.push(...Array.from(content!.data.data.getChild('classification')!.toArray()));
      const forged = {
        ...nodes[index],
        boundingVolume: {...nodes[index].boundingVolume, radius: -1}
      };
      expect((await source.loadTileContent(forged))!.spatialBoundingVolume!.radius).toBeGreaterThan(
        0
      );
      nodes.push(...(await source.getChildren(nodes[index])));
    }
    expect(classifications.sort()).toEqual([0, 1, 2, 3]);
  } finally {
    source.close();
  }
  source.close();
  expect(source.isReady).toBe(false);
  expect(source.data).toBeNull();
  await expect(source.initialize()).rejects.toThrow('closed');
  await expect(source.getMetadata()).rejects.toThrow('closed');
});

test('empty source has no content and input defaults do not imply a CRS', async () => {
  const source = new PointCloudTileSource(createInput(0));
  try {
    await source.ready;
    const root = await source.getRootTile();
    expect(await source.loadTileContent(root)).toBeNull();
    expect(await source.getChildren(root)).toEqual([]);
  } finally {
    source.close();
  }
});

test('metadata preloads the explicit runtime and rejects direct construction', async () => {
  expect(PointCloudTileSourceLoader.testURL()).toBe(false);
  expect(() => PointCloudTileSourceLoader.createDataSource(createInput())).toThrow('preload');
  const runtime = await PointCloudTileSourceLoader.preload();
  expect(runtime.createDataSource).toBeTypeOf('function');
  for (const input of ['https://example.invalid/points.las', new Blob()])
    expect(() => runtime.createDataSource(input, {})).toThrow('decoded Mesh/Arrow');
  const source = runtime.createDataSource(createInput(), {});
  try {
    await source.initialize();
    expect(source.isReady).toBe(true);
  } finally {
    source.close();
  }
});

test('source propagates rejected input and cancellation', async () => {
  const controller = new AbortController();
  controller.abort(new Error('Canceled point source'));
  const canceled = new PointCloudTileSource(createInput(), {
    pointCloudTiler: {signal: controller.signal}
  });
  await expect(canceled.ready).rejects.toThrow('Canceled point source');
  expect(canceled.isReady).toBe(false);
  canceled.close();
  const invalid = createInput();
  invalid.topology = 'triangle-list';
  const source = new PointCloudTileSource(invalid);
  await expect(source.ready).rejects.toThrow('point-list');
  source.close();
});

test('PointCloudTileset selects dynamic parent and descendants additively', async () => {
  const source = new PointCloudTileSource(createInput(), {pointCloudTiler: {nodePointLimit: 1}});
  const tileset = new PointCloudTileset(source, {
    debounceTime: 0,
    minimumNodePixelSize: 0,
    pointBudget: 4
  });
  try {
    await tileset.selectTiles({
      id: 'native',
      width: 400,
      height: 400,
      project: ([x, y]) => [x * 10, y * 10]
    } as any);
    expect(tileset.selectedTiles.map(tile => tile.id)).toContain('r');
    expect(tileset.selectedTiles.reduce((count, tile) => count + tile.pointCount, 0)).toBe(4);
  } finally {
    tileset.destroy();
    source.close();
  }
});

test('close during initial indexing cannot later report readiness', async () => {
  const source = new PointCloudTileSource(createInput(0));
  source.close();
  await expect(source.ready).rejects.toThrow('closed');
  expect(source.isReady).toBe(false);
});

test('initialize alone handles the shared readiness rejection', async () => {
  const input = createInput();
  input.topology = 'triangle-list';
  const source = new PointCloudTileSource(input);
  await expect(source.initialize()).rejects.toThrow('point-list');
  await new Promise<void>(resolve => setTimeout(resolve, 0));
  source.close();
});
