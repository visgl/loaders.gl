// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {load, loadInBatches, isIterator, isAsyncIterable} from '@loaders.gl/core';
import type {Schema} from '@loaders.gl/schema';
import {ObjectRowTableBatch, getTableLength} from '@loaders.gl/schema-utils';
import {JSONLoader, JSONTableLoader, GeoJSONLoader} from '@loaders.gl/json';
import type {JSONLoaderOptions, JSONTableLoaderOptions} from '@loaders.gl/json';
import {
  JSONLoader as BundledJSONLoader,
  JSONTableLoader as BundledJSONTableLoader,
  NDJSONLoader as BundledNDJSONLoader,
  GeoJSONLoader as BundledGeoJSONLoader
} from '@loaders.gl/json/bundled';
import {getGeoMetadata} from '@loaders.gl/gis';
import * as jsonModule from '@loaders.gl/json';
import * as arrow from 'apache-arrow';

const GEOJSON_PATH = '@loaders.gl/json/test/data/geojson-big.json';
const GEOJSON_KEPLER_DATASET_PATH = '@loaders.gl/json/test/data/kepler-dataset-sf-incidents.json';
const STREAMING_LOADER_CONFIGS: {name: string; options?: JSONLoaderOptions}[] = [
  {name: 'JSONLoader'},
  {name: 'JSONLoader json.backend=fast', options: {json: {backend: 'fast'}}}
];
const TABLE_STREAMING_LOADER_CONFIGS: {
  name: string;
  options?: JSONTableLoaderOptions;
}[] = [
  {name: 'JSONTableLoader'},
  {name: 'JSONTableLoader json.backend=fast', options: {json: {backend: 'fast'}}}
];
const NESTED_JSON_TEXT = JSON.stringify({
  meta: {source: 'test'},
  features: [
    {
      type: 'Feature',
      geometry: {type: 'Point', coordinates: [1, 2]},
      properties: {name: 'A', count: 1, active: true}
    },
    {
      type: 'Feature',
      geometry: {type: 'Point', coordinates: [3, 4]},
      properties: {name: 'B', count: 0, active: false}
    }
  ]
});

test('JSONLoader#load(geojson.json)', async t => {
  const table = await load(GEOJSON_PATH, JSONLoader, {json: {table: true}});
  t.equal(
    table.shape === 'object-row-table' && table.data.length,
    308,
    'Correct number of rows received'
  );
  t.end();
});

test('JSONTableLoader#parse(arrow-table nested rows)', async t => {
  const table = BundledJSONTableLoader.parseTextSync?.(NESTED_JSON_TEXT, {
    json: {shape: 'arrow-table'}
  });

  t.equal(table.shape, 'arrow-table', 'returns Arrow table shape');
  t.equal(table.data.numRows, 2, 'returns two rows');

  const geometryField = table.schema?.fields.find(field => field.name === 'geometry');
  t.equal(typeof geometryField?.type, 'object', 'geometry schema is nested');
  if (
    geometryField &&
    typeof geometryField.type === 'object' &&
    geometryField.type.type === 'struct'
  ) {
    const coordinatesField = geometryField.type.children.find(
      child => child.name === 'coordinates'
    );
    t.equal(coordinatesField?.type?.type, 'list', 'coordinates schema is list');
  }

  const geometry = table.data.getChild('geometry')?.get(0) as {type: string; coordinates: number[]};
  t.equal(geometry.type, 'Point', 'geometry struct is materialized');
  t.deepEqual(
    Array.from(geometry.coordinates as unknown as ArrayLike<number>),
    [1, 2],
    'geometry coordinates are preserved'
  );

  const properties = table.data.getChild('properties')?.get(1) as {
    name: string;
    count: number | null;
    active: boolean;
  };
  t.equal(properties.name, 'B', 'properties struct is materialized');
  t.equal(properties.count, 0, 'nested numeric values are preserved');
  t.equal(properties.active, false, 'boolean nested values are preserved');

  t.end();
});

test('JSONTableLoader#parse(arrow-table treats GeoJSON as generic JSON rows)', async t => {
  const table = BundledJSONTableLoader.parseTextSync?.(
    JSON.stringify({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {type: 'Point', coordinates: [1, 2]},
          properties: {name: 'A', count: 1}
        },
        {
          type: 'Feature',
          geometry: {type: 'Point', coordinates: [3, 4]},
          properties: {name: 'B'}
        }
      ]
    }),
    {
      json: {shape: 'arrow-table'}
    }
  );

  t.equal(table.shape, 'arrow-table', 'returns Arrow table shape');
  t.equal(table.data.numRows, 2, 'returns feature rows');
  t.equal(table.data.getChild('type')?.get(0), 'Feature', 'materializes feature envelope type');
  t.equal(table.data.getChild('name'), null, 'does not lift properties as columns');

  const geometryField = table.schema?.fields.find(field => field.name === 'geometry');
  t.equal(typeof geometryField?.type, 'object', 'geometry field is nested JSON');
  t.equal(geometryField?.metadata?.['ARROW:extension:name'], undefined, 'no GeoArrow metadata');

  const properties = table.data.getChild('properties')?.get(0) as {name: string; count: number};
  t.equal(properties.name, 'A', 'keeps properties as nested struct');

  t.end();
});

