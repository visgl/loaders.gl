// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';

import {encode} from '@loaders.gl/core';
import {IcebergTableSource} from '../src/iceberg-table-source';
import {AvroWriter} from '../src/avro-writer';
import {ParquetJSWriter} from '../src/parquet-js-writer';

function createMetadataUrl(metadata: unknown): string {
  return `data:application/json,${encodeURIComponent(JSON.stringify(metadata))}`;
}

test('IcebergTableSource loads metadata and selects the current snapshot', async () => {
  const source = new IcebergTableSource(
    createMetadataUrl({
      'format-version': 2,
      location: 'https://example.com/table',
      'current-snapshot-id': 42,
      refs: {main: {'snapshot-id': 42, type: 'branch'}},
      snapshots: [
        {'snapshot-id': 41, 'manifest-list': 'old.avro'},
        {'snapshot-id': 42, 'manifest-list': 'current.avro'}
      ]
    })
  );

  await expect(source.getMetadata()).resolves.toMatchObject({
    'format-version': 2,
    location: 'https://example.com/table'
  });
  await expect(source.getCurrentSnapshot()).resolves.toMatchObject({
    'snapshot-id': 42,
    'manifest-list': 'current.avro'
  });
  await source.close();
});

test('IcebergTableSource rejects unsupported or malformed metadata', async () => {
  await expect(
    new IcebergTableSource(createMetadataUrl({'format-version': 4, location: 'table'})).getMetadata()
  ).rejects.toThrow('Unsupported Iceberg metadata format version');
  await expect(
    new IcebergTableSource(createMetadataUrl({'format-version': 2})).getMetadata()
  ).rejects.toThrow('location must be a non-empty string');
});

test('IcebergTableSource supports tables without a current snapshot', async () => {
  const source = new IcebergTableSource(
    createMetadataUrl({'format-version': 2, location: 'table', 'current-snapshot-id': -1})
  );
  await expect(source.getCurrentSnapshot()).resolves.toBeUndefined();
});

test('IcebergTableSource exposes the declared schema for an empty snapshot', async () => {
  const source = new IcebergTableSource(
    createMetadataUrl({
      'format-version': 2,
      location: 'table',
      'current-snapshot-id': -1,
      'current-schema-id': 7,
      schemas: [{
        'schema-id': 7,
        fields: [
          {name: 'id', type: 'long', required: true},
          {name: 'label', type: 'string', required: false}
        ]
      }]
    })
  );
  const metadata = await source.getQueryMetadata();
  expect(metadata.columns.map(column => column.name)).toEqual(['id', 'label']);
  expect(metadata.columns[0].type).toBe('int64');
  await source.close();
});

test('IcebergTableSource scans an empty current snapshot through the dataset source', async () => {
  const source = new IcebergTableSource(
    createMetadataUrl({
      'format-version': 2,
      location: 'table',
      'current-snapshot-id': 1,
      snapshots: [{'snapshot-id': 1}]
    })
  );
  const batches = [];
  for await (const batch of source.scan()) batches.push(batch);
  expect(batches).toHaveLength(0);
  await source.close();
});

