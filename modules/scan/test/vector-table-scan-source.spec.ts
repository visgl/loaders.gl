// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import type {
  GetFeaturesParameters,
  GetTileParameters,
  VectorSource,
  VectorTileSource
} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';
import {
  VectorFeatureTableScanSource,
  VectorTileTableScanSource
} from '../src/vector-table-scan-source';

test('VectorTileTableScanSource binds tile addressing outside the portable query', async () => {
  const sourceTable = makeArrowTable({id: [1, 2, 3], value: [10, 20, 30]});
  const requestedTiles: GetTileParameters[] = [];
  const tileLayers = ['roads'];
  const source = {
    async getMetadata() {
      return {minZoom: 0, maxZoom: 10};
    },
    async getTile() {
      return null;
    },
    async getTileData() {
      return null;
    },
    async getSchema() {
      return sourceTable.schema;
    },
    async getVectorTile(parameters: GetTileParameters) {
      requestedTiles.push(parameters);
      return sourceTable;
    }
  } satisfies VectorTileSource;
  const scanSource = new VectorTileTableScanSource(source, {
    sourceType: 'mvt-tile-table',
    name: 'Roads',
    description: 'Addressed roads tile',
    tile: {x: 2, y: 1, z: 2, layers: tileLayers}
  });
  tileLayers.push('mutated');

  const metadata = await scanSource.getQueryMetadata();
  expect(metadata).toMatchObject({
    sourceType: 'mvt-tile-table',
    queryType: 'table',
    execution: {status: 'supported', method: 'read'},
    name: 'Roads',
    description: 'Addressed roads tile',
    statistics: {rowCount: 3}
  });
  expect(metadata.columns.map(column => column.name)).toEqual(['id', 'value']);
  expect(metadata.capabilities.bounds).toBe('unsupported');
  expect(metadata.spatial?.bounds?.minimum[0]).toBe(0);
  expect(metadata.spatial?.bounds?.maximum[0]).toBe(90);

  const batches = [];
  for await (const batch of scanSource.read({
    predicate: {op: '>', args: [{property: 'value'}, 10]},
    columns: ['id'],
    limit: 1
  })) {
    batches.push(batch);
  }
  expect(batches.map(batch => batch.length)).toEqual([1]);
  expect(Array.from(batches[0].data.getChild('id')?.toArray() || [])).toEqual([2]);
  expect(requestedTiles).toHaveLength(1);
  expect(requestedTiles[0]).toMatchObject({x: 2, y: 1, z: 2, layers: ['roads']});
  expect(Object.isFrozen(scanSource.tile.layers)).toBe(true);
});

test('VectorFeatureTableScanSource binds service controls and requests Arrow output', async () => {
  const sourceTable = makeArrowTable({geometry: ['first', 'second'], score: [1, 2]});
  const requests: GetFeaturesParameters[] = [];
  const source = {
    async getSchema() {
      return sourceTable.schema;
    },
    async getMetadata() {
      return {name: 'features', keywords: [], layers: []};
    },
    async getFeatures(parameters: GetFeaturesParameters) {
      requests.push(parameters);
      return sourceTable;
    }
  } as VectorSource;
  const scanSource = new VectorFeatureTableScanSource(source, {
    sourceType: 'wfs-feature-table',
    request: {
      layers: 'buildings',
      boundingBox: [
        [-10, -5],
        [10, 5]
      ],
      crs: 'EPSG:4326'
    }
  });

  const metadata = await scanSource.getQueryMetadata();
  expect(metadata.columns.find(column => column.name === 'geometry')?.role).toBe('geometry');
  expect(metadata.spatial).toEqual({
    bounds: {minimum: [-10, -5], maximum: [10, 5]},
    coordinateReferenceSystems: ['EPSG:4326']
  });
  expect(requests[0]).toMatchObject({layers: 'buildings', format: 'arrow'});

  const explanation = await scanSource.explain({columns: ['score'], limit: 1});
  expect(explanation.plan.map(operator => operator.kind)).toEqual(['scan', 'project', 'limit']);
  expect(explanation.operators.projection).toEqual({enabled: true, support: 'residual'});
  expect(explanation.operators.limit).toEqual({enabled: true, support: 'residual'});
  expect(requests).toHaveLength(1);
});