test('GeoJSONLoader#parse(arrow-table with supplied schema)', async t => {
  const schema: Schema = {
    fields: [
      {name: 'name', type: 'utf8', nullable: false},
      {name: 'geometry', type: 'binary', nullable: true}
    ],
    metadata: {}
  };
  const table = BundledGeoJSONLoader.parseTextSync?.(
    JSON.stringify({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {type: 'Point', coordinates: [1, 2]},
          properties: {name: 'A'}
        }
      ]
    }),
    {
      geojson: {shape: 'arrow-table'},
      json: {schema}
    }
  );

  t.equal(table.schema?.fields[0].name, 'name', 'uses supplied property field');
  t.equal(table.schema?.fields[1].name, 'geometry', 'uses supplied geometry field');
  t.equal(
    table.schema?.fields[1].metadata?.['ARROW:extension:name'],
    'geoarrow.wkb',
    'adds GeoArrow WKB extension metadata to supplied schema'
  );
  t.equal(table.data.getChild('name')?.get(0), 'A', 'converts properties against schema');
  t.ok(table.data.getChild('geometry')?.get(0) instanceof Uint8Array, 'converts geometry to WKB');
  t.end();
});

test('GeoJSONLoader#parse(arrow-table with supplied arrow.Schema)', async t => {
  const schema = new arrow.Schema([
    new arrow.Field('name', new arrow.Utf8(), false),
    new arrow.Field('geometry', new arrow.Binary(), true)
  ]);
  const table = BundledGeoJSONLoader.parseTextSync?.(
    JSON.stringify([
      {
        type: 'Feature',
        geometry: {type: 'Point', coordinates: [1, 2]},
        properties: {name: 'A'}
      }
    ]),
    {
      geojson: {shape: 'arrow-table'},
      json: {schema}
    }
  );

  t.equal(table.schema?.fields[1].name, 'geometry', 'normalizes supplied Arrow schema');
  t.equal(
    table.schema?.fields[1].metadata?.['ARROW:extension:name'],
    'geoarrow.wkb',
    'adds GeoArrow WKB extension metadata'
  );
  t.ok(table.data.getChild('geometry')?.get(0) instanceof Uint8Array, 'converts geometry to WKB');
  t.end();
});

test('JSONTableLoader#parse(arrow-table empty arrays and rows)', async t => {
  const emptyArrayTable = BundledJSONTableLoader.parseTextSync?.(JSON.stringify({items: []}), {
    json: {shape: 'arrow-table'}
  });
  t.equal(emptyArrayTable.shape, 'arrow-table', 'empty selected array returns Arrow table');
  t.equal(emptyArrayTable.data.numRows, 0, 'empty selected array keeps zero rows');
  t.equal(emptyArrayTable.data.numCols, 0, 'empty selected array keeps zero columns');

  const emptyObjectRowsTable = BundledJSONTableLoader.parseTextSync?.(
    JSON.stringify({items: [{}, {}]}),
    {
      json: {shape: 'arrow-table'}
    }
  );
  t.equal(emptyObjectRowsTable.data.numRows, 2, 'array of empty objects keeps row count');
  t.equal(emptyObjectRowsTable.data.numCols, 0, 'array of empty objects keeps zero columns');

  t.end();
});

test('JSONTableLoader#load(geojson.json, shape: arrow-table)', async t => {
  const arrowTable = await load(GEOJSON_PATH, JSONTableLoader, {
    json: {shape: 'arrow-table'}
  });
  t.equal(arrowTable.shape, 'arrow-table', 'Correct Arrow table type received');
  t.equal(arrowTable.data.numRows, 308, 'Correct number of Arrow rows received');
  t.equal(arrowTable.data.getChild('type')?.get(0), 'Feature', 'Arrow field values are preserved');
  t.end();
});

test('JSONTableLoader#parse returns requested row-table shapes', async t => {
  const objectRowTable = BundledJSONTableLoader.parseTextSync?.(
    JSON.stringify([{id: 1, name: 'A'}])
  );
  t.equal(objectRowTable.shape, 'object-row-table', 'defaults to object-row-table output');

  const arrayRowTable = BundledJSONTableLoader.parseTextSync?.(
    JSON.stringify([{id: 1, name: 'A'}]),
    {json: {shape: 'array-row-table'}}
  );
  t.equal(arrayRowTable.shape, 'array-row-table', 'returns array-row-table output on request');
  t.deepEqual(arrayRowTable.data[0], [1, 'A'], 'preserves row values during conversion');
  t.end();
});

test('JSONTableLoader#parse rejects non-tabular JSON documents', async t => {
  t.throws(
    () => BundledJSONTableLoader.parseTextSync?.(JSON.stringify({meta: {source: 'test'}})),
    /expected a JSON row array or an object containing a JSON row array/,
    'documents without row arrays fail table-only parsing'
  );
  t.end();
});

for (const config of STREAMING_LOADER_CONFIGS) {
  test(`${config.name}#loadInBatches(geojson.json, rows, batchSize = auto)`, async t => {
    const iterator = await loadInBatches(
      GEOJSON_PATH,
      JSONLoader,
      getStreamingLoaderOptions(config)
    );
    t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

    let batch;
    let batchCount = 0;
    let rowCount = 0;
    // TODO - incorrect length read after 2.3 polyfills upgrade, investigate!
    // let byteLength = 0;
    for await (batch of iterator) {
      batchCount++;
      rowCount += batch.length;
      // byteLength = batch.bytesUsed;
    }

    // t.comment(JSON.stringify(batchCount));
    t.ok(batchCount <= 4, 'Correct number of batches received');
    t.equal(rowCount, 308, 'Correct number of row received');
    // t.equal(byteLength, 135910, 'Correct number of bytes received');
    t.end();
  });

  test(`${config.name}#loadInBatches(geojson.json, rows, batchSize = 10)`, async t => {
    const iterator = await loadInBatches(
      GEOJSON_PATH,
      JSONLoader,
      getStreamingLoaderOptions(config, {
        batchSize: 10
      })
    );
    t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

    let batch;
    let batchCount = 0;
    let rowCount = 0;
    for await (batch of iterator) {
      // t.comment(`BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`);
      if (batchCount < 30) {
        t.equal(batch.length, 10, `Got correct batch size for batch ${batchCount}`);
      }

      const feature = batch.data[0];
      t.equal(feature.type, 'Feature', 'row 0 valid');
      t.equal(feature.geometry.type, 'Point', 'row 0 valid');

      batchCount++;
      rowCount += batch.length;
    }

    const lastFeature = batch.data[batch.data.length - 1];
    t.equal(lastFeature.type, 'Feature', 'row 0 valid');
    t.equal(lastFeature.properties.name, 'West Oakland (WOAK)', 'row 0 valid');

    t.equal(batchCount, 31, 'Correct number of batches received');
    t.equal(rowCount, 308, 'Correct number of row received');
    t.end();
  });
}

