// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {load, loadInBatches, isIterator, isAsyncIterable} from '@loaders.gl/core';
import type {Schema} from '@loaders.gl/schema';
import {ObjectRowTableBatch, getTableLength} from '@loaders.gl/schema-utils';
import {JSONLoader, NDJSONLoader, GeoJSONLoader} from '@loaders.gl/json';
import {getGeoMetadata} from '@loaders.gl/gis';
import * as jsonModule from '@loaders.gl/json';
import * as arrow from 'apache-arrow';

const GEOJSON_PATH = '@loaders.gl/json/test/data/geojson-big.json';
const GEOJSON_KEPLER_DATASET_PATH = '@loaders.gl/json/test/data/kepler-dataset-sf-incidents.json';
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
      properties: {name: 'B', active: false}
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

<<<<<<< HEAD
test('JSONLoader#parse(arrow-table nested rows)', async t => {
  const table = JSONLoader.parseTextSync?.(NESTED_JSON_TEXT, {
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
  t.equal(properties.count, null, 'missing nested values normalize to null');
  t.equal(properties.active, false, 'boolean nested values are preserved');

  t.end();
});

test('JSONLoader#parse(arrow-table treats GeoJSON as generic JSON rows)', async t => {
  const table = JSONLoader.parseTextSync?.(
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
  const table = GeoJSONLoader.parseTextSync?.(
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
  const table = GeoJSONLoader.parseTextSync?.(
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

test('JSONLoader#parse(arrow-table empty arrays and rows)', async t => {
  const emptyArrayTable = JSONLoader.parseTextSync?.(JSON.stringify({items: []}), {
    json: {shape: 'arrow-table'}
  });
  t.equal(emptyArrayTable.shape, 'arrow-table', 'empty selected array returns Arrow table');
  t.equal(emptyArrayTable.data.numRows, 0, 'empty selected array keeps zero rows');
  t.equal(emptyArrayTable.data.numCols, 0, 'empty selected array keeps zero columns');

  const emptyObjectRowsTable = JSONLoader.parseTextSync?.(JSON.stringify({items: [{}, {}]}), {
    json: {shape: 'arrow-table'}
  });
  t.equal(emptyObjectRowsTable.data.numRows, 2, 'array of empty objects keeps row count');
  t.equal(emptyObjectRowsTable.data.numCols, 0, 'array of empty objects keeps zero columns');

=======
test('JSONLoader#load(geojson.json, shape: arrow-table)', async t => {
  const arrowTable = await load(GEOJSON_PATH, JSONLoader, {
    json: {table: true, shape: 'arrow-table'}
  });
  t.equal(arrowTable.shape, 'arrow-table', 'Correct Arrow table type received');
  t.equal(arrowTable.data.numRows, 308, 'Correct number of Arrow rows received');
  t.equal(arrowTable.data.getChild('type')?.get(0), 'Feature', 'Arrow field values are preserved');
>>>>>>> master
  t.end();
});

test('JSONLoader#loadInBatches(geojson.json, rows, batchSize = auto)', async t => {
  const iterator = await loadInBatches(GEOJSON_PATH, JSONLoader);
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

test('JSONLoader#loadInBatches(geojson.json, rows, batchSize = 10)', async t => {
  const iterator = await loadInBatches(GEOJSON_PATH, JSONLoader, {
    batchSize: 10
  });
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

test('JSONLoader#loadInBatches(jsonpaths)', async t => {
  let iterator = await loadInBatches(GEOJSON_PATH, JSONLoader, {
    json: {jsonpaths: ['$.features']}
  });

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

  iterator = await loadInBatches(GEOJSON_PATH, JSONLoader, {json: {jsonpaths: ['$.featureTypo']}});

  rowCount = 0;
  for await (const batch of iterator) {
    rowCount += batch.length;
  }

  t.equal(rowCount, 0, 'Correct number of row received');
  t.end();
});

<<<<<<< HEAD
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
  const iterator = GeoJSONLoader.parseInBatches?.(
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
  const iterator = GeoJSONLoader.parseInBatches?.(
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
  const iterator = GeoJSONLoader.parseInBatches?.(
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

test('JSONLoader#parseInBatches(arrow-table preserves metadata batches)', async t => {
  const iterator = JSONLoader.parseInBatches?.(makeChunkedTextIterator(NESTED_JSON_TEXT, 13), {
    metadata: true,
    batchSize: 1,
    json: {
      shape: 'arrow-table',
      jsonpaths: ['$.features']
    }
  });

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

test('JSONLoader#parse(arrow-table rejects incompatible field shapes)', async t => {
  t.throws(
    () =>
      JSONLoader.parseTextSync?.(JSON.stringify({items: [{value: 1}, {value: {nested: true}}]}), {
        json: {shape: 'arrow-table'}
      }),
    /incompatible Arrow field types/,
    'throws when rows disagree on field shape'
  );

  t.end();
});

test('JSONLoader#parse(arrow-table with supplied loaders.gl schema)', async t => {
  const schema: Schema = {
    fields: [
      {name: 'id', type: 'float64', nullable: false},
      {name: 'name', type: 'utf8', nullable: true}
    ],
    metadata: {}
  };

  const table = JSONLoader.parseTextSync?.(JSON.stringify([{id: 1, name: 'A'}]), {
    json: {shape: 'arrow-table', schema}
  });

  t.equal(table.shape, 'arrow-table', 'returns Arrow table');
  t.equal(table.schema?.fields[0].name, 'id', 'uses supplied schema fields');
  t.equal(table.data.getChild('id')?.get(0), 1, 'converts numeric field');
  t.equal(table.data.getChild('name')?.get(0), 'A', 'converts string field');
  t.end();
});

test('JSONLoader#parse(arrow-table with supplied arrow.Schema)', async t => {
  const schema = new arrow.Schema([
    new arrow.Field('id', new arrow.Float64(), false),
    new arrow.Field('name', new arrow.Utf8(), true)
  ]);

  const table = JSONLoader.parseTextSync?.(JSON.stringify([{id: 1, name: 'A'}]), {
    json: {shape: 'arrow-table', schema}
  });

  t.equal(table.shape, 'arrow-table', 'returns Arrow table');
  t.equal(table.schema?.fields[1].name, 'name', 'normalizes Arrow schema');
  t.equal(table.data.getChild('id')?.get(0), 1, 'converts numeric field');
  t.equal(table.data.getChild('name')?.get(0), 'A', 'converts string field');
  t.end();
});

test('JSONLoader#parse(arrow-table conversion policy)', async t => {
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
      JSONLoader.parseTextSync?.(JSON.stringify([{id: 'bad'}]), {
        json: {shape: 'arrow-table', schema: nullableSchema}
      }),
    /expected number/,
    'strict mode rejects type mismatches'
  );

  const typeMismatchLog = makeTestLog();
  const nullTypeTable = JSONLoader.parseTextSync?.(JSON.stringify([{id: 'bad'}, {id: 'worse'}]), {
    core: {log: typeMismatchLog},
    json: {
      shape: 'arrow-table',
      schema: nullableSchema,
      arrowConversion: {onTypeMismatch: 'null'}
    }
  });
  t.equal(nullTypeTable.data.getChild('id')?.get(0), null, 'type mismatch can recover to null');
  t.equal(typeMismatchLog.messages.length, 1, 'type mismatch recovery logs once');

  t.throws(
    () =>
      JSONLoader.parseTextSync?.(JSON.stringify([{}]), {
        json: {shape: 'arrow-table', schema: nullableSchema}
      }),
    /missing field id/,
    'strict mode rejects missing fields'
  );

  const missingFieldLog = makeTestLog();
  const missingFieldTable = JSONLoader.parseTextSync?.(JSON.stringify([{}, {}]), {
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
      JSONLoader.parseTextSync?.(JSON.stringify([{id: 1, extra: true}]), {
        json: {shape: 'arrow-table', schema: nullableSchema}
      }),
    /unexpected field extra/,
    'strict mode rejects extra fields'
  );

  const extraFieldLog = makeTestLog();
  const dropExtraTable = JSONLoader.parseTextSync?.(
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
      JSONLoader.parseTextSync?.(JSON.stringify([{id: 'bad'}]), {
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

test('JSONLoader#parse(arrow-table schema options require Arrow shape)', async t => {
  const schema: Schema = {
    fields: [{name: 'id', type: 'float64', nullable: true}],
    metadata: {}
  };

  t.throws(
    () => JSONLoader.parseTextSync?.(JSON.stringify([{id: 1}]), {json: {schema}}),
    /require json.shape to be "arrow-table"/,
    'schema without Arrow shape throws'
  );

  t.throws(
    () =>
      JSONLoader.parseTextSync?.(JSON.stringify([{id: 1}]), {
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
      GeoJSONLoader.parseTextSync?.(JSON.stringify({type: 'FeatureCollection', features: []}), {
        json: {schema}
      }),
    /require geojson.shape to be "arrow-table"/,
    'schema without Arrow shape throws'
  );

  t.throws(
    () =>
      GeoJSONLoader.parseTextSync?.(JSON.stringify({type: 'FeatureCollection', features: []}), {
        json: {arrowConversion: {onExtraField: 'drop'}}
      }),
    /require geojson.shape to be "arrow-table"/,
    'conversion policy without Arrow shape throws'
  );

  t.throws(
    () =>
      GeoJSONLoader.parseTextSync?.(JSON.stringify({type: 'FeatureCollection', features: []}), {
        json: {geoarrowGeometryColumn: 'geom'}
      }),
    /require geojson.shape to be "arrow-table"/,
    'geometry column option without Arrow shape throws'
  );

  t.end();
});

test('JSONLoader#parseInBatches(arrow-table with supplied schema)', async t => {
  const schema: Schema = {
    fields: [{name: 'id', type: 'float64', nullable: false}],
    metadata: {}
  };
  const iterator = JSONLoader.parseInBatches?.(
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

test('NDJSONLoader#parseInBatches(arrow-table freezes inferred schema)', async t => {
  const iterator = NDJSONLoader.parseInBatches?.(
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
  const iterator = NDJSONLoader.parseInBatches?.(makeChunkedTextIterator(ndjsonText, 40), {
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
  const table = GeoJSONLoader.parseTextSync?.(
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
  const binary = GeoJSONLoader.parseTextSync?.(
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
  const table = GeoJSONLoader.parseTextSync?.(
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
  const table = GeoJSONLoader.parseTextSync?.(
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
=======
test('JSONLoader#loadInBatches(jsonpaths, shape: arrow-table)', async t => {
  const iterator = await loadInBatches(GEOJSON_PATH, JSONLoader, {
    json: {jsonpaths: ['$.features'], shape: 'arrow-table'}
  });

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
>>>>>>> master
  t.end();
});

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

test('JSONLoader#loadInBatches(geojson.json, {metadata: true})', async t => {
  let iterator = await loadInBatches(GEOJSON_PATH, JSONLoader, {
    metadata: true,
    json: {table: true}
  });
  await testContainerBatches(t, iterator, 1);

  iterator = await loadInBatches(GEOJSON_PATH, JSONLoader, {
    metadata: false,
    json: {table: true}
  });
  await testContainerBatches(t, iterator, 0);

  t.end();
});

test('JSONLoader#loadInBatches(streaming array of arrays)', async t => {
  const iterator = await loadInBatches(GEOJSON_KEPLER_DATASET_PATH, JSONLoader, {
    metadata: true,
    json: {
      table: true,
      jsonpaths: ['$.data.allData']
    }
  });

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
