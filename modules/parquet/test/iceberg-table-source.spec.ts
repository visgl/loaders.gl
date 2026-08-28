import {expect, test} from 'vitest';
import {IcebergTableSource} from '../src/iceberg-table-source';

function createMetadataUrl(metadata: unknown): string {
  return `data:application/json,${encodeURIComponent(JSON.stringify(metadata))}`;
}

test('IcebergTableSource validates explicit snapshot selectors and lifecycle', async () => {
  const source = new IcebergTableSource(
    createMetadataUrl({
      'format-version': 2,
      location: 'table',
      'current-snapshot-id': 42,
      refs: {release: {'snapshot-id': 41, type: 'tag'}},
      snapshots: [{'snapshot-id': 41}, {'snapshot-id': 42}]
    })
  );

  await expect(source.getCurrentSnapshot()).resolves.toMatchObject({'snapshot-id': 42});
  await expect(source.getScanPlan(undefined, 41)).resolves.toMatchObject({
    snapshotId: 41,
    snapshotRef: undefined,
    dataFiles: [],
    deleteFiles: []
  });
  await expect(source.getScanPlan(undefined, undefined, 'release')).resolves.toMatchObject({
    snapshotId: undefined,
    snapshotRef: 'release'
  });
  await expect(source.getScanPlan(undefined, 41, 'release')).rejects.toThrow(
    /mutually exclusive/
  );
  await expect(source.getScanPlan(undefined, undefined, 'missing')).rejects.toThrow(
    /reference not found/
  );

  await source.close();
  await expect(source.getMetadata()).rejects.toThrow(/closed/);
});

test.each([
  [{'format-version': 2, location: 'table', snapshots: {}}, /snapshots must be an array/],
  [{'format-version': 0, location: 'table'}, /Unsupported Iceberg metadata format version/],
  [{'format-version': 2, location: ''}, /location must be a non-empty string/]
])('IcebergTableSource rejects invalid metadata shape %o', async (metadata, error) => {
  await expect(new IcebergTableSource(createMetadataUrl(metadata)).getMetadata()).rejects.toThrow(
    error
  );
});

test('IcebergTableSource retries failed metadata and caches successful metadata', async () => {
  let requestCount = 0;
  const source = new IcebergTableSource('https://example.com/metadata.json');
  source.fetch = async () => {
    requestCount++;
    if (requestCount === 1) return new Response('unavailable', {status: 503});
    return new Response(
      JSON.stringify({'format-version': 2, location: 'table', 'current-snapshot-id': -1}),
      {headers: {'Content-Type': 'application/json'}}
    );
  };

  await expect(source.getMetadata()).rejects.toThrow(/HTTP 503/);
  await expect(source.getMetadata()).resolves.toMatchObject({location: 'table'});
  await expect(source.getMetadata()).resolves.toMatchObject({location: 'table'});
  expect(requestCount).toBe(2);
});