test('JSONLoader#parseInBatches(complete rows with nested arrays)', async t => {
  const valueCount = 2048;
  const rows = Array.from({length: 3}, (_, rowIndex) => ({
    text: `row-${rowIndex}`,
    values: Array.from({length: valueCount}, (_, valueIndex) => rowIndex * valueCount + valueIndex)
  }));

  const iterator = BundledJSONLoader.parseInBatches?.(
    makeChunkedTextIterator(JSON.stringify(rows), 128),
    {
      batchSize: 1
    }
  );

  t.ok(iterator, 'parseInBatches returned iterator');
  if (!iterator) {
    t.end();
    return;
  }

  let emittedRowCount = 0;
  for await (const batch of iterator) {
    if (batch.batchType === 'data') {
      t.equal(batch.length, 1, 'fixed-size batch contains one complete row');
      for (const row of batch.data) {
        const expectedFirstValue = emittedRowCount * valueCount;
        emittedRowCount++;
        t.equal(row.values.length, valueCount, 'nested values array is complete when emitted');
        t.equal(row.values[0], expectedFirstValue, 'first nested value is preserved');
        t.equal(
          row.values[valueCount - 1],
          expectedFirstValue + valueCount - 1,
          'last nested value is preserved'
        );
      }
    }
  }

  t.equal(emittedRowCount, rows.length, 'all rows were emitted');
  t.end();
});

for (const config of STREAMING_LOADER_CONFIGS) {
  test(`${config.name}#loadInBatches(jsonpaths)`, async t => {
    let iterator = await loadInBatches(
      GEOJSON_PATH,
      JSONLoader,
      getStreamingLoaderOptions(config, {
        json: {jsonpaths: ['$.features']}
      })
    );

    // let batchCount = 0;
    let rowCount = 0;
    // let byteLength = 0;
    for await (const batch of iterator) {
      // batchCount++;
      rowCount += batch.length;
      // byteLength = batch.bytesUsed;
      // @ts-ignore
      t.equal(batch.jsonpath?.toString(), '$.features', 'correct jsonpath on batch');
    }

    // t.skip(batchCount <= 3, 'Correct number of batches received');
    t.equal(rowCount, 308, 'Correct number of row received');
    // t.equal(byteLength, 135910, 'Correct number of bytes received');

    iterator = await loadInBatches(
      GEOJSON_PATH,
      JSONLoader,
      getStreamingLoaderOptions(config, {json: {jsonpaths: ['$.featureTypo']}})
    );

    rowCount = 0;
    for await (const batch of iterator) {
      rowCount += batch.length;
    }

    t.equal(rowCount, 0, 'Correct number of row received');
    t.end();
  });
}

test('GeoJSONLoader#loadInBatches(arrow-table streams GeoArrow WKB)', async t => {
  const iterator = await loadInBatches(GEOJSON_PATH, GeoJSONLoader, {
    batchSize: 10,
    geojson: {shape: 'arrow-table'}
  });

  let rowCount = 0;
  for await (const batch of iterator) {
    t.equal(batch.shape, 'arrow-table', 'data batch is converted to Arrow');
    t.equal(
      batch.schema?.fields.find(field => field.name === 'geometry')?.metadata?.[
        'ARROW:extension:name'
      ],
      'geoarrow.wkb',
      'geometry field carries GeoArrow WKB metadata'
    );
    t.ok(batch.data.getChild('geometry')?.get(0) instanceof Uint8Array, 'geometry is WKB');
    rowCount += batch.length;
  }

  t.equal(rowCount, 308, 'converts all streamed feature rows');
  t.end();
});

test('GeoJSONLoader#parseInBatches(arrow-table applies early legacy GeoJSON CRS)', async t => {
  const crs = {type: 'name', properties: {name: 'EPSG:4326'}};
  const iterator = BundledGeoJSONLoader.parseInBatches?.(
    makeChunkedTextIterator(
      JSON.stringify({
        type: 'FeatureCollection',
        crs,
        features: [
          {
            type: 'Feature',
            geometry: {type: 'Point', coordinates: [1, 2]},
            properties: {name: 'A'}
          }
        ]
      }),
      20
    ),
    {batchSize: 1, geojson: {shape: 'arrow-table'}}
  );

  let dataBatchCount = 0;
  for await (const batch of iterator) {
    t.equal(batch.batchType, 'data', 'internal metadata batches are not emitted');
    const geoMetadata = getGeoMetadata(batch.schema?.metadata);
    t.deepEqual(geoMetadata?.columns.geometry.geojson_crs, crs, 'preserves root CRS on schema');
    t.equal(
      (geoMetadata?.columns.geometry.crs as any)?.id?.code,
      4326,
      'maps known root CRS before first feature batch'
    );
    dataBatchCount++;
  }

  t.equal(dataBatchCount, 1, 'received one data batch');
  t.end();
});