test('IcebergTableSource reads Parquet data files from the current snapshot manifests', async () => {
  const metadataUrl = 'https://example.com/table/metadata.json';
  const manifestListUrl = 'https://example.com/table/metadata/snap-1.avro';
  const manifestUrl = 'https://example.com/table/metadata/manifest.avro';
  const deleteManifestUrl = 'https://example.com/table/metadata/delete-manifest.avro';
  const dataFileUrl = 'https://example.com/table/data/part-000.parquet';
  const manifestList = await AvroWriter.encode(
    {
      shape: 'arrow-table',
      data: arrow.tableFromArrays({
        manifest_path: [manifestUrl, deleteManifestUrl],
        content: [0, 1]
      })
    },
    {
      avro: {
        schema: {
          type: 'record',
          name: 'ManifestFile',
          fields: [
            {name: 'manifest_path', type: 'string'},
            {name: 'content', type: 'int'}
          ]
        }
      }
    }
  );
  const manifest = await AvroWriter.encode(
    {
      shape: 'arrow-table',
      data: arrow.tableFromJSON([
        {
          status: 1,
          data_file: {
            file_path: dataFileUrl,
            file_format: 'PARQUET',
            partition: {region: 'west'},
            lower_bounds: {value: 1},
            upper_bounds: {value: 1}
          }
        }
      ])
    },
    {
      avro: {
        schema: {
          type: 'record',
          name: 'ManifestEntry',
          fields: [
            {name: 'status', type: 'int'},
            {
              name: 'data_file',
              type: {
                type: 'record',
                name: 'DataFile',
                fields: [
                  {name: 'file_path', type: 'string'},
                  {name: 'file_format', type: 'string'},
                  {
                    name: 'partition',
                    type: {
                      type: 'record',
                      name: 'Partition',
                      fields: [{name: 'region', type: 'string'}]
                    }
                  },
                  {
                    name: 'lower_bounds',
                    type: {
                      type: 'record',
                      name: 'LowerBounds',
                      fields: [{name: 'value', type: 'int'}]
                    }
                  },
                  {
                    name: 'upper_bounds',
                    type: {
                      type: 'record',
                      name: 'UpperBounds',
                      fields: [{name: 'value', type: 'int'}]
                    }
                  }
                ]
              }
            }
          ]
        }
      }
    }
  );
  const deleteManifest = await AvroWriter.encode(
    {
      shape: 'arrow-table',
      data: arrow.tableFromJSON([
        {
          status: 1,
          data_file: {
            file_path: 'https://example.com/table/deletes/part-000.avro',
            file_format: 'AVRO',
            content: 'position',
            referenced_data_file: dataFileUrl
          }
        }
      ])
    },
    {
      avro: {
        schema: {
          type: 'record',
          name: 'DeleteManifestEntry',
          fields: [
            {name: 'status', type: 'int'},
            {
              name: 'data_file',
              type: {
                type: 'record',
                name: 'DeleteFile',
                fields: [
                  {name: 'file_path', type: 'string'},
                  {name: 'file_format', type: 'string'},
                  {name: 'content', type: 'string'},
                  {name: 'referenced_data_file', type: 'string'}
                ]
              }
            }
          ]
        }
      }
    }
  );
  const metadataUrlValue = createMetadataUrl({
      'format-version': 2,
      location: 'https://example.com/table/',
      'current-snapshot-id': 1,
      refs: {main: {'snapshot-id': 1, type: 'branch'}},
      'current-schema-id': 7,
      schemas: [{'schema-id': 7, fields: [{id: 1, name: 'value', type: 'int'}]}],
      snapshots: [
      {'snapshot-id': 1, 'manifest-list': manifestListUrl, 'schema-id': 7},
      {'snapshot-id': 2, 'manifest-list': manifestListUrl, 'schema-id': 7}
      ]
  });
  const source = new IcebergTableSource(metadataUrlValue);
  const defaultFetch = source.fetch;
  const responses = new Map<string, ArrayBuffer>([
    [manifestListUrl, manifestList],
    [manifestUrl, manifest],
    [deleteManifestUrl, deleteManifest]
  ]);
  source.fetch = async (url, options) => {
    if (url === metadataUrlValue) return defaultFetch(url, options);
    const body = responses.get(url);
    if (!body) return new Response(null, {status: 404});
    return new Response(body);
  };

  await expect(source.getParquetFiles()).resolves.toMatchObject([
    {
      data: dataFileUrl,
      fileSize: undefined,
      recordCount: undefined,
      partition: expect.objectContaining({region: 'west'}),
      lowerBounds: expect.objectContaining({value: 1}),
      upperBounds: expect.objectContaining({value: 1})
      ,schemaId: 7
    }
  ]);
  await expect(source.getParquetFiles(undefined, undefined, 'main')).resolves.toHaveLength(1);
  await expect(source.getDeleteFiles()).resolves.toMatchObject([
    {
      data: 'https://example.com/table/deletes/part-000.avro',
      format: 'AVRO',
      content: 'position',
      referencedDataFile: dataFileUrl,
      equalityFieldIds: undefined,
      fileSize: undefined,
      recordCount: undefined,
      partition: undefined
    }
  ]);
  await expect(source.getParquetFiles(undefined, 2)).resolves.toHaveLength(1);
  const batches = [];
  for await (const batch of source.scan({
    predicate: {op: '=', args: [{property: 'value'}, 2]}
  })) {
    batches.push(batch);
  }
  expect(batches).toHaveLength(0);
  const partitionBatches = [];
  for await (const batch of source.scan({partitions: {region: 'east'}})) {
    partitionBatches.push(batch);
  }
  expect(partitionBatches).toHaveLength(0);
});