test('addressed vector scans propagate cancellation and reject non-Arrow output', async () => {
  let requestCount = 0;
  const source = {
    async getMetadata() {
      return {};
    },
    async getTile() {
      return null;
    },
    async getTileData() {
      return null;
    },
    async getSchema() {
      return {fields: [], metadata: {}};
    },
    async getVectorTile() {
      requestCount++;
      return {shape: 'geojson-table', type: 'FeatureCollection', features: []} as const;
    }
  } satisfies VectorTileSource;
  const cancelledSource = new VectorTileTableScanSource(source, {
    tile: {x: 0, y: 0, z: 0}
  });
  const controller = new AbortController();
  controller.abort();

  await expect(cancelledSource.getQueryMetadata({signal: controller.signal})).rejects.toMatchObject(
    {
      name: 'AbortError'
    }
  );
  expect(requestCount).toBe(0);

  const missingReasonSignal = {aborted: true, reason: undefined} as AbortSignal;
  await expect(
    cancelledSource.getQueryMetadata({signal: missingReasonSignal})
  ).rejects.toMatchObject({name: 'AbortError'});

  const emptySource = new VectorTileTableScanSource(
    {
      ...source,
      async getVectorTile() {
        return null;
      }
    },
    {tile: {x: 0, y: 0, z: 0}}
  );
  await expect(emptySource.getQueryMetadata()).rejects.toThrow('did not return a feature table');

  const invalidSource = new VectorTileTableScanSource(source, {tile: {x: 0, y: 0, z: 0}});
  await expect(invalidSource.getQueryMetadata()).rejects.toThrow('shape "arrow-table"');
  await expect(invalidSource.getQueryMetadata()).rejects.toThrow('shape "arrow-table"');
  expect(requestCount).toBe(2);
});

test('addressed vector scans infer missing schema and optional service metadata', async () => {
  const data = arrow.tableFromArrays({id: [1]});
  const sourceTable = {shape: 'arrow-table', data} as ArrowTable;
  const requests: GetFeaturesParameters[] = [];
  const source = {
    async getSchema() {
      return convertArrowToSchema(data.schema);
    },
    async getMetadata() {
      return {name: 'features', keywords: [], layers: []};
    },
    async getFeatures(parameters: GetFeaturesParameters) {
      requests.push(parameters);
      return sourceTable;
    }
  } as VectorSource;
  const layers = ['roads', 'buildings'];
  const boundingBox: GetFeaturesParameters['boundingBox'] = [
    [0, 0],
    [1, 1]
  ];
  const scanSource = new VectorFeatureTableScanSource(source, {
    request: {
      layers,
      boundingBox
    }
  });
  layers.push('mutated');
  boundingBox[0][0] = 10;

  const metadata = await scanSource.getQueryMetadata();
  expect(metadata.sourceType).toBe('vector-feature-table');
  expect(metadata.description).toBe('Vector feature request for roads, buildings');
  expect(metadata.columns.map(column => column.name)).toEqual(['id']);
  expect(metadata.spatial?.coordinateReferenceSystems).toBeUndefined();
  expect(requests[0]).toMatchObject({
    layers: ['roads', 'buildings'],
    boundingBox: [
      [0, 0],
      [1, 1]
    ]
  });
  expect(Object.isFrozen(scanSource.request.layers)).toBe(true);
  expect(Object.isFrozen(scanSource.request.boundingBox)).toBe(true);
  expect(Object.isFrozen(scanSource.request.boundingBox[0])).toBe(true);
});

test('addressed vector scans isolate shared loads from caller cancellation', async () => {
  const sourceTable = makeArrowTable({id: [1]});
  let resolveLoad!: (table: ArrowTable) => void;
  let loadCount = 0;
  let physicalSignal: AbortSignal | undefined;
  const source = {
    async getMetadata() {
      return {};
    },
    async getTile() {
      return null;
    },
    async getTileData() {
      return null;
    },
    async getSchema() {
      return sourceTable.schema;
    },
    getVectorTile(parameters: GetTileParameters) {
      loadCount++;
      physicalSignal = parameters.signal;
      return new Promise<ArrowTable>(resolve => {
        resolveLoad = resolve;
      });
    }
  } satisfies VectorTileSource;
  const scanSource = new VectorTileTableScanSource(source, {tile: {x: 0, y: 0, z: 0}});
  const cancelledController = new AbortController();
  const successfulController = new AbortController();

  const cancelledMetadata = scanSource.getQueryMetadata({signal: cancelledController.signal});
  const successfulQuery = scanSource.query({signal: successfulController.signal});
  cancelledController.abort();

  await expect(cancelledMetadata).rejects.toMatchObject({name: 'AbortError'});
  resolveLoad(sourceTable);
  await expect(successfulQuery).resolves.toMatchObject({shape: 'arrow-table'});
  expect(loadCount).toBe(1);
  expect(physicalSignal).toBeUndefined();
});

/** Creates a loaders.gl Arrow table from ordinary named arrays. */
function makeArrowTable(
  columns: Record<string, arrow.TypedArray | readonly unknown[]>
): ArrowTable {
  const data = arrow.tableFromArrays(columns);
  return {shape: 'arrow-table', schema: convertArrowToSchema(data.schema), data};
}