test('GeoJSONLoader#parseInBatches(arrow-table ignores late legacy GeoJSON CRS)', async t => {
  const iterator = BundledGeoJSONLoader.parseInBatches?.(
    makeChunkedTextIterator(
      JSON.stringify({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {type: 'Point', coordinates: [1, 2]},
            properties: {name: 'A'}
          }
        ],
        crs: {type: 'name', properties: {name: 'EPSG:4326'}}
      }),
      20
    ),
    {batchSize: 1, geojson: {shape: 'arrow-table'}}
  );

  let dataBatchCount = 0;
  for await (const batch of iterator) {
    t.equal(batch.batchType, 'data', 'late CRS does not force metadata batches');
    const geoMetadata = getGeoMetadata(batch.schema?.metadata);
    t.equal(geoMetadata?.columns.geometry.geojson_crs, undefined, 'late CRS is ignored');
    t.equal(geoMetadata?.columns.geometry.crs, undefined, 'late CRS is not mapped');
    dataBatchCount++;
  }

  t.equal(dataBatchCount, 1, 'received one data batch');
  t.end();
});

test('GeoJSONLoader#parseInBatches(arrow-table freezes inferred schema)', async t => {
  const iterator = BundledGeoJSONLoader.parseInBatches?.(
    makeChunkedTextIterator(
      JSON.stringify({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {type: 'Point', coordinates: [1, 2]},
            properties: {name: 'A'}
          },
          {
            type: 'Feature',
            geometry: {type: 'Point', coordinates: [3, 4]},
            properties: {name: 'B', extra: true}
          }
        ]
      }),
      1000
    ),
    {batchSize: 1, geojson: {shape: 'arrow-table'}}
  );

  await t.rejects(
    async () => {
      for await (const _batch of iterator) {
        // Consume batches until the second feature violates the frozen schema.
      }
    },
    /unexpected field extra/,
    'later streamed feature batches are converted against the frozen schema'
  );

  t.end();
});

test('JSONTableLoader#parseInBatches(arrow-table preserves metadata batches)', async t => {
  const iterator = BundledJSONTableLoader.parseInBatches?.(
    makeChunkedTextIterator(NESTED_JSON_TEXT, 13),
    {
      metadata: true,
      batchSize: 2,
      json: {
        shape: 'arrow-table',
        jsonpaths: ['$.features']
      }
    }
  );

  let dataBatchCount = 0;
  for await (const batch of iterator) {
    switch (batch.batchType) {
      case 'partial-result':
        t.ok(batch.container, 'partial-result retains container metadata');
        break;

      case 'data':
        t.equal(batch.shape, 'arrow-table', 'data batch is converted to Arrow');
        t.equal(batch.data.numRows, 1, 'batch size is preserved after Arrow conversion');
        dataBatchCount++;
        break;

      case 'final-result':
        t.equal(batch.shape, 'json', 'final-result batch keeps JSON shape');
        t.ok(batch.container, 'final-result retains container metadata');
        break;

      default:
    }
  }

  t.equal(dataBatchCount, 2, 'received both Arrow data batches');
  t.end();
});

test('JSONTableLoader#parse(arrow-table rejects incompatible field shapes)', async t => {
  t.throws(
    () =>
      BundledJSONTableLoader.parseTextSync?.(
        JSON.stringify({items: [{value: 1}, {value: {nested: true}}]}),
        {
          json: {shape: 'arrow-table'}
        }
      ),
    /incompatible Arrow field types/,
    'throws when rows disagree on field shape'
  );

  t.end();
});

test('JSONTableLoader#parse(arrow-table with supplied loaders.gl schema)', async t => {
  const schema: Schema = {
    fields: [
      {name: 'id', type: 'float64', nullable: false},
      {name: 'name', type: 'utf8', nullable: true}
    ],
    metadata: {}
  };

  const table = BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{id: 1, name: 'A'}]), {
    json: {shape: 'arrow-table', schema}
  });

  t.equal(table.shape, 'arrow-table', 'returns Arrow table');
  t.equal(table.schema?.fields[0].name, 'id', 'uses supplied schema fields');
  t.equal(table.data.getChild('id')?.get(0), 1, 'converts numeric field');
  t.equal(table.data.getChild('name')?.get(0), 'A', 'converts string field');
  t.end();
});

test('JSONTableLoader#parse(arrow-table with supplied arrow.Schema)', async t => {
  const schema = new arrow.Schema([
    new arrow.Field('id', new arrow.Float64(), false),
    new arrow.Field('name', new arrow.Utf8(), true)
  ]);

  const table = BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{id: 1, name: 'A'}]), {
    json: {shape: 'arrow-table', schema}
  });

  t.equal(table.shape, 'arrow-table', 'returns Arrow table');
  t.equal(table.schema?.fields[1].name, 'name', 'normalizes Arrow schema');
  t.equal(table.data.getChild('id')?.get(0), 1, 'converts numeric field');
  t.equal(table.data.getChild('name')?.get(0), 'A', 'converts string field');
  t.end();
});

