// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {waitForCondition} from '@loaders.gl/test-utils/vitest';
import type {DataSourceOptions} from '../../../src';
import {DataSource, DataSourceManager} from '../../../src';

/** Test DataSource that records lifecycle cleanup calls. */
class TestDataSource extends DataSource<string, DataSourceOptions> {
  /** Number of times this DataSource has been closed. */
  closeCount = 0;

  /** Closes this test DataSource. */
  async close(): Promise<void> {
    this.closeCount++;
  }
}

test('DataSourceManager#add and subscribe manages DataSource instances', () => {
  const dataSourceManager = new DataSourceManager();
  const dataSource = new TestDataSource('https://example.com/data', {});
  const changes: unknown[] = [];

  dataSourceManager.add({dataSourceId: 'source-a', dataSource});
  const subscribedDataSource = dataSourceManager.subscribe({
    dataSourceId: 'source-a',
    consumerId: 'consumer-a',
    onChange: updatedDataSource => changes.push(updatedDataSource)
  });

  expect(dataSourceManager.contains('source-a'), 'contains direct DataSource ids').toBe(true);
  expect(
    dataSourceManager.contains('datasource://source-a'),
    'contains protocol DataSource ids'
  ).toBe(true);
  expect(subscribedDataSource).toBe(dataSource);

  const replacementDataSource = new TestDataSource('https://example.com/replacement', {});
  dataSourceManager.add({dataSourceId: 'source-a', dataSource: replacementDataSource});

  expect(changes, 'subscriber receives replacement DataSource').toEqual([replacementDataSource]);
  expect(dataSource.closeCount, 'old DataSource is closed after replacement').toBe(1);
});

test('DataSourceManager#subscribe creates deferred DataSource placeholders', () => {
  const dataSourceManager = new DataSourceManager();
  const changes: unknown[] = [];

  const deferredDataSource = dataSourceManager.subscribe({
    dataSourceId: 'datasource://source-a',
    consumerId: 'consumer-a',
    onChange: updatedDataSource => changes.push(updatedDataSource)
  });

  expect(deferredDataSource, 'deferred placeholder returns null until populated').toBe(null);

  const dataSource = new TestDataSource('https://example.com/data', {});
  dataSourceManager.add({dataSourceId: 'source-a', dataSource});

  expect(changes, 'subscriber receives DataSource when placeholder is populated').toEqual([
    dataSource
  ]);
});

test('DataSourceManager#unsubscribe prunes unused non-persistent DataSources', async () => {
  const dataSourceManager = new DataSourceManager();
  const dataSource = new TestDataSource('https://example.com/data', {});

  dataSourceManager.add({dataSourceId: 'source-a', dataSource, persistent: false});
  dataSourceManager.subscribe({
    dataSourceId: 'source-a',
    consumerId: 'consumer-a',
    onChange: () => {}
  });
  dataSourceManager.unsubscribe({consumerId: 'consumer-a'});

  await waitForCondition(() => !dataSourceManager.contains('source-a'));

  expect(dataSourceManager.contains('source-a'), 'unused non-persistent DataSource is pruned').toBe(
    false
  );
  expect(dataSource.closeCount, 'pruned DataSource is closed').toBe(1);
});

test('DataSourceManager#getOrCreate deduplicates string data keys', async () => {
  const dataSourceManager = new DataSourceManager();
  const url = 'https://example.com/data';
  let createCount = 0;

  const firstDataSource = dataSourceManager.getOrCreate({
    data: url,
    createDataSource: () => {
      createCount++;
      return new TestDataSource(url, {});
    }
  }) as TestDataSource;
  const secondDataSource = dataSourceManager.getOrCreate({
    data: url,
    createDataSource: () => {
      createCount++;
      return new TestDataSource(url, {});
    }
  }) as TestDataSource;

  expect(firstDataSource, 'first getOrCreate returns a DataSource').toBeInstanceOf(TestDataSource);
  expect(secondDataSource, 'second getOrCreate returns the existing DataSource').toBe(
    firstDataSource
  );
  expect(createCount, 'matching string data only creates one DataSource').toBe(1);

  await dataSourceManager.release(url);
  expect(firstDataSource.closeCount, 'first release keeps the retained DataSource open').toBe(0);
  await dataSourceManager.release(url);
  expect(firstDataSource.closeCount, 'second release closes the DataSource').toBe(1);
});

