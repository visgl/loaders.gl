// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
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
const STREAMING_LOADER_CONFIGS: {
  name: string;
  options?: JSONLoaderOptions;
}[] = [
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
test('JSONLoader#load(geojson.json)', async () => {
  const table = await load(GEOJSON_PATH, JSONLoader, {json: {table: true}});
  expect(
    table.shape === 'object-row-table' && table.data.length,
    'Correct number of rows received'
  ).toBe(308);
});
test('JSONTableLoader#parse(arrow-table nested rows)', async () => {
  const table = BundledJSONTableLoader.parseTextSync?.(NESTED_JSON_TEXT, {
    json: {shape: 'arrow-table'}
  });
  expect(table.shape, 'returns Arrow table shape').toBe('arrow-table');
  expect(table.data.numRows, 'returns two rows').toBe(2);
  const geometryField = table.schema?.fields.find(field => field.name === 'geometry');
  expect(typeof geometryField?.type, 'geometry schema is nested').toBe('object');
  if (
    geometryField &&
    typeof geometryField.type === 'object' &&
    geometryField.type.type === 'struct'
  ) {
    const coordinatesField = geometryField.type.children.find(
      child => child.name === 'coordinates'
    );
    expect(coordinatesField?.type?.type, 'coordinates schema is list').toBe('list');
  }
  const geometry = table.data.getChild('geometry')?.get(0) as {
    type: string;
    coordinates: number[];
  };
  expect(geometry.type, 'geometry struct is materialized').toBe('Point');
  expect(
    Array.from(geometry.coordinates as unknown as ArrayLike<number>),
    'geometry coordinates are preserved'
  ).toEqual([1, 2]);
  const properties = table.data.getChild('properties')?.get(1) as {
    name: string;
    count: number | null;
    active: boolean;
  };
  expect(properties.name, 'properties struct is materialized').toBe('B');
  expect(properties.count, 'nested numeric values are preserved').toBe(0);
  expect(properties.active, 'boolean nested values are preserved').toBe(false);
});
test('JSONTableLoader#parse(arrow-table treats GeoJSON as generic JSON rows)', async () => {
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
  expect(table.shape, 'returns Arrow table shape').toBe('arrow-table');
  expect(table.data.numRows, 'returns feature rows').toBe(2);
  expect(table.data.getChild('type')?.get(0), 'materializes feature envelope type').toBe('Feature');
  expect(table.data.getChild('name'), 'does not lift properties as columns').toBe(null);
  const geometryField = table.schema?.fields.find(field => field.name === 'geometry');
  expect(typeof geometryField?.type, 'geometry field is nested JSON').toBe('object');
  expect(geometryField?.metadata?.['ARROW:extension:name'], 'no GeoArrow metadata').toBe(undefined);
  const properties = table.data.getChild('properties')?.get(0) as {
    name: string;
    count: number;
  };
  expect(properties.name, 'keeps properties as nested struct').toBe('A');
});
test('GeoJSONLoader#parse(arrow-table with supplied schema)', async () => {
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
  expect(table.schema?.fields[0].name, 'uses supplied property field').toBe('name');
  expect(table.schema?.fields[1].name, 'uses supplied geometry field').toBe('geometry');
  expect(
    table.schema?.fields[1].metadata?.['ARROW:extension:name'],
    'adds GeoArrow WKB extension metadata to supplied schema'
  ).toBe('geoarrow.wkb');
  expect(table.data.getChild('name')?.get(0), 'converts properties against schema').toBe('A');
  expect(
    table.data.getChild('geometry')?.get(0) instanceof Uint8Array,
    'converts geometry to WKB'
  ).toBeTruthy();
});
test('GeoJSONLoader#parse(arrow-table with supplied arrow.Schema)', async () => {
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
  expect(table.schema?.fields[1].name, 'normalizes supplied Arrow schema').toBe('geometry');
  expect(
    table.schema?.fields[1].metadata?.['ARROW:extension:name'],
    'adds GeoArrow WKB extension metadata'
  ).toBe('geoarrow.wkb');
  expect(
    table.data.getChild('geometry')?.get(0) instanceof Uint8Array,
    'converts geometry to WKB'
  ).toBeTruthy();
});
test('JSONTableLoader#parse(arrow-table empty arrays and rows)', async () => {
  const emptyArrayTable = BundledJSONTableLoader.parseTextSync?.(JSON.stringify({items: []}), {
    json: {shape: 'arrow-table'}
  });
  expect(emptyArrayTable.shape, 'empty selected array returns Arrow table').toBe('arrow-table');
  expect(emptyArrayTable.data.numRows, 'empty selected array keeps zero rows').toBe(0);
  expect(emptyArrayTable.data.numCols, 'empty selected array keeps zero columns').toBe(0);
  const emptyObjectRowsTable = BundledJSONTableLoader.parseTextSync?.(
    JSON.stringify({items: [{}, {}]}),
    {
      json: {shape: 'arrow-table'}
    }
  );
  expect(emptyObjectRowsTable.data.numRows, 'array of empty objects keeps row count').toBe(2);
  expect(emptyObjectRowsTable.data.numCols, 'array of empty objects keeps zero columns').toBe(0);
});
test('JSONTableLoader#load(geojson.json, shape: arrow-table)', async () => {
  const arrowTable = await load(GEOJSON_PATH, JSONTableLoader, {
    json: {shape: 'arrow-table'}
  });
  expect(arrowTable.shape, 'Correct Arrow table type received').toBe('arrow-table');
  expect(arrowTable.data.numRows, 'Correct number of Arrow rows received').toBe(308);
  expect(arrowTable.data.getChild('type')?.get(0), 'Arrow field values are preserved').toBe(
    'Feature'
  );
});
test('JSONTableLoader#parse returns requested row-table shapes', async () => {
  const objectRowTable = BundledJSONTableLoader.parseTextSync?.(
    JSON.stringify([{id: 1, name: 'A'}])
  );
  expect(objectRowTable.shape, 'defaults to object-row-table output').toBe('object-row-table');
  const arrayRowTable = BundledJSONTableLoader.parseTextSync?.(
    JSON.stringify([{id: 1, name: 'A'}]),
    {json: {shape: 'array-row-table'}}
  );
  expect(arrayRowTable.shape, 'returns array-row-table output on request').toBe('array-row-table');
  expect(arrayRowTable.data[0], 'preserves row values during conversion').toEqual([1, 'A']);
});
test('JSONTableLoader#parse rejects non-tabular JSON documents', async () => {
  expect(
    () => BundledJSONTableLoader.parseTextSync?.(JSON.stringify({meta: {source: 'test'}})),
    'documents without row arrays fail table-only parsing'
  ).toThrow(/expected a JSON row array or an object containing a JSON row array/);
});
for (const config of STREAMING_LOADER_CONFIGS) {
  test(`${config.name}#loadInBatches(geojson.json, rows, batchSize = auto)`, async () => {
    const iterator = await loadInBatches(
      GEOJSON_PATH,
      JSONLoader,
      getStreamingLoaderOptions(config)
    );
    expect(
      isIterator(iterator) || isAsyncIterable(iterator),
      'loadInBatches returned iterator'
    ).toBeTruthy();
    let batch;
    let batchCount = 0;
    let rowCount = 0;
    // TODO - incorrect length read after 2.3 polyfills upgrade, investigate!
    // let byteLength = 0;
    for await (batch of iterator) {
      batchCount++;
      rowCount += batch.length;
    }
    // t.comment(JSON.stringify(batchCount));
    expect(batchCount <= 4, 'Correct number of batches received').toBeTruthy();
    expect(rowCount, 'Correct number of row received').toBe(308);
  });
  test(`${config.name}#loadInBatches(geojson.json, rows, batchSize = 10)`, async () => {
    const iterator = await loadInBatches(
      GEOJSON_PATH,
      JSONLoader,
      getStreamingLoaderOptions(config, {
        batchSize: 10
      })
    );
    expect(
      isIterator(iterator) || isAsyncIterable(iterator),
      'loadInBatches returned iterator'
    ).toBeTruthy();
    let batch;
    let batchCount = 0;
    let rowCount = 0;
    for await (batch of iterator) {
      // t.comment(`BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`);
      if (batchCount < 30) {
        expect(batch.length, `Got correct batch size for batch ${batchCount}`).toBe(10);
      }
      const feature = batch.data[0];
      expect(feature.type, 'row 0 valid').toBe('Feature');
      expect(feature.geometry.type, 'row 0 valid').toBe('Point');
      batchCount++;
      rowCount += batch.length;
    }
    const lastFeature = batch.data[batch.data.length - 1];
    expect(lastFeature.type, 'row 0 valid').toBe('Feature');
    expect(lastFeature.properties.name, 'row 0 valid').toBe('West Oakland (WOAK)');
    expect(batchCount, 'Correct number of batches received').toBe(31);
    expect(rowCount, 'Correct number of row received').toBe(308);
  });
}
test('JSONLoader#parseInBatches(complete rows with nested arrays)', async () => {
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
  expect(iterator, 'parseInBatches returned iterator').toBeTruthy();
  if (!iterator) {
    return;
  }
  let emittedRowCount = 0;
  for await (const batch of iterator) {
    if (batch.batchType === 'data') {
      expect(batch.length, 'fixed-size batch contains one complete row').toBe(1);
      for (const row of batch.data) {
        const expectedFirstValue = emittedRowCount * valueCount;
        emittedRowCount++;
        expect(row.values.length, 'nested values array is complete when emitted').toBe(valueCount);
        expect(row.values[0], 'first nested value is preserved').toBe(expectedFirstValue);
        expect(row.values[valueCount - 1], 'last nested value is preserved').toBe(
          expectedFirstValue + valueCount - 1
        );
      }
    }
  }
  expect(emittedRowCount, 'all rows were emitted').toBe(rows.length);
});
for (const config of STREAMING_LOADER_CONFIGS) {
  test(`${config.name}#loadInBatches(jsonpaths)`, async () => {
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
      expect(batch.jsonpath?.toString(), 'correct jsonpath on batch').toBe('$.features');
    }
    // t.skip(batchCount <= 3, 'Correct number of batches received');
    expect(rowCount, 'Correct number of row received').toBe(308);
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
    expect(rowCount, 'Correct number of row received').toBe(0);
  });
}
test('GeoJSONLoader#loadInBatches(arrow-table streams GeoArrow WKB)', async () => {
  const iterator = await loadInBatches(GEOJSON_PATH, GeoJSONLoader, {
    batchSize: 10,
    geojson: {shape: 'arrow-table'}
  });
  let rowCount = 0;
  for await (const batch of iterator) {
    expect(batch.shape, 'data batch is converted to Arrow').toBe('arrow-table');
    expect(
      batch.schema?.fields.find(field => field.name === 'geometry')?.metadata?.[
        'ARROW:extension:name'
      ],
      'geometry field carries GeoArrow WKB metadata'
    ).toBe('geoarrow.wkb');
    expect(
      batch.data.getChild('geometry')?.get(0) instanceof Uint8Array,
      'geometry is WKB'
    ).toBeTruthy();
    rowCount += batch.length;
  }
  expect(rowCount, 'converts all streamed feature rows').toBe(308);
});
test('GeoJSONLoader#parseInBatches(arrow-table applies early legacy GeoJSON CRS)', async () => {
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
    expect(batch.batchType, 'internal metadata batches are not emitted').toBe('data');
    const geoMetadata = getGeoMetadata(batch.schema?.metadata);
    expect(geoMetadata?.columns.geometry.geojson_crs, 'preserves root CRS on schema').toEqual(crs);
    expect(
      (geoMetadata?.columns.geometry.crs as any)?.id?.code,
      'maps known root CRS before first feature batch'
    ).toBe(4326);
    dataBatchCount++;
  }
  expect(dataBatchCount, 'received one data batch').toBe(1);
});
test('GeoJSONLoader#parseInBatches(arrow-table ignores late legacy GeoJSON CRS)', async () => {
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
    expect(batch.batchType, 'late CRS does not force metadata batches').toBe('data');
    const geoMetadata = getGeoMetadata(batch.schema?.metadata);
    expect(geoMetadata?.columns.geometry.geojson_crs, 'late CRS is ignored').toBe(undefined);
    expect(geoMetadata?.columns.geometry.crs, 'late CRS is not mapped').toBe(undefined);
    dataBatchCount++;
  }
  expect(dataBatchCount, 'received one data batch').toBe(1);
});
test('GeoJSONLoader#parseInBatches(arrow-table freezes inferred schema)', async () => {
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
      20
    ),
    {batchSize: 1, geojson: {shape: 'arrow-table'}}
  );
  await expect(async () => {
    for await (const _batch of iterator) {
    }
  }, 'later streamed feature batches are converted against the frozen schema').rejects.toThrow(
    /unexpected field extra/
  );
});
test('GeoJSONLoader#parseInBatches(arrow-table keeps optimized union schema stable)', async () => {
  const iterator = BundledGeoJSONLoader.parseInBatches?.(
    makeChunkedTextIterator(
      JSON.stringify({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {type: 'Point', coordinates: [1, 2]},
            properties: {name: 'point'}
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [0, 0],
                  [1, 0],
                  [1, 1],
                  [0, 0]
                ]
              ]
            },
            properties: {name: 'polygon'}
          }
        ]
      }),
      20
    ),
    {
      batchSize: 1,
      geojson: {shape: 'arrow-table'},
      geoarrow: {encodingPreference: 'optimized'}
    }
  );
  const batches = [];
  for await (const batch of iterator) {
    if (batch.batchType === 'data') batches.push(batch);
  }
  expect(batches).toHaveLength(2);
  expect(batches[1].schema).toEqual(batches[0].schema);
  expect(
    batches[0].schema.fields.find(field => field.name === 'geometry')?.metadata?.[
      'ARROW:extension:name'
    ]
  ).toBe('geoarrow.geometry');
});
test('GeoJSONLoader#parse(arrow-table applies custom geometry column and CRS)', () => {
  const crs = {type: 'name', properties: {name: 'EPSG:4326'}};
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
    {
      geojson: {shape: 'arrow-table'},
      geoarrow: {encodingPreference: 'optimized'},
      json: {geoarrowGeometryColumn: 'shape'}
    }
  );
  expect(table.schema.fields.find(field => field.name === 'shape')).toBeTruthy();
  expect(table.schema.fields.find(field => field.name === 'geometry')).toBe(undefined);
  const geoMetadata = getGeoMetadata(table.schema.metadata);
  expect(geoMetadata?.columns.shape.geojson_crs).toEqual(crs);
  expect((geoMetadata?.columns.shape.crs as any)?.id?.code).toBe(4326);
});
test('JSONTableLoader#parseInBatches(arrow-table preserves metadata batches)', async () => {
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
        expect(batch.container, 'partial-result retains container metadata').toBeTruthy();
        break;
      case 'data':
        expect(batch.shape, 'data batch is converted to Arrow').toBe('arrow-table');
        expect(batch.data.numRows, 'batch size is preserved after Arrow conversion').toBe(1);
        dataBatchCount++;
        break;
      case 'final-result':
        expect(batch.shape, 'final-result batch keeps JSON shape').toBe('json');
        expect(batch.container, 'final-result retains container metadata').toBeTruthy();
        break;
      default:
    }
  }
  expect(dataBatchCount, 'received both Arrow data batches').toBe(2);
});
test('JSONTableLoader#parse(arrow-table rejects incompatible field shapes)', async () => {
  expect(
    () =>
      BundledJSONTableLoader.parseTextSync?.(
        JSON.stringify({items: [{value: 1}, {value: {nested: true}}]}),
        {
          json: {shape: 'arrow-table'}
        }
      ),
    'throws when rows disagree on field shape'
  ).toThrow(/incompatible Arrow field types/);
});
test('JSONTableLoader#parse(arrow-table with supplied loaders.gl schema)', async () => {
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
  expect(table.shape, 'returns Arrow table').toBe('arrow-table');
  expect(table.schema?.fields[0].name, 'uses supplied schema fields').toBe('id');
  expect(table.data.getChild('id')?.get(0), 'converts numeric field').toBe(1);
  expect(table.data.getChild('name')?.get(0), 'converts string field').toBe('A');
});
test('JSONTableLoader#parse(arrow-table prefers supported Arrow view types)', async () => {
  const schema: Schema = {
    fields: [{name: 'name', type: 'utf8', nullable: false}],
    metadata: {}
  };
  const table = BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{name: 'Arrow'}]), {
    json: {
      shape: 'arrow-table',
      schema,
      arrowConversion: {viewTypes: 'require'}
    }
  });
  expect(table.data.schema.fields[0].type.constructor.name).toBe('Utf8View');
  expect(
    table.schema?.fields.map(field => field.type),
    'reports the selected physical types'
  ).toEqual(['utf8-view']);
  expect(table.data.getChild('name')?.get(0)).toBe('Arrow');
});
test('JSONTableLoader#parse(arrow-table with supplied arrow.Schema)', async () => {
  const schema = new arrow.Schema([
    new arrow.Field('id', new arrow.Float64(), false),
    new arrow.Field('name', new arrow.Utf8(), true)
  ]);
  const table = BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{id: 1, name: 'A'}]), {
    json: {shape: 'arrow-table', schema}
  });
  expect(table.shape, 'returns Arrow table').toBe('arrow-table');
  expect(table.schema?.fields[1].name, 'normalizes Arrow schema').toBe('name');
  expect(table.data.getChild('id')?.get(0), 'converts numeric field').toBe(1);
  expect(table.data.getChild('name')?.get(0), 'converts string field').toBe('A');
});
test('JSONTableLoader#parse(arrow-table conversion policy)', async () => {
  const nullableSchema: Schema = {
    fields: [{name: 'id', type: 'float64', nullable: true}],
    metadata: {}
  };
  const strictSchema: Schema = {
    fields: [{name: 'id', type: 'float64', nullable: false}],
    metadata: {}
  };
  expect(
    () =>
      BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{id: 'bad'}]), {
        json: {shape: 'arrow-table', schema: nullableSchema}
      }),
    'strict mode rejects type mismatches'
  ).toThrow(/expected number/);
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
  expect(nullTypeTable.data.getChild('id')?.get(0), 'type mismatch can recover to null').toBe(null);
  expect(typeMismatchLog.messages.length, 'type mismatch recovery logs once').toBe(1);
  expect(
    () =>
      BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{}]), {
        json: {shape: 'arrow-table', schema: nullableSchema}
      }),
    'strict mode rejects missing fields'
  ).toThrow(/missing field id/);
  const missingFieldLog = makeTestLog();
  const missingFieldTable = BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{}, {}]), {
    core: {log: missingFieldLog},
    json: {
      shape: 'arrow-table',
      schema: nullableSchema,
      arrowConversion: {onMissingField: 'null'}
    }
  });
  expect(missingFieldTable.data.getChild('id')?.get(0), 'missing field can recover to null').toBe(
    null
  );
  expect(missingFieldLog.messages.length, 'missing field recovery logs once').toBe(1);
  expect(
    () =>
      BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{id: 1, extra: true}]), {
        json: {shape: 'arrow-table', schema: nullableSchema}
      }),
    'strict mode rejects extra fields'
  ).toThrow(/unexpected field extra/);
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
  expect(dropExtraTable.data.numCols, 'extra field is dropped').toBe(1);
  expect(dropExtraTable.data.getChild('extra'), 'extra field is not materialized').toBe(null);
  expect(extraFieldLog.messages.length, 'extra field recovery logs once').toBe(1);
  expect(
    () =>
      BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{id: 'bad'}]), {
        json: {
          shape: 'arrow-table',
          schema: strictSchema,
          arrowConversion: {onTypeMismatch: 'null'}
        }
      }),
    'non-nullable field still rejects null recovery'
  ).toThrow(/expected number/);
});
test('JSONTableLoader#parse(arrow-table integer conversion policy)', async () => {
  const nullableSchema: Schema = {
    fields: [{name: 'id', type: 'int8', nullable: true}],
    metadata: {}
  };
  const strictSchema: Schema = {
    fields: [{name: 'id', type: 'int8', nullable: false}],
    metadata: {}
  };
  expect(
    () =>
      BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{id: 1.5}]), {
        json: {shape: 'arrow-table', schema: nullableSchema}
      }),
    'strict mode rejects non-integral integer values'
  ).toThrow(/expected integer/);
  expect(
    () =>
      BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{id: -1}]), {
        json: {
          shape: 'arrow-table',
          schema: {fields: [{name: 'id', type: 'uint8', nullable: true}], metadata: {}}
        }
      }),
    'strict mode rejects out-of-range unsigned integer values'
  ).toThrow(/expected integer/);
  const nullIntegerTable = BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{id: 1.5}]), {
    json: {
      shape: 'arrow-table',
      schema: nullableSchema,
      arrowConversion: {integerConversion: 'null'}
    }
  });
  expect(
    nullIntegerTable.data.getChild('id')?.get(0),
    'integer conversion can recover to null'
  ).toBe(null);
  expect(
    () =>
      BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{id: 1.5}]), {
        json: {
          shape: 'arrow-table',
          schema: strictSchema,
          arrowConversion: {integerConversion: 'null'}
        }
      }),
    'non-nullable integer field still rejects null recovery'
  ).toThrow(/expected integer/);
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
  expect(
    clampedIntegerTable.data.getChild('id')?.get(0),
    'integer conversion can round and clamp'
  ).toBe(127);
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
  expect(warnedIntegerTable.data.getChild('id')?.get(0), 'warn mode rounds values').toBe(3);
  expect(integerConversionLog.messages.length, 'integer conversion warning logs once').toBe(1);
});
test('JSONTableLoader#parse(arrow-table Utf8 numeric conversion policy)', async () => {
  const schema: Schema = {
    fields: [{name: 'id', type: 'utf8', nullable: false}],
    metadata: {}
  };
  expect(
    () =>
      BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{id: 7}]), {
        json: {shape: 'arrow-table', schema}
      }),
    'strict mode rejects numeric Utf8 values by default'
  ).toThrow(/expected string/);
  const table = BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{id: 7}, {id: '8'}]), {
    json: {
      shape: 'arrow-table',
      schema,
      arrowConversion: {utf8Conversion: 'number-to-string'}
    }
  });
  expect(table.data.getChild('id')?.get(0), 'numeric Utf8 values can coerce to strings').toBe('7');
  expect(table.data.getChild('id')?.get(1), 'string Utf8 values remain unchanged').toBe('8');
  expect(
    () =>
      BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{id: true}]), {
        json: {
          shape: 'arrow-table',
          schema,
          arrowConversion: {utf8Conversion: 'number-to-string'}
        }
      }),
    'non-numeric primitive values still reject Utf8 coercion'
  ).toThrow(/expected string/);
});
test('JSONTableLoader#parse(arrow-table schema options require Arrow shape)', async () => {
  const schema: Schema = {
    fields: [{name: 'id', type: 'float64', nullable: true}],
    metadata: {}
  };
  expect(
    () => BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{id: 1}]), {json: {schema}}),
    'schema without Arrow shape throws'
  ).toThrow(/require json.shape to be "arrow-table"/);
  expect(
    () =>
      BundledJSONTableLoader.parseTextSync?.(JSON.stringify([{id: 1}]), {
        json: {arrowConversion: {onExtraField: 'drop'}}
      }),
    'conversion policy without Arrow shape throws'
  ).toThrow(/require json.shape to be "arrow-table"/);
});
test('GeoJSONLoader#parse(arrow-table options require Arrow shape)', async () => {
  const schema: Schema = {
    fields: [{name: 'geometry', type: 'binary', nullable: true}],
    metadata: {}
  };
  expect(
    () =>
      BundledGeoJSONLoader.parseTextSync?.(
        JSON.stringify({type: 'FeatureCollection', features: []}),
        {
          json: {schema}
        }
      ),
    'schema without Arrow shape throws'
  ).toThrow(/require geojson.shape to be "arrow-table"/);
  expect(
    () =>
      BundledGeoJSONLoader.parseTextSync?.(
        JSON.stringify({type: 'FeatureCollection', features: []}),
        {
          json: {arrowConversion: {onExtraField: 'drop'}}
        }
      ),
    'conversion policy without Arrow shape throws'
  ).toThrow(/require geojson.shape to be "arrow-table"/);
  expect(
    () =>
      BundledGeoJSONLoader.parseTextSync?.(
        JSON.stringify({type: 'FeatureCollection', features: []}),
        {
          json: {geoarrowGeometryColumn: 'geom'}
        }
      ),
    'geometry column option without Arrow shape throws'
  ).toThrow(/require geojson.shape to be "arrow-table"/);
});
test('JSONTableLoader#parseInBatches(arrow-table with supplied schema)', async () => {
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
      expect(batch.schema?.fields[0].name, 'uses supplied schema in data batch').toBe('id');
      rowCount += batch.data.numRows;
    }
  }
  expect(rowCount, 'converts all streamed rows').toBe(2);
});
test('JSONTableLoader#parseInBatches(fast arrow-table preserves raw Utf8 JSON fields)', async () => {
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
  expect(metadataValues, 'object values keep their exact JSON source or null').toEqual([
    '{ "nested" : [1, {"escaped":"\\u2603"}] }',
    null
  ]);
  expect(tagValues, 'array values keep their exact JSON source or recovered missing null').toEqual([
    '[ "alpha" , {"value":2} ]',
    null
  ]);
  expect(labelValues, 'ordinary Utf8 strings still decode').toEqual(['line\nbreak', 'plain']);
});
test('JSONTableLoader raw Utf8 capture is limited to fast streaming Arrow parsing', async () => {
  const schema: Schema = {
    fields: [{name: 'metadata', type: 'utf8', nullable: false}],
    metadata: {}
  };
  const jsonText = '{"items":[{"metadata":{"nested":true}}]}';
  expect(
    () =>
      BundledJSONTableLoader.parseTextSync?.(jsonText, {
        json: {shape: 'arrow-table', schema}
      }),
    'sync parsing still rejects object values for Utf8 schema fields'
  ).toThrow(/expected string/);
  const iterator = BundledJSONTableLoader.parseInBatches?.(makeChunkedTextIterator(jsonText, 8), {
    batchSize: 1,
    json: {shape: 'arrow-table', jsonpaths: ['$.items'], schema}
  });
  await expect(async () => {
    for await (const _batch of iterator) {
    }
  }, 'clarinet streaming still rejects object values for Utf8 schema fields').rejects.toThrow(
    /expected string/
  );
});
test('NDJSONLoader#parseInBatches(arrow-table freezes inferred schema)', async () => {
  const iterator = BundledNDJSONLoader.parseInBatches?.(
    makeChunkedTextIterator('{"id":1}\n{"id":2,"extra":true}\n', 9),
    {batchSize: 1, ndjson: {shape: 'arrow-table'}}
  );
  await await expect(async () => {
    for await (const _batch of iterator) {
    }
  }, 'later streamed batches are converted against the frozen schema').rejects.toThrow(
    /unexpected field extra/
  );
});
test('NDJSONLoader#parse(deprecated json.shape arrow-table alias)', async () => {
  const table = BundledNDJSONLoader.parseTextSync?.('{"id":1}\n{"id":2}\n', {
    json: {shape: 'arrow-table'}
  });
  expect(table.shape, 'deprecated json.shape alias requests Arrow output').toBe('arrow-table');
  expect(table.data.numRows, 'converts all rows').toBe(2);
});
test('NDJSONLoader#parseInBatches(arrow-table treats GeoJSON features as generic rows)', async () => {
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
    expect(batch.shape, 'data batch is converted to Arrow').toBe('arrow-table');
    expect(batch.data.getChild('type')?.get(0), 'keeps feature envelope type').toBe('Feature');
    expect(batch.data.getChild('name'), 'does not lift properties').toBe(null);
    expect(
      batch.schema?.fields.find(field => field.name === 'geometry')?.metadata?.[
        'ARROW:extension:name'
      ],
      'does not add GeoArrow metadata'
    ).toBe(undefined);
    rowCount += batch.length;
  }
  expect(rowCount, 'converts streamed feature rows generically').toBe(2);
});
test('GeoJSONLoader#exports official names only', () => {
  expect(typeof jsonModule.JSONTableLoader, 'JSONTableLoader is exported').toBe('object');
  expect(typeof jsonModule.GeoJSONLoader, 'GeoJSONLoader is exported').toBe('object');
  expect(typeof jsonModule.GeoJSONWriter, 'GeoJSONWriter is exported').toBe('object');
  expect((jsonModule as any)._GeoJSONLoader, 'underscored GeoJSONLoader is not exported').toBe(
    undefined
  );
  expect((jsonModule as any)._GeoJSONWriter, 'underscored GeoJSONWriter is not exported').toBe(
    undefined
  );
});
test('GeoJSONLoader#parse(default geojson-table shape)', async () => {
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
  expect(table.shape, 'returns GeoJSON table by default').toBe('geojson-table');
  expect(table.features.length, 'returns features').toBe(1);
});
test('GeoJSONLoader#parse(binary-feature-collection shape)', async () => {
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
  expect(binary.shape, 'returns binary feature collection').toBe('binary-feature-collection');
  expect(binary.points, 'returns point binary features').toBeTruthy();
});
test('GeoJSONLoader#parse(arrow-table GeoArrow WKB)', async () => {
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
  expect(table.shape, 'returns Arrow table').toBe('arrow-table');
  expect(table.data.getChild('name')?.get(0), 'lifts properties as columns').toBe('A');
  const geometryField = table.schema?.fields.find(field => field.name === 'geometry');
  expect(geometryField?.type, 'geometry field is binary').toBe('binary');
  expect(
    geometryField?.metadata?.['ARROW:extension:name'],
    'geometry field carries GeoArrow WKB extension metadata'
  ).toBe('geoarrow.wkb');
  expect(
    table.data.getChild('geometry')?.get(0) instanceof Uint8Array,
    'geometry is WKB'
  ).toBeTruthy();
});
test('GeoJSONLoader#parse(arrow-table preserves legacy GeoJSON CRS)', async () => {
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
  expect(geoMetadata?.columns.geometry.geojson_crs, 'preserves raw root CRS').toEqual(crs);
  expect(
    (geoMetadata?.columns.geometry.crs as any)?.id?.code,
    'maps known root CRS to GeoArrow CRS metadata'
  ).toBe('CRS84');
});
for (const config of TABLE_STREAMING_LOADER_CONFIGS) {
  test(`${config.name}#loadInBatches(jsonpaths, shape: arrow-table)`, async () => {
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
        expect(batch.jsonpath?.toString(), 'correct jsonpath on Arrow batch').toBe('$.features');
      }
    }
    expect(dataBatchCount > 0, 'received Arrow data batches').toBeTruthy();
    expect(rowCount, 'Correct number of Arrow rows received').toBe(308);
  });
}
test('GeoJSONLoader#loadInBatches(jsonpaths)', async () => {
  const iterator = await loadInBatches(GEOJSON_PATH, GeoJSONLoader, {
    json: {jsonpaths: ['$.features']}
  });
  let rowCount = 0;
  for await (const batch of iterator) {
    rowCount += batch.length;
    // @ts-ignore
    expect(batch.jsonpath?.toString(), 'correct jsonpath on batch').toBe('$.features');
  }
  expect(rowCount, 'Correct number of row received').toBe(308);
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
async function testContainerBatches(iterator, expectedCount) {
  let opencontainerBatchCount = 0;
  let closecontainerBatchCount = 0;
  for await (const batch of iterator) {
    switch (batch.batchType) {
      case 'partial-result':
        expect(
          batch.container.type,
          'batch.container should be set on partial-result'
        ).toBeTruthy();
        opencontainerBatchCount++;
        break;
      case 'final-result':
        expect(batch.container.type, 'batch.container should be set on final-result').toBeTruthy();
        closecontainerBatchCount++;
        break;
      default:
        expect(batch.container, 'batch.container should not be set').toBeFalsy();
    }
  }
  expect(opencontainerBatchCount, 'partial-result batch as expected').toBe(expectedCount);
  expect(closecontainerBatchCount, 'final-result batch as expected').toBe(expectedCount);
}
for (const config of STREAMING_LOADER_CONFIGS) {
  test(`${config.name}#loadInBatches(geojson.json, {metadata: true})`, async () => {
    let iterator = await loadInBatches(
      GEOJSON_PATH,
      JSONLoader,
      getStreamingLoaderOptions(config, {
        metadata: true,
        json: {table: true}
      })
    );
    await testContainerBatches(iterator, 1);
    iterator = await loadInBatches(
      GEOJSON_PATH,
      JSONLoader,
      getStreamingLoaderOptions(config, {
        metadata: false,
        json: {table: true}
      })
    );
    await testContainerBatches(iterator, 0);
  });
  test(`${config.name}#loadInBatches(streaming array of arrays)`, async () => {
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
            expect(batch.container, 'final batch contains json').toBeTruthy();
          }
          break;
        default:
      }
    }
    expect(rowCount, '247 rows found').toBe(247);
  });
}
/** Merges scenario options with the streaming parser backend under test. */
function getStreamingLoaderOptions(
  config: {
    options?: JSONLoaderOptions;
  },
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
  config: {
    options?: JSONTableLoaderOptions;
  },
  options: JSONTableLoaderOptions = {}
): JSONTableLoaderOptions {
  return {
    ...config.options,
    ...options,
    json: {...config.options?.json, ...options.json}
  };
}
/** Creates a probe.gl-compatible test logger that records one-time messages. */
function makeTestLog(): {
  messages: string[];
  once: (message: string) => () => void;
} {
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