test('JSONTableLoader#parse(arrow-table conversion policy)', async t => {
  const nullableSchema: Schema = {
    fields: [{name: 'id', type: 'float64', nullable: true}],
    metadata: {}
  };
  const strictSchema: Schema = {
    fields: [{name: 'id', type: 'float64', nullable: false}],
    metadata: {}
  };

  t.throws(
    () =>
      BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{id: 'bad'}]), {
        json: {shape: 'arrow-table', schema: nullableSchema}
      }),
    /expected number/,
    'strict mode rejects type mismatches'
  );

  const typeMismatchLog = makeTestLog();
  const nullTypeTable = BundledJSONTableLoader.parseTextSync?.(
    JSON.stringify([{id: 'bad'}, {id: 'worse'}]),
    {
      core: {log: typeMismatchLog},
      json: {
        shape: 'arrow-table',
        schema: nullableSchema,
        arrowConversion: {onTypeMismatch: 'null'}
      }
    }
  );
  t.equal(nullTypeTable.data.getChild('id')?.get(0), null, 'type mismatch can recover to null');
  t.equal(typeMismatchLog.messages.length, 1, 'type mismatch recovery logs once');

  t.throws(
    () =>
      BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{}]), {
        json: {shape: 'arrow-table', schema: nullableSchema}
      }),
    /missing field id/,
    'strict mode rejects missing fields'
  );

  const missingFieldLog = makeTestLog();
  const missingFieldTable = BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{}, {}]), {
    core: {log: missingFieldLog},
    json: {
      shape: 'arrow-table',
      schema: nullableSchema,
      arrowConversion: {onMissingField: 'null'}
    }
  });
  t.equal(missingFieldTable.data.getChild('id')?.get(0), null, 'missing field can recover to null');
  t.equal(missingFieldLog.messages.length, 1, 'missing field recovery logs once');

  t.throws(
    () =>
      BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{id: 1, extra: true}]), {
        json: {shape: 'arrow-table', schema: nullableSchema}
      }),
    /unexpected field extra/,
    'strict mode rejects extra fields'
  );

  const extraFieldLog = makeTestLog();
  const dropExtraTable = BundledJSONTableLoader.parseTextSync?.(
    JSON.stringify([
      {id: 1, extra: true},
      {id: 2, extra: false}
    ]),
    {
      core: {log: extraFieldLog},
      json: {
        shape: 'arrow-table',
        schema: nullableSchema,
        arrowConversion: {onExtraField: 'drop'}
      }
    }
  );
  t.equal(dropExtraTable.data.numCols, 1, 'extra field is dropped');
  t.equal(dropExtraTable.data.getChild('extra'), null, 'extra field is not materialized');
  t.equal(extraFieldLog.messages.length, 1, 'extra field recovery logs once');

  t.throws(
    () =>
      BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{id: 'bad'}]), {
        json: {
          shape: 'arrow-table',
          schema: strictSchema,
          arrowConversion: {onTypeMismatch: 'null'}
        }
      }),
    /expected number/,
    'non-nullable field still rejects null recovery'
  );

  t.end();
});

test('JSONTableLoader#parse(arrow-table integer conversion policy)', async t => {
  const nullableSchema: Schema = {
    fields: [{name: 'id', type: 'int8', nullable: true}],
    metadata: {}
  };
  const strictSchema: Schema = {
    fields: [{name: 'id', type: 'int8', nullable: false}],
    metadata: {}
  };

  t.throws(
    () =>
      BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{id: 1.5}]), {
        json: {shape: 'arrow-table', schema: nullableSchema}
      }),
    /expected integer/,
    'strict mode rejects non-integral integer values'
  );

  t.throws(
    () =>
      BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{id: -1}]), {
        json: {
          shape: 'arrow-table',
          schema: {fields: [{name: 'id', type: 'uint8', nullable: true}], metadata: {}}
        }
      }),
    /expected integer/,
    'strict mode rejects out-of-range unsigned integer values'
  );

  const nullIntegerTable = BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{id: 1.5}]), {
    json: {
      shape: 'arrow-table',
      schema: nullableSchema,
      arrowConversion: {integerConversion: 'null'}
    }
  });
  t.equal(
    nullIntegerTable.data.getChild('id')?.get(0),
    null,
    'integer conversion can recover to null'
  );

  t.throws(
    () =>
      BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{id: 1.5}]), {
        json: {
          shape: 'arrow-table',
          schema: strictSchema,
          arrowConversion: {integerConversion: 'null'}
        }
      }),
    /expected integer/,
    'non-nullable integer field still rejects null recovery'
  );

  const clampedIntegerTable = BundledJSONTableLoader.parseTextSync?.(
    JSON.stringify([{id: 127.6}]),
    {
      json: {
        shape: 'arrow-table',
        schema: strictSchema,
        arrowConversion: {integerConversion: 'clamp-and-round'}
      }
    }
  );
  t.equal(
    clampedIntegerTable.data.getChild('id')?.get(0),
    127,
    'integer conversion can round and clamp'
  );

  const integerConversionLog = makeTestLog();
  const warnedIntegerTable = BundledJSONTableLoader.parseTextSync?.(
    JSON.stringify([{id: 2.5}, {id: 3.5}]),
    {
      core: {log: integerConversionLog},
      json: {
        shape: 'arrow-table',
        schema: strictSchema,
        arrowConversion: {integerConversion: 'warn'}
      }
    }
  );
  t.equal(warnedIntegerTable.data.getChild('id')?.get(0), 3, 'warn mode rounds values');
  t.equal(integerConversionLog.messages.length, 1, 'integer conversion warning logs once');

  t.end();
});

test('JSONTableLoader#parse(arrow-table Utf8 numeric conversion policy)', async t => {
  const schema: Schema = {
    fields: [{name: 'id', type: 'utf8', nullable: false}],
    metadata: {}
  };

  t.throws(
    () =>
      BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{id: 7}]), {
        json: {shape: 'arrow-table', schema}
      }),
    /expected string/,
    'strict mode rejects numeric Utf8 values by default'
  );

  const table = BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{id: 7}, {id: '8'}]), {
    json: {
      shape: 'arrow-table',
      schema,
      arrowConversion: {utf8Conversion: 'number-to-string'}
    }
  });
  t.equal(table.data.getChild('id')?.get(0), '7', 'numeric Utf8 values can coerce to strings');
  t.equal(table.data.getChild('id')?.get(1), '8', 'string Utf8 values remain unchanged');

  t.throws(
    () =>
      BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{id: true}]), {
        json: {
          shape: 'arrow-table',
          schema,
          arrowConversion: {utf8Conversion: 'number-to-string'}
        }
      }),
    /expected string/,
    'non-numeric primitive values still reject Utf8 coercion'
  );
  t.end();
});

test('JSONTableLoader#parse(arrow-table schema options require Arrow shape)', async t => {
  const schema: Schema = {
    fields: [{name: 'id', type: 'float64', nullable: true}],
    metadata: {}
  };

  t.throws(
    () => BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{id: 1}]), {json: {schema}}),
    /require json.shape to be "arrow-table"/,
    'schema without Arrow shape throws'
  );

  t.throws(
    () =>
      BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{id: 1}]), {
        json: {arrowConversion: {onExtraField: 'drop'}}
      }),
    /require json.shape to be "arrow-table"/,
    'conversion policy without Arrow shape throws'
  );

  t.end();
});

