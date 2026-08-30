import {expect, test, vi} from 'vitest';
import * as arrow from 'apache-arrow';
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

test('IcebergTableSource plans mixed manifests and normalizes manifest metadata', async () => {
  const source = new IcebergTableSource('metadata.json') as any;
  source.getMetadata = async () => ({
    'format-version': 2,
    location: 's3://coverage-bucket/table',
    'current-snapshot-id': 9,
    'current-schema-id': 3,
    snapshots: [{'snapshot-id': 9, 'manifest-list': 'metadata/list.avro'}]
  });
  source.readAvroRecords = vi
    .fn()
    .mockResolvedValueOnce([
      {manifest_path: 'data.avro', content: 'data', partition_spec_id: 4},
      {manifest_path: 'delete.avro', content: 'deletes', partition_spec_id: 4},
      {manifest_path: 'ignored.avro', content: 'unknown'}
    ])
    .mockResolvedValueOnce([
      {status: 2, data_file: {file_path: 'deleted.parquet', file_format: 'PARQUET'}},
      {status: 'DELETE', data_file: {file_path: 'also-deleted.parquet'}},
      {status: 1},
      {
        status: 1,
        data_file: {
          file_path: 'data/part.parquet',
          file_format: 'PARQUET',
          file_size_in_bytes: 10,
          record_count: 2,
          partition: new Map([['region', 'west']]),
          lower_bounds: {'1': new Uint8Array([0, 0, 0, 1])},
          upper_bounds: {'1': new Uint8Array([0, 0, 0, 9])},
          data_sequence_number: 5
        }
      },
      {status: 1, data_file: {file_path: 'data/ignored.csv', file_format: 'CSV'}}
    ])
    .mockResolvedValueOnce([
      {
        status: 1,
        data_file: {
          file_path: 'deletes/rows.avro',
          file_format: 'AVRO',
          content: 'equality',
          equality_ids: {toArray: () => [{value: 1}, 2n]},
          referenced_data_file: 'data/part.parquet',
          partition: {region: 'west'},
          data_sequence_number: 6
        }
      }
    ]);

  const plan = await source.getScanPlan();
  expect(plan.dataFiles).toMatchObject([
    {
      data: 'https://s3.amazonaws.com/coverage-bucket/table/data/part.parquet',
      fileSize: 10,
      recordCount: 2,
      partition: {region: 'west'},
      schemaId: 3,
      dataSequenceNumber: 5
    }
  ]);
  expect(plan.deleteFiles).toMatchObject([
    {
      data: 'https://s3.amazonaws.com/coverage-bucket/table/deletes/rows.avro',
      equalityFieldIds: [1, 2],
      referencedDataFile:
        'https://s3.amazonaws.com/coverage-bucket/table/data/part.parquet',
      partition: {region: 'west'}
    }
  ]);
});

