// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeEach, expect, test, vi} from 'vitest';
import * as arrow from 'apache-arrow';

const sourceMocks = vi.hoisted(() => ({
  loadDatabase: vi.fn(),
  listTables: vi.fn(),
  getProjections: vi.fn(),
  getSchema: vi.fn(),
  parseTable: vi.fn()
}));

vi.mock('../src/lib/parse-geopackage', async importOriginal => {
  const original = await importOriginal<typeof import('../src/lib/parse-geopackage')>();
  return {
    ...original,
    loadGeoPackageDatabase: sourceMocks.loadDatabase,
    listGeoPackageVectorTables: sourceMocks.listTables,
    getProjections: sourceMocks.getProjections,
    getGeoPackageArrowSchema: sourceMocks.getSchema,
    parseGeoPackageToArrow: sourceMocks.parseTable
  };
});

import {GeoPackageDataSource} from '../src/geopackage-source-loader';

beforeEach(() => {
  vi.clearAllMocks();
  sourceMocks.loadDatabase.mockResolvedValue({});
  sourceMocks.listTables.mockReturnValue([
    {
      name: 'features',
      geometryColumnName: 'geom',
      geometryTypeName: 'POINT',
      z: 0,
      m: 0,
      lastChange: ''
    }
  ]);
  sourceMocks.getProjections.mockReturnValue({});
  sourceMocks.getSchema.mockReturnValue({
    fields: [{name: 'geometry', type: 'binary', nullable: true}],
    metadata: {}
  });
  sourceMocks.parseTable.mockResolvedValue({
    shape: 'arrow-table',
    data: arrow.tableFromArrays({value: [1]})
  });
});

test('GeoPackage URL metadata and table reads share bytes and cache discovery', async () => {
  const fetchBytes = vi.fn(async () => new Response(new Uint8Array([1, 2, 3])));
  const source = new GeoPackageDataSource('/data.gpkg', {
    core: {fetch: fetchBytes},
    geopackage: {table: 'features'},
    gis: {reproject: false}
  });
  const [firstMetadata, secondMetadata] = await Promise.all([
    source.getMetadata(),
    source.getMetadata()
  ]);
  expect(firstMetadata).toBe(secondMetadata);
  expect(firstMetadata.tables[0]).toMatchObject({
    name: 'features',
    isDefault: true,
    crs: undefined,
    bounds: undefined
  });
  await source.getTable('explicit');
  await source.getTable();
  expect(fetchBytes).toHaveBeenCalledOnce();
  expect(sourceMocks.loadDatabase).toHaveBeenCalledOnce();
  expect(sourceMocks.parseTable.mock.calls.map(([, options]) => options.geopackage.table)).toEqual([
    'explicit',
    'features'
  ]);
  expect(sourceMocks.parseTable.mock.calls[0][0]).toBe(sourceMocks.loadDatabase.mock.calls[0][0]);
});

test.each([
  [404, 'Not Found'],
  [503, 'Unavailable']
])('GeoPackage reports and retains failed URL reads (%i)', async (status, statusText) => {
  const fetchBytes = vi.fn(async () => new Response(null, {status, statusText}));
  const onError = vi.fn();
  const source = new GeoPackageDataSource('/missing.gpkg', {
    core: {fetch: fetchBytes, onError},
    geopackage: {}
  });
  await expect(source.getMetadata()).rejects.toThrow(`${status} ${statusText}`);
  await expect(source.getTable()).rejects.toThrow(`${status} ${statusText}`);
  expect(fetchBytes).toHaveBeenCalledOnce();
  expect(onError).toHaveBeenCalledWith(
    expect.objectContaining({message: `${status} ${statusText}`}),
    source
  );
  expect(sourceMocks.loadDatabase).not.toHaveBeenCalled();
});

test('GeoPackage reports non-Error Blob failures with source context', async () => {
  const onError = vi.fn();
  const blob = new Blob([]);
  vi.spyOn(blob, 'arrayBuffer').mockRejectedValue({reason: 'unreadable'});
  const source = new GeoPackageDataSource(blob, {core: {onError}, geopackage: {}});
  await expect(source.getTable()).rejects.toThrow('Failed to load GeoPackage from Blob input');
  expect(onError).toHaveBeenCalledOnce();
});

test('GeoPackage query metadata rejects empty discovery and cancellation before and after lookup', async () => {
  const source = new GeoPackageDataSource(new Blob([]), {geopackage: {}});
  const getMetadata = vi.spyOn(source, 'getMetadata').mockResolvedValue({tables: []});
  await expect(source.getQueryMetadata()).rejects.toThrow('no vector feature tables');
  const controller = new AbortController();
  controller.abort();
  await expect(source.getQueryMetadata({signal: controller.signal})).rejects.toMatchObject({
    name: 'AbortError'
  });
  expect(getMetadata).toHaveBeenCalledTimes(1);

  const duringLookup = new AbortController();
  getMetadata.mockImplementation(async () => {
    duringLookup.abort();
    return {tables: []};
  });
  await expect(source.getQueryMetadata({signal: duringLookup.signal})).rejects.toMatchObject({
    name: 'AbortError'
  });
});

test('GeoPackage query cancellation prevents parsing and rejects cancellation during parsing', async () => {
  const source = new GeoPackageDataSource(new Blob([]), {geopackage: {}});
  const beforeRead = new AbortController();
  beforeRead.abort();
  await expect(source.query({signal: beforeRead.signal})).rejects.toMatchObject({
    name: 'AbortError'
  });
  expect(sourceMocks.parseTable).not.toHaveBeenCalled();

  const duringRead = new AbortController();
  sourceMocks.parseTable.mockImplementation(async () => {
    duringRead.abort();
    return {shape: 'arrow-table', data: arrow.tableFromArrays({value: [1]})};
  });
  await expect(source.query({signal: duringRead.signal})).rejects.toMatchObject({
    name: 'AbortError'
  });
});