test('GeoJSONLoader#parse(arrow-table options require Arrow shape)', async t => {
  const schema: Schema = {
    fields: [{name: 'geometry', type: 'binary', nullable: true}],
    metadata: {}
  };

  t.throws(
    () =>
      BundledGeoJSONLoader.parseTextSync?.(
        JSON.stringify({type: 'FeatureCollection', features: []}),
        {
          json: {schema}
        }
      ),
    /require geojson.shape to be "arrow-table"/,
    'schema without Arrow shape throws'
  );

  t.throws(
    () =>
      BundledGeoJSONLoader.parseTextSync?.(
        JSON.stringify({type: 'FeatureCollection', features: []}),
        {
          json: {arrowConversion: {onExtraField: 'drop'}}
        }
      ),
    /require geojson.shape to be "arrow-table"/,
    'conversion policy without Arrow shape throws'
  );

  t.throws(
    () =>
      BundledGeoJSONLoader.parseTextSync?.(
        JSON.stringify({type: 'FeatureCollection', features: []}),
        {
          json: {geoarrowGeometryColumn: 'geom'}
        }
      ),
    /require geojson.shape to be "arrow-table"/,
    'geometry column option without Arrow shape throws'
  );

  t.end();
});

test('JSONTableLoader#parseInBatches(arrow-table with supplied schema)', async t => {
  const schema: Schema = {
    fields: [{name: 'id', type: 'float64', nullable: false}],
    metadata: {}
  };
  const iterator = BundledJSONTableLoader.parseInBatches?.(
    makeChunkedTextIterator('{"items":[{"id":1},{"id":2}]}', 100),
    {
      batchSize: 1,
      json: {shape: 'arrow-table', jsonpaths: ['$.items'], schema}
    }
  );

  let rowCount = 0;
  for await (const batch of iterator) {
    if (batch.batchType === 'data') {
      t.equal(batch.schema?.fields[0].name, 'id', 'uses supplied schema in data batch');
      rowCount += batch.data.numRows;
    }
  }

  t.equal(rowCount, 2, 'converts all streamed rows');
  t.end();
});

test('JSONTableLoader#parseInBatches(fast arrow-table preserves raw Utf8 JSON fields)', async t => {
  const schema: Schema = {
    fields: [
      {name: 'id', type: 'float64', nullable: false},
      {name: 'metadata', type: 'utf8', nullable: true},
      {name: 'tags', type: 'utf8', nullable: true},
      {name: 'label', type: 'utf8', nullable: false}
    ],
    metadata: {}
  };
  const jsonText =
    '{"items":[{"id":1,"metadata": { "nested" : [1, {"escaped":"\\u2603"}] }, "tags": [ "alpha" , {"value":2} ], "label":"line\\nbreak"},{"id":2,"metadata":null,"label":"plain"}]}';
  const iterator = BundledJSONTableLoader.parseInBatches?.(makeChunkedTextIterator(jsonText, 3), {
    batchSize: 1,
    json: {
      backend: 'fast',
      shape: 'arrow-table',
      jsonpaths: ['$.items'],
      schema,
      arrowConversion: {onMissingField: 'null'}
    }
  });

  const metadataValues: (string | null)[] = [];
  const tagValues: (string | null)[] = [];
  const labelValues: string[] = [];
  for await (const batch of iterator) {
    if (batch.batchType === 'data') {
      metadataValues.push(batch.data.getChild('metadata')?.get(0) as string | null);
      tagValues.push(batch.data.getChild('tags')?.get(0) as string | null);
      labelValues.push(batch.data.getChild('label')?.get(0) as string);
    }
  }

  t.deepEqual(
    metadataValues,
    ['{ "nested" : [1, {"escaped":"\\u2603"}] }', null],
    'object values keep their exact JSON source or null'
  );
  t.deepEqual(
    tagValues,
    ['[ "alpha" , {"value":2} ]', null],
    'array values keep their exact JSON source or recovered missing null'
  );
  t.deepEqual(labelValues, ['line\nbreak', 'plain'], 'ordinary Utf8 strings still decode');
  t.end();
});

test('JSONTableLoader raw Utf8 capture is limited to fast streaming Arrow parsing', async t => {
  const schema: Schema = {
    fields: [{name: 'metadata', type: 'utf8', nullable: false}],
    metadata: {}
  };
  const jsonText = '{"items":[{"metadata":{"nested":true}}]}';

  t.throws(
    () =>
      BundledJSONTableLoader.parseTextSync?.(jsonText, {
        json: {shape: 'arrow-table', schema}
      }),
    /expected string/,
    'sync parsing still rejects object values for Utf8 schema fields'
  );

  const iterator = BundledJSONTableLoader.parseInBatches?.(makeChunkedTextIterator(jsonText, 8), {
    batchSize: 1,
    json: {shape: 'arrow-table', jsonpaths: ['$.items'], schema}
  });

  await t.rejects(
    async () => {
      for await (const _batch of iterator) {
        // Consume batches until Arrow conversion reaches the nested object value.
      }
    },
    /expected string/,
    'clarinet streaming still rejects object values for Utf8 schema fields'
  );
  t.end();
});

test('NDJSONLoader#parseInBatches(arrow-table freezes inferred schema)', async t => {
  const iterator = BundledNDJSONLoader.parseInBatches?.(
    makeChunkedTextIterator('{"id":1}\n{"id":2,"extra":true}\n', 9),
    {batchSize: 1, ndjson: {shape: 'arrow-table'}}
  );

  await t.rejects(
    async () => {
      for await (const _batch of iterator) {
        // Consume batches until the second row violates the frozen schema.
      }
    },
    /unexpected field extra/,
    'later streamed batches are converted against the frozen schema'
  );

  t.end();
});