test('IcebergTableSource applies delete variants, projection, and telemetry cheaply', async () => {
  const source = new IcebergTableSource('metadata.json') as any;
  source.getMetadata = async () => ({'format-version': 2, location: 'table'});
  source.getScanPlan = async () => ({
    dataFiles: [{data: 'table/data.parquet'}],
    deleteFiles: []
  });
  source.loadPositionDeletes = async () =>
    new Map([
      [
        'table/data.parquet',
        [
          {positions: new Set([0]), dataSequenceNumber: 5},
          {positions: new Set([1]), dataSequenceNumber: 2}
        ]
      ]
    ]);
  source.loadEqualityDeletes = async () => [
    {fields: ['id'], rows: [[3n]], partition: {region: 'west'}, dataSequenceNumber: 5},
    {fields: ['payload'], rows: [[new Uint8Array([4, 5])]]},
    {fields: ['when'], rows: [[new Date('2020-01-04')]], partition: {region: 'east'}}
  ];
  const close = vi.fn();
  source.createParquetDataset = () => ({
    async *read(options: any) {
      options.onTelemetry({status: 'completed', rowsReturned: 4, sourceType: 'parquet'});
      yield {
        shape: 'arrow-table',
        schema: {fields: []},
        data: arrow.tableFromArrays({
          id: [1, 2, 3, 4],
          payload: arrow.vectorFromArray(
            [
              new Uint8Array([1]),
              new Uint8Array([2]),
              new Uint8Array([3]),
              new Uint8Array([4, 5])
            ],
            new arrow.Binary()
          ),
          when: [
            new Date('2020-01-01'),
            new Date('2020-01-02'),
            new Date('2020-01-03'),
            new Date('2020-01-04')
          ]
        }),
        length: 4,
        rowCount: 4,
        rowOffset: 0,
        rowGroupRowOffset: 10,
        source: 'table/data.parquet',
        sourceUrl: 'table/data.parquet',
        datasetPartitions: {region: 'west'},
        datasetFileMetadata: {iceberg: {dataSequenceNumber: 3}},
        metadata: {rowCount: 4}
      };
    },
    close
  });
  const telemetry = vi.fn();
  const batches = [];
  for await (const batch of source.read({
    applyDeletes: true,
    columns: ['id'],
    onTelemetry: telemetry
  })) {
    batches.push(batch);
  }

  expect(batches).toHaveLength(1);
  expect(Array.from(batches[0].data.getChild('id')?.toArray() || [])).toEqual([2]);
  expect(batches[0].rowIndices).toEqual([1]);
  expect(batches[0].rowGroupRowIndices).toEqual([11]);
  expect(telemetry).toHaveBeenCalledWith(expect.objectContaining({status: 'completed', rowsReturned: 1}));
  expect(close).toHaveBeenCalledOnce();
});

test('IcebergTableSource closes delegated metadata and explain sources', async () => {
  const source = new IcebergTableSource('metadata.json') as any;
  source.getMetadata = async () => ({'format-version': 2, location: 'table'});
  source.getScanPlan = async () => ({
    dataFiles: [{data: 'a.parquet', recordCount: 3, fileSize: 20}],
    deleteFiles: []
  });
  const close = vi.fn();
  source.createParquetDataset = () => ({
    getSchema: async () => ({fields: [{name: 'id', type: 'int32', nullable: true}], metadata: {}}),
    getScanPlan: async () => ({files: ['a.parquet']}),
    close
  });

  await expect(source.getQueryMetadata()).resolves.toMatchObject({
    sourceType: 'iceberg',
    statistics: {rowCount: 3, byteLength: 20}
  });
  await expect(source.explain()).resolves.toEqual({files: ['a.parquet']});
  expect(close).toHaveBeenCalledTimes(2);

  source.getScanPlan = async () => ({dataFiles: [], deleteFiles: []});
  await expect(source.getQueryMetadata()).rejects.toThrow(/no active Parquet/);
});

test('IcebergTableSource loads and validates position and equality delete records', async () => {
  const source = new IcebergTableSource('metadata.json') as any;
  source.readAvroRecords = vi
    .fn()
    .mockResolvedValueOnce([
      {file_path: 'data.parquet', pos: 2},
      {file_path: 'data.parquet', pos: 4},
      {file_path: null, pos: 5}
    ])
    .mockResolvedValueOnce([{id: 7}, {'1': 8}]);

  const positions = await source.loadPositionDeletes(
    [
      {data: 'ignored', format: 'AVRO', content: 'equality'},
      {data: 'positions', format: 'AVRO', content: 1, dataSequenceNumber: 10}
    ],
    'https://example.com/table'
  );
  expect([...positions.get('https://example.com/table/data.parquet')[0].positions]).toEqual([2, 4]);

  const metadata = {
    'format-version': 2,
    location: 'table',
    'current-schema-id': 1,
    schemas: [{'schema-id': 1, fields: [{id: 1, name: 'id'}]}]
  };
  const equality = await source.loadEqualityDeletes(
    [
      {data: 'ignored', format: 'AVRO', content: 'position'},
      {
        data: 'equality',
        format: 'AVRO',
        content: 2,
        equalityFieldIds: [1],
        schemaId: 1
      }
    ],
    metadata
  );
  expect(equality[0].rows).toEqual([[7], [8]]);

  await expect(
    source.loadEqualityDeletes(
      [{data: 'bad', format: 'PARQUET', content: 'equality', equalityFieldIds: [1]}],
      metadata
    )
  ).rejects.toThrow(/Unsupported equality delete format/);
  await expect(
    source.loadEqualityDeletes([{data: 'bad', format: 'AVRO', content: 'equality'}], metadata)
  ).rejects.toThrow(/no field IDs/);
  await expect(
    source.loadEqualityDeletes(
      [{data: 'bad', format: 'AVRO', content: 'equality', equalityFieldIds: [99]}],
      metadata
    )
  ).rejects.toThrow(/field ID 99/);
});

