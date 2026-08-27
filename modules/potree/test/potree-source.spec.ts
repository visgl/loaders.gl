// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {PotreeSourceLoader} from '@loaders.gl/potree';

const POTREE_BIN_URL = '@loaders.gl/potree/test/data/lion_takanawa';

test('PotreeSourceLoader#initialize', async () => {
  const source = PotreeSourceLoader.createDataSource(POTREE_BIN_URL, {});
  expect(source.isReady).toBe(false);

  await source.init();

  expect(source.isReady).toBe(true);
  expect(source.metadata?.version).toBe('1.7');
  expect(source.root?.header.childCount).toBe(6);
  expect(source.isSupported()).toBe(true);
});

test('PotreeSourceLoader#loadNodeContent decodes typed point attributes', async () => {
  const source = PotreeSourceLoader.createDataSource(POTREE_BIN_URL, {});
  await source.initialize();

  const nodeContent = await source.loadNodeContent('0');

  expect(nodeContent).toBeTruthy();
  expect(nodeContent?.header?.vertexCount).toBe(4511);
  expect(nodeContent?.attributes.positions?.value.length).toBe(4511 * 3);
  expect(nodeContent?.attributes.colors?.value.length).toBe(4511 * 3);
  expect(nodeContent?.attributes.NORMAL_SPHEREMAPPED?.value.length).toBe(4511 * 2);
});

test('PotreeSourceLoader#exposes normalized tile headers and bounds', async () => {
  const source = PotreeSourceLoader.createDataSource(POTREE_BIN_URL, {});
  await source.initialize();

  const rootTile = await source.getRootTile();
  const childTiles = await source.getChildren(rootTile);
  const childZero = childTiles.find(tile => tile.id === 'r0');

  expect(rootTile.id).toBe('r');
  expect(rootTile.level).toBe(0);
  expect(rootTile.boundingVolume.radius).toBeGreaterThan(0);
  expect(childTiles.length).toBeGreaterThan(0);
  expect(childZero).toBeTruthy();

  const [rootMinimum, rootMaximum] = rootTile.boundingVolume.cartographicBounds;
  const [childMinimum, childMaximum] = childZero!.boundingVolume.cartographicBounds;
  expect(childMinimum[0]).toBe(rootMinimum[0]);
  expect(childMaximum[0]).toBe((rootMinimum[0] + rootMaximum[0]) / 2);
  expect(childMinimum[1]).toBe(rootMinimum[1]);
  expect(childMaximum[1]).toBe((rootMinimum[1] + rootMaximum[1]) / 2);
  expect(childMinimum[2]).toBe(rootMinimum[2]);
  expect(childMaximum[2]).toBe((rootMinimum[2] + rootMaximum[2]) / 2);
});

test('PotreeSourceLoader#exposes conclusive point-cloud scan metadata', async () => {
  const source = PotreeSourceLoader.createDataSource(POTREE_BIN_URL, {});
  await source.initialize();

  const metadata = await source.getQueryMetadata();

  expect(metadata.queryType).toBe('point-cloud');
  expect(metadata.execution).toEqual({status: 'supported', method: 'scan'});
  expect(metadata.columns.some(column => column.role === 'color')).toBe(true);
  expect(metadata.capabilities.bounds).toBe('pushdown');
  expect(metadata.capabilities.table?.projection).toBe('residual');
  expect(metadata.spatial?.bounds?.minimum).toHaveLength(3);
});

test('PotreeSourceLoader#scans ordered Arrow point batches with a global limit', async () => {
  const source = PotreeSourceLoader.createDataSource(POTREE_BIN_URL, {});
  const metadata = await source.getQueryMetadata();
  const bounds = metadata.spatial?.bounds;
  expect(bounds).toBeTruthy();
  const batches = [];

  for await (const batch of source.scan({
    columns: ['POSITION_CARTESIAN', 'COLOR_PACKED'],
    bounds: {
      minimum: bounds!.minimum as [number, number, number],
      maximum: bounds!.maximum as [number, number, number]
    },
    maximumLevel: 1,
    limit: 25,
    batchSize: 10
  })) {
    batches.push(batch);
  }

  expect(batches.map(batch => batch.length)).toEqual([10, 10, 5]);
  expect(batches[0].schema.fields.map(field => field.name)).toEqual([
    'POSITION_CARTESIAN',
    'COLOR_PACKED'
  ]);
  expect(batches[0].data.getChild('POSITION_CARTESIAN')).toBeTruthy();
  expect(batches[0].data.getChild('COLOR_PACKED')).toBeTruthy();
});

test('PotreeSourceLoader#preserves rows in an empty projection', async () => {
  const source = PotreeSourceLoader.createDataSource(POTREE_BIN_URL, {});
  const batches = [];

  for await (const batch of source.scan({columns: [], maximumLevel: 0, limit: 2})) {
    batches.push(batch);
  }

  expect(batches.map(batch => batch.length)).toEqual([2]);
  expect(batches[0].data.numCols).toBe(0);
});

test('PotreeSourceLoader#does not advertise unsupported datasets as executable', async () => {
  const source = PotreeSourceLoader.createDataSource(POTREE_BIN_URL, {});
  await source.initialize();
  source.metadata!.version = '2.0';

  const metadata = await source.getQueryMetadata();
  expect(metadata.execution).toMatchObject({status: 'metadata-only'});

  const scan = source.scan();
  await expect(scan.next()).rejects.toThrow('not supported');
});

test('PotreeSourceLoader#validates scan batch size and cancellation', async () => {
  const source = PotreeSourceLoader.createDataSource(POTREE_BIN_URL, {});
  const invalidScan = source.scan({batchSize: 0});
  await expect(invalidScan.next()).rejects.toThrow('batchSize');

  const controller = new AbortController();
  controller.abort();
  const cancelledScan = source.scan({signal: controller.signal});
  await expect(cancelledScan.next()).rejects.toMatchObject({name: 'AbortError'});
});