test('NDJSONLoader#parse(deprecated json.shape arrow-table alias)', async t => {
  const table = BundledNDJSONLoader.parseTextSync?.('{"id":1}\n{"id":2}\n', {
    json: {shape: 'arrow-table'}
  });

  t.equal(table.shape, 'arrow-table', 'deprecated json.shape alias requests Arrow output');
  t.equal(table.data.numRows, 2, 'converts all rows');
  t.end();
});

test('NDJSONLoader#parseInBatches(arrow-table treats GeoJSON features as generic rows)', async t => {
  const ndjsonText = `${JSON.stringify({
    type: 'Feature',
    geometry: {type: 'Point', coordinates: [1, 2]},
    properties: {name: 'A'}
  })}\n${JSON.stringify({
    type: 'Feature',
    geometry: {type: 'Point', coordinates: [3, 4]},
    properties: {name: 'B'}
  })}\n`;
  const iterator = BundledNDJSONLoader.parseInBatches?.(makeChunkedTextIterator(ndjsonText, 40), {
    batchSize: 1,
    ndjson: {shape: 'arrow-table'}
  });

  let rowCount = 0;
  for await (const batch of iterator) {
    t.equal(batch.shape, 'arrow-table', 'data batch is converted to Arrow');
    t.equal(batch.data.getChild('type')?.get(0), 'Feature', 'keeps feature envelope type');
    t.equal(batch.data.getChild('name'), null, 'does not lift properties');
    t.equal(
      batch.schema?.fields.find(field => field.name === 'geometry')?.metadata?.[
        'ARROW:extension:name'
      ],
      undefined,
      'does not add GeoArrow metadata'
    );
    rowCount += batch.length;
  }

  t.equal(rowCount, 2, 'converts streamed feature rows generically');
  t.end();
});

test('GeoJSONLoader#exports official names only', t => {
  t.equal(typeof jsonModule.JSONTableLoader, 'object', 'JSONTableLoader is exported');
  t.equal(typeof jsonModule.GeoJSONLoader, 'object', 'GeoJSONLoader is exported');
  t.equal(typeof jsonModule.GeoJSONWriter, 'object', 'GeoJSONWriter is exported');
  t.equal(
    (jsonModule as any)._GeoJSONLoader,
    undefined,
    'underscored GeoJSONLoader is not exported'
  );
  t.equal(
    (jsonModule as any)._GeoJSONWriter,
    undefined,
    'underscored GeoJSONWriter is not exported'
  );
  t.end();
});

test('GeoJSONLoader#parse(default geojson-table shape)', async t => {
  const table = BundledGeoJSONLoader.parseTextSync?.(
    JSON.stringify({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {type: 'Point', coordinates: [1, 2]},
          properties: {name: 'A'}
        }
      ]
    })
  );

  t.equal(table.shape, 'geojson-table', 'returns GeoJSON table by default');
  t.equal(table.features.length, 1, 'returns features');
  t.end();
});

test('GeoJSONLoader#parse(binary-feature-collection shape)', async t => {
  const binary = BundledGeoJSONLoader.parseTextSync?.(
    JSON.stringify({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {type: 'Point', coordinates: [1, 2]},
          properties: {name: 'A'}
        }
      ]
    }),
    {geojson: {shape: 'binary-feature-collection'}}
  );

  t.equal(binary.shape, 'binary-feature-collection', 'returns binary feature collection');
  t.ok(binary.points, 'returns point binary features');
  t.end();
});

test('GeoJSONLoader#parse(arrow-table GeoArrow WKB)', async t => {
  const table = BundledGeoJSONLoader.parseTextSync?.(
    JSON.stringify({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {type: 'Point', coordinates: [1, 2]},
          properties: {name: 'A', count: 1}
        }
      ]
    }),
    {geojson: {shape: 'arrow-table'}}
  );

  t.equal(table.shape, 'arrow-table', 'returns Arrow table');
  t.equal(table.data.getChild('name')?.get(0), 'A', 'lifts properties as columns');
  const geometryField = table.schema?.fields.find(field => field.name === 'geometry');
  t.equal(geometryField?.type, 'binary', 'geometry field is binary');
  t.equal(
    geometryField?.metadata?.['ARROW:extension:name'],
    'geoarrow.wkb',
    'geometry field carries GeoArrow WKB extension metadata'
  );
  t.ok(table.data.getChild('geometry')?.get(0) instanceof Uint8Array, 'geometry is WKB');
  t.end();
});

test('GeoJSONLoader#parse(arrow-table preserves legacy GeoJSON CRS)', async t => {
  const crs = {type: 'name', properties: {name: 'urn:ogc:def:crs:OGC:1.3:CRS84'}};
  const table = BundledGeoJSONLoader.parseTextSync?.(
    JSON.stringify({
      type: 'FeatureCollection',
      crs,
      features: [
        {
          type: 'Feature',
          geometry: {type: 'Point', coordinates: [1, 2]},
          properties: {name: 'A'}
        }
      ]
    }),
    {geojson: {shape: 'arrow-table'}}
  );
  const geoMetadata = getGeoMetadata(table.schema?.metadata);

  t.deepEqual(geoMetadata?.columns.geometry.geojson_crs, crs, 'preserves raw root CRS');
  t.equal(
    (geoMetadata?.columns.geometry.crs as any)?.id?.code,
    'CRS84',
    'maps known root CRS to GeoArrow CRS metadata'
  );
  t.end();
});