test('DataSourceManager#getOrCreate deduplicates pending DataSource promises', async () => {
  const dataSourceManager = new DataSourceManager();
  const dataSource = new TestDataSource('https://example.com/data', {});
  let createCount = 0;
  let resolveDataSource: (dataSource: TestDataSource) => void = () => {};
  const dataSourcePromise = new Promise<TestDataSource>(resolve => {
    resolveDataSource = resolve;
  });

  const firstDataSourcePromise = dataSourceManager.getOrCreate({
    dataSourceId: 'source-a',
    createDataSource: () => {
      createCount++;
      return dataSourcePromise;
    }
  });
  const secondDataSourcePromise = dataSourceManager.getOrCreate({
    dataSourceId: 'source-a',
    createDataSource: () => {
      createCount++;
      return new TestDataSource('https://example.com/duplicate', {});
    }
  });

  expect(secondDataSourcePromise, 'concurrent getOrCreate returns the same pending promise').toBe(
    firstDataSourcePromise
  );
  expect(createCount, 'pending DataSource is only created once').toBe(1);

  resolveDataSource(dataSource);
  expect(await firstDataSourcePromise, 'pending promise resolves to the created DataSource').toBe(
    dataSource
  );

  await dataSourceManager.release('source-a');
  await dataSourceManager.release('source-a');
});

test('DataSourceManager#release closes when retain count reaches zero', async () => {
  const dataSourceManager = new DataSourceManager();
  const dataSource = new TestDataSource('https://example.com/data', {});

  dataSourceManager.getOrCreate({
    dataSourceId: 'source-a',
    createDataSource: () => dataSource
  });
  dataSourceManager.getOrCreate({
    dataSourceId: 'source-a',
    createDataSource: () => new TestDataSource('https://example.com/duplicate', {})
  });

  await dataSourceManager.release('datasource://source-a');
  expect(dataSource.closeCount, 'first release keeps one retained DataSource open').toBe(0);
  expect(dataSourceManager.contains('source-a'), 'DataSource remains registered').toBe(true);

  await dataSourceManager.release('source-a');
  expect(dataSource.closeCount, 'final release closes the DataSource').toBe(1);
  expect(dataSourceManager.contains('source-a'), 'DataSource is removed after final release').toBe(
    false
  );
});

test('DataSourceManager#release waits for subscribers before pruning non-persistent sources', async () => {
  const dataSourceManager = new DataSourceManager();
  const dataSource = new TestDataSource('https://example.com/data', {});

  dataSourceManager.getOrCreate({
    dataSourceId: 'source-a',
    createDataSource: () => dataSource,
    persistent: false
  });
  dataSourceManager.subscribe({
    dataSourceId: 'source-a',
    consumerId: 'consumer-a',
    onChange: () => {}
  });

  await dataSourceManager.release('source-a');
  expect(dataSource.closeCount, 'release keeps subscribed DataSource open').toBe(0);
  expect(dataSourceManager.contains('source-a'), 'subscribed DataSource remains registered').toBe(
    true
  );

  dataSourceManager.unsubscribe({consumerId: 'consumer-a'});
  await waitForCondition(() => !dataSourceManager.contains('source-a'));

  expect(dataSource.closeCount, 'unsubscribed non-persistent DataSource is pruned').toBe(1);
  expect(dataSourceManager.contains('source-a'), 'pruned DataSource is removed').toBe(false);
});

test('DataSourceManager#getOrCreate deduplicates object data by identity', async () => {
  const dataSourceManager = new DataSourceManager();
  const firstData = {url: 'https://example.com/data'};
  const secondData = {url: 'https://example.com/data'};
  let createCount = 0;

  const firstDataSource = dataSourceManager.getOrCreate({
    data: firstData,
    createDataSource: () => {
      createCount++;
      return new TestDataSource(firstData.url, {});
    }
  });
  const secondDataSource = dataSourceManager.getOrCreate({
    data: firstData,
    createDataSource: () => {
      createCount++;
      return new TestDataSource(firstData.url, {});
    }
  });
  const thirdDataSource = dataSourceManager.getOrCreate({
    data: secondData,
    createDataSource: () => {
      createCount++;
      return new TestDataSource(secondData.url, {});
    }
  });

  expect(secondDataSource, 'same object identity returns existing DataSource').toBe(
    firstDataSource
  );
  expect(
    thirdDataSource,
    'matching object contents with different identity creates a new source'
  ).not.toBe(firstDataSource);
  expect(createCount, 'one DataSource is created per object identity').toBe(2);

  await dataSourceManager.finalize();
});

test('DataSourceManager#remove and finalize close managed DataSources', async () => {
  const dataSourceManager = new DataSourceManager();
  const firstDataSource = new TestDataSource('https://example.com/first', {});
  const secondDataSource = new TestDataSource('https://example.com/second', {});

  dataSourceManager.add({dataSourceId: 'source-a', dataSource: firstDataSource});
  dataSourceManager.add({dataSourceId: 'source-b', dataSource: secondDataSource});

  await dataSourceManager.remove('source-a');
  await dataSourceManager.finalize();

  expect(dataSourceManager.contains('source-a'), 'removed DataSource is gone').toBe(false);
  expect(dataSourceManager.contains('source-b'), 'finalized DataSource is gone').toBe(false);
  expect(firstDataSource.closeCount, 'removed DataSource is closed').toBe(1);
  expect(secondDataSource.closeCount, 'finalized DataSource is closed').toBe(1);
});