test('IcebergTableSource prunes bounds, spatial envelopes, and partition transforms', async () => {
  const source = new IcebergTableSource('metadata.json') as any;
  const intBytes = (value: number) => {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setInt32(0, value, false);
    return bytes;
  };
  const metadata = {
    'format-version': 2,
    location: 'table',
    'current-schema-id': 1,
    schemas: [
      {
        'schema-id': 1,
        fields: [
          {id: 1, name: 'id', type: 'int'},
          {id: 2, name: 'geometry', type: 'string'},
          {id: 3, name: 'region', type: 'string'}
        ]
      }
    ],
    'partition-specs': [
      {
        'spec-id': 5,
        fields: [
          {name: 'region_partition', transform: 'identity', 'source-id': 3},
          {name: 'ignored', transform: 'bucket[4]', 'source-id': 1}
        ]
      }
    ]
  };
  const file = {
    data: 'data.parquet',
    schemaId: 1,
    partitionSpecId: 5,
    partition: {region_partition: 'west', unsupported: {nested: true}},
    lowerBounds: {1: intBytes(10), geometry: [0, 0, 5, 5]},
    upperBounds: {1: intBytes(20), geometry: [0, 0, 5, 5]}
  };

  const cases = [
    {predicate: {op: '=', args: [{property: 'id'}, 15]}},
    {predicate: {op: '<>', args: [{property: ['id']}, 10]}},
    {predicate: {op: '<', args: [{property: 'id'}, 11]}},
    {predicate: {op: '<=', args: [{property: 'id'}, 10]}},
    {predicate: {op: '>', args: [{property: 'id'}, 19]}},
    {predicate: {op: '>=', args: [{property: 'id'}, 20]}},
    {predicate: {op: 'in', args: [{property: 'id'}, [5, 15]]}},
    {predicate: {op: 'and', args: [{op: 'isNull', args: [{property: 'id'}]}]}},
    {predicate: {op: 'or', args: [{op: '=', args: [{property: 'missing'}, 1]}]}},
    {predicate: {op: 'not', args: [{op: '=', args: [{property: 'id'}, 100]}]}},
    {spatialFilter: {column: 'geometry', bbox: [4, 4, 6, 6]}},
    {spatialFilter: {column: 'geometry', bbox: [10, 10, 12, 12]}}
  ];
  const retainedCounts = [];
  for (const options of cases) {
    const parquetSource = source.createParquetDataset(
      {dataFiles: [file], deleteFiles: []},
      metadata,
      options
    );
    retainedCounts.push(parquetSource.files.length);
    await parquetSource.close();
  }
  expect(retainedCounts).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0]);
  const transformed = source.createParquetDataset(
    {dataFiles: [file], deleteFiles: []},
    metadata,
    {}
  );
  expect(transformed.files[0].partitions).toEqual({region_partition: 'west', region: 'west'});
  await transformed.close();
});