for (const config of TABLE_STREAMING_LOADER_CONFIGS) {
  test(`${config.name}#loadInBatches(jsonpaths, shape: arrow-table)`, async t => {
    const schema: Schema = {
      fields: [{name: 'type', type: 'utf8', nullable: false}],
      metadata: {}
    };
    const iterator = await loadInBatches(
      GEOJSON_PATH,
      JSONTableLoader,
      getTableStreamingLoaderOptions(config, {
        json: {
          jsonpaths: ['$.features'],
          shape: 'arrow-table',
          schema,
          arrowConversion: {onExtraField: 'drop'}
        }
      })
    );

    let rowCount = 0;
    let dataBatchCount = 0;
    for await (const batch of iterator) {
      if (batch.shape === 'arrow-table') {
        dataBatchCount++;
        rowCount += batch.data.numRows;
        // @ts-ignore
        t.equal(batch.jsonpath?.toString(), '$.features', 'correct jsonpath on Arrow batch');
      }
    }

    t.ok(dataBatchCount > 0, 'received Arrow data batches');
    t.equal(rowCount, 308, 'Correct number of Arrow rows received');
    t.end();
  });
}

test('GeoJSONLoader#loadInBatches(jsonpaths)', async t => {
  const iterator = await loadInBatches(GEOJSON_PATH, GeoJSONLoader, {
    json: {jsonpaths: ['$.features']}
  });

  let rowCount = 0;
  for await (const batch of iterator) {
    rowCount += batch.length;
    // @ts-ignore
    t.equal(batch.jsonpath?.toString(), '$.features', 'correct jsonpath on batch');
  }

  t.equal(rowCount, 308, 'Correct number of row received');
  t.end();
});

// TODO - columnar table batch support not yet fixed
/*
test('JSONLoader#loadInBatches(geojson.json, columns, batchSize = auto)', async t => {
  const iterator = await loadInBatches(GEOJSON_PATH, JSONLoader, {
    json: {
      TableBatch: ColumnarTableBatch
    }
  });
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batch;
  let batchCount = 0;
  let rowCount = 0;
  for await (batch of iterator) {
    batchCount++;
    rowCount += batch.length;
  }

  t.ok(batchCount <= 3, 'Correct number of batches received');
  t.equal(rowCount, 308, 'Correct number of row received');
  t.end();
});
*/

async function testContainerBatches(t, iterator, expectedCount) {
  let opencontainerBatchCount = 0;
  let closecontainerBatchCount = 0;

  for await (const batch of iterator) {
    switch (batch.batchType) {
      case 'partial-result':
        t.ok(batch.container.type, 'batch.container should be set on partial-result');
        opencontainerBatchCount++;
        break;
      case 'final-result':
        t.ok(batch.container.type, 'batch.container should be set on final-result');
        closecontainerBatchCount++;
        break;
      default:
        t.notOk(batch.container, 'batch.container should not be set');
    }
  }

  t.equal(opencontainerBatchCount, expectedCount, 'partial-result batch as expected');
  t.equal(closecontainerBatchCount, expectedCount, 'final-result batch as expected');
}

for (const config of STREAMING_LOADER_CONFIGS) {
  test(`${config.name}#loadInBatches(geojson.json, {metadata: true})`, async t => {
    let iterator = await loadInBatches(
      GEOJSON_PATH,
      JSONLoader,
      getStreamingLoaderOptions(config, {
        metadata: true,
        json: {table: true}
      })
    );
    await testContainerBatches(t, iterator, 1);

    iterator = await loadInBatches(
      GEOJSON_PATH,
      JSONLoader,
      getStreamingLoaderOptions(config, {
        metadata: false,
        json: {table: true}
      })
    );
    await testContainerBatches(t, iterator, 0);

    t.end();
  });

  test(`${config.name}#loadInBatches(streaming array of arrays)`, async t => {
    const iterator = await loadInBatches(
      GEOJSON_KEPLER_DATASET_PATH,
      JSONLoader,
      getStreamingLoaderOptions(config, {
        metadata: true,
        json: {
          table: true,
          jsonpaths: ['$.data.allData']
        }
      })
    );

    let rowCount = 0;
    for await (const batch of iterator) {
      switch (batch.batchType) {
        case 'metadata':
        case 'partial-result':
          break;
        case 'data':
          const rowBatch = batch as ObjectRowTableBatch;
          rowCount += getTableLength(rowBatch);
          // t.equal(rowBatch?.data?.[0].length, 10);
          break;
        case 'final-result':
          if (batch.shape === 'json') {
            t.ok(batch.container, 'final batch contains json');
          }
          break;
        default:
      }
    }
    t.equal(rowCount, 247, '247 rows found');

    t.end();
  });
}

/** Merges scenario options with the streaming parser backend under test. */
function getStreamingLoaderOptions(
  config: {options?: JSONLoaderOptions},
  options: JSONLoaderOptions = {}
): JSONLoaderOptions {
  return {
    ...config.options,
    ...options,
    json: {...config.options?.json, ...options.json}
  };
}

/** Merges JSON table scenario options with the streaming parser backend under test. */
function getTableStreamingLoaderOptions(
  config: {options?: JSONTableLoaderOptions},
  options: JSONTableLoaderOptions = {}
): JSONTableLoaderOptions {
  return {
    ...config.options,
    ...options,
    json: {...config.options?.json, ...options.json}
  };
}

/** Creates a probe.gl-compatible test logger that records one-time messages. */
function makeTestLog(): {messages: string[]; once: (message: string) => () => void} {
  const messages: string[] = [];
  const seenMessages = new Set<string>();

  return {
    messages,
    once: (message: string) => () => {
      if (!seenMessages.has(message)) {
        seenMessages.add(message);
        messages.push(message);
      }
    }
  };
}

/** Emits UTF-8 JSON text chunks for streaming parse tests. */
async function* makeChunkedTextIterator(text: string, chunkSize: number) {
  const textEncoder = new TextEncoder();
  for (let index = 0; index < text.length; index += chunkSize) {
    yield textEncoder.encode(text.slice(index, index + chunkSize));
  }
}