test('IcebergTableSource resolves equality delete field IDs during opt-in scans', async () => {
  const manifestListUrl = 'https://example.com/table/metadata/snap-equality.avro';
  const deleteManifestUrl = 'https://example.com/table/metadata/equality-manifest.avro';
  const deleteFileUrl = 'https://example.com/table/deletes/equality.avro';
  const manifestList = await AvroWriter.encode(
    {
      shape: 'arrow-table',
      data: arrow.tableFromArrays({manifest_path: [deleteManifestUrl], content: [1]})
    },
    {
      avro: {
        schema: {
          type: 'record',
          name: 'EqualityManifestList',
          fields: [
            {name: 'manifest_path', type: 'string'},
            {name: 'content', type: 'int'}
          ]
        }
      }
    }
  );
  const deleteManifest = await AvroWriter.encode(
    {
      shape: 'arrow-table',
      data: arrow.tableFromJSON([
        {
          status: 1,
          data_file: {
            file_path: deleteFileUrl,
            file_format: 'AVRO',
            content: 'equality',
            equality_ids: 1
          }
        }
      ])
    },
    {
      avro: {
        schema: {
          type: 'record',
          name: 'EqualityManifestEntry',
          fields: [
            {name: 'status', type: 'int'},
            {
              name: 'data_file',
              type: {
                type: 'record',
                name: 'EqualityDeleteFile',
                fields: [
                  {name: 'file_path', type: 'string'},
                  {name: 'file_format', type: 'string'},
                  {name: 'content', type: 'string'},
                  {name: 'equality_ids', type: 'int'}
                ]
              }
            }
          ]
        }
      }
    }
  );
  const equalityDelete = await AvroWriter.encode(
    {
      shape: 'arrow-table',
      data: arrow.tableFromArrays({value: [7]})
    },
    {
      avro: {
        schema: {
          type: 'record',
          name: 'EqualityDeleteRecord',
          fields: [{name: 'value', type: 'int'}]
        }
      }
    }
  );
  const metadataUrl = createMetadataUrl({
    'format-version': 2,
    location: 'https://example.com/table/',
    'current-snapshot-id': 1,
    'current-schema-id': 1,
    schemas: [{'schema-id': 1, fields: [{id: 1, name: 'value', type: 'int'}]}],
    snapshots: [{'snapshot-id': 1, 'manifest-list': manifestListUrl}]
  });
  const source = new IcebergTableSource(metadataUrl);
  const defaultFetch = source.fetch;
  const responses = new Map<string, ArrayBuffer>([
    [manifestListUrl, manifestList],
    [deleteManifestUrl, deleteManifest],
    [deleteFileUrl, equalityDelete]
  ]);
  source.fetch = async (url, options) => {
    if (url === metadataUrl) return defaultFetch(url, options);
    const body = responses.get(url);
    if (!body) return new Response(null, {status: 404});
    return new Response(body);
  };
  const batches = [];
  for await (const batch of source.scan({applyDeletes: true})) batches.push(batch);
  expect(batches).toHaveLength(0);
  await source.close();
});

