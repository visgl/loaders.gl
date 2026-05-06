import {expect, test} from 'vitest';
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

  await new Promise(resolve => setTimeout(resolve, 0));

  expect(dataSourceManager.contains('source-a'), 'unused non-persistent DataSource is pruned').toBe(
    false
  );
  expect(dataSource.closeCount, 'pruned DataSource is closed').toBe(1);
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