test('IcebergTableSource applies position deletes to decoded Parquet rows', async () => {
  const metadataUrl = 'https://example.com/table/metadata.json';
  const manifestListUrl = 'https://example.com/table/metadata/snap-position.avro';
  const dataManifestUrl = 'https://example.com/table/metadata/data-manifest.avro';
  const deleteManifestUrl = 'https://example.com/table/metadata/delete-manifest.avro';
  const dataFile = await createParquetFixture();
  const dataFileUrl = createDataUrl(dataFile);
  const deleteFileUrl = 'https://example.com/table/deletes/part-000.avro';
  const [manifestList, dataManifest, deleteManifest, positionDelete] = await Promise.all([
    AvroWriter.encode(
      {
        shape: 'arrow-table',
        data: arrow.tableFromArrays({
          manifest_path: [dataManifestUrl, deleteManifestUrl],
          content: [0, 1]
        })
      },
      {
        avro: {
          schema: {
            type: 'record',
            name: 'PositionManifestList',
            fields: [
              {name: 'manifest_path', type: 'string'},
              {name: 'content', type: 'int'}
            ]
          }
        }
      }
    ),
    createManifestEntry(dataFileUrl, 'PARQUET'),
    createManifestEntry(deleteFileUrl, 'AVRO', 1),
    AvroWriter.encode(
      {
        shape: 'arrow-table',
        data: arrow.tableFromArrays({file_path: [dataFileUrl], pos: [1]})
      },
      {
        avro: {
          schema: {
            type: 'record',
            name: 'PositionDelete',
            fields: [
              {name: 'file_path', type: 'string'},
              {name: 'pos', type: 'long'}
            ]
          }
        }
      }
    )
  ]);
  const metadata = createMetadataUrl({
    'format-version': 2,
    location: 'https://example.com/table/',
    'current-snapshot-id': 1,
    snapshots: [{'snapshot-id': 1, 'manifest-list': manifestListUrl}]
  });
  const source = new IcebergTableSource(metadata, {core: {worker: false}});
  const defaultFetch = source.fetch;
  const responses = new Map<string, ArrayBuffer>([
    [manifestListUrl, manifestList],
    [dataManifestUrl, dataManifest],
    [deleteManifestUrl, deleteManifest],
    [deleteFileUrl, positionDelete]
  ]);
  source.fetch = async (url, options) => {
    if (url === metadata) return defaultFetch(url, options);
    const body = responses.get(url);
    if (!body) return new Response(null, {status: 404});
    return new Response(body);
  };

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url !== dataFileUrl) return originalFetch(input, init);
    const range = new Headers(init?.headers).get('range');
    if (!range) return new Response(dataFile);
    const match = /^bytes=(\d+)-(\d+)$/.exec(range);
    if (!match) return new Response(null, {status: 416});
    const start = Number(match[1]);
    const end = Math.min(Number(match[2]), dataFile.byteLength - 1);
    return new Response(dataFile.slice(start, end + 1), {
      status: 206,
      headers: {'Content-Range': `bytes ${start}-${end}/${dataFile.byteLength}`}
    });
  };
  try {
    const batches = [];
    for await (const batch of source.scan({applyDeletes: true, batchSize: 3})) batches.push(batch);
    expect(batches).toHaveLength(1);
    expect([...batches[0].data.getChild('id')!.toArray()]).toEqual([1, 3]);
    expect([...batches[0].data.getChild('value')!.toArray()]).toEqual(['one', 'three']);
    expect(batches[0].rowIndices).toEqual([0, 2]);
  } finally {
    globalThis.fetch = originalFetch;
    await source.close();
  }
});

/** Creates a manifest containing one active data or delete file. */
async function createManifestEntry(
  filePath: string,
  fileFormat: string,
  content?: number
): Promise<ArrayBuffer> {
  return AvroWriter.encode(
    {
      shape: 'arrow-table',
      data: arrow.tableFromJSON([
        {
          status: 1,
          data_file: {
            file_path: filePath,
            file_format: fileFormat,
            ...(content === undefined ? {} : {content})
          }
        }
      ])
    },
    {
      avro: {
        schema: {
          type: 'record',
          name: content === undefined ? 'DataManifestEntry' : 'DeleteManifestEntry',
          fields: [
            {name: 'status', type: 'int'},
            {
              name: 'data_file',
              type: {
                type: 'record',
                name: content === undefined ? 'DataFile' : 'DeleteFile',
                fields: [
                  {name: 'file_path', type: 'string'},
                  {name: 'file_format', type: 'string'},
                  ...(content === undefined ? [] : [{name: 'content', type: 'int'}])
                ]
              }
            }
          ]
        }
      }
    }
  );
}

/** Creates a deterministic Parquet fixture with three source rows. */
async function createParquetFixture(): Promise<ArrayBuffer> {
  return encode(
    {
      shape: 'object-row-table',
      schema: {
        fields: [
          {name: 'id', type: 'int32', nullable: false},
          {name: 'value', type: 'utf8', nullable: false}
        ],
        metadata: {}
      },
      data: [
        {id: 1, value: 'one'},
        {id: 2, value: 'two'},
        {id: 3, value: 'three'}
      ]
    },
    ParquetJSWriter
  );
}

/** Encodes fixture bytes as a fetchable in-memory data URL. */
function createDataUrl(data: ArrayBuffer): string {
  let binary = '';
  for (const value of new Uint8Array(data)) binary += String.fromCharCode(value);
  return `data:application/octet-stream;base64,${btoa(binary)}`;
}
