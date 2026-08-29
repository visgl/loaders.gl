// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {getGeoMetadata, mergeGeoArrowSchemas} from '@loaders.gl/geoarrow';

test('mergeGeoArrowSchemas preserves fields and unions GeoParquet geometry types', () => {
  const firstSchema = createSchema('geoarrow.wkb', 'EPSG:4326', ['Point'], 'left');
  const secondSchema = createSchema('geoarrow.wkb', 'EPSG:4326', ['LineString'], 'left');

  const result = mergeGeoArrowSchemas([secondSchema, firstSchema]);

  expect(result.valid).toBe(true);
  expect(result.conflicts).toEqual([]);
  expect(result.schema?.fields.map(field => field.name)).toEqual(['id', 'geometry']);
  expect(result.schema?.metadata?.get('source')).toBe('left');
  expect(getGeoMetadata(result.schema?.metadata)?.columns.geometry.geometry_types).toEqual([
    'Point',
    'LineString'
  ]);
  expect(JSON.parse(result.schema!.fields[1].metadata!.get('ARROW:extension:metadata')!)).toEqual({
    encoding: 'geoarrow.wkb',
    crs: 'EPSG:4326',
    geometry_types: ['Point', 'LineString']
  });
});

test('mergeGeoArrowSchemas reports and removes strict field metadata conflicts', () => {
  const firstSchema = createSchema('geoarrow.point', 'EPSG:4326', ['Point'], 'left');
  const secondSchema = createSchema('geoarrow.linestring', 'EPSG:3857', ['LineString'], 'right');

  const result = mergeGeoArrowSchemas([firstSchema, secondSchema]);

  expect(result.valid).toBe(false);
  expect(result.conflicts.map(conflict => conflict.key)).toContain('geometry.encoding');
  expect(result.conflicts.map(conflict => conflict.key)).toContain('geometry.crs');
  expect(result.schema?.fields[1].metadata?.has('ARROW:extension:name')).toBe(false);
  expect(result.schema?.fields[1].metadata?.has('ARROW:extension:metadata')).toBe(false);
  expect(result.schema?.metadata?.has('geo')).toBe(false);
});

test('mergeGeoArrowSchemas keeps the first metadata in permissive mode', () => {
  const firstSchema = createSchema('geoarrow.point', 'EPSG:4326', ['Point'], 'left');
  const secondSchema = createSchema('geoarrow.linestring', 'EPSG:3857', ['LineString'], 'right');

  const result = mergeGeoArrowSchemas([firstSchema, secondSchema], {mode: 'permissive'});

  expect(result.valid).toBe(false);
  expect(result.schema?.fields[1].metadata?.get('ARROW:extension:name')).toBe('geoarrow.point');
  expect(result.schema?.metadata?.get('source')).toBe('left');
  expect(result.conflicts.every(conflict => conflict.action === 'preserved-first')).toBe(true);
});

test('mergeGeoArrowSchemas rejects incompatible physical fields', () => {
  const firstSchema = createSchema('geoarrow.wkb', 'EPSG:4326', ['Point'], 'left');
  const incompatibleSchema = new arrow.Schema([
    new arrow.Field('id', new arrow.Int32(), false),
    new arrow.Field('geometry', new arrow.Utf8(), true)
  ]);

  const result = mergeGeoArrowSchemas([firstSchema, incompatibleSchema]);

  expect(result.valid).toBe(false);
  expect(result.conflicts).toContainEqual(
    expect.objectContaining({key: 'field.geometry.type', action: 'rejected'})
  );
});

function createSchema(
  encoding: string,
  crs: string,
  geometryTypes: string[],
  source: string
): arrow.Schema {
  const geometryMetadata = new Map([
    ['ARROW:extension:name', encoding],
    ['ARROW:extension:metadata', JSON.stringify({encoding, crs, geometry_types: geometryTypes})]
  ]);
  const fields = [
    new arrow.Field('id', new arrow.Int32(), false),
    new arrow.Field('geometry', new arrow.Binary(), true, geometryMetadata)
  ];
  const geoMetadata = {
    version: '1.1.0',
    primary_column: 'geometry',
    columns: {
      geometry: {encoding: encoding.replace('geoarrow.', ''), geometry_types: geometryTypes, crs}
    }
  };
  return new arrow.Schema(
    fields,
    new Map([
      ['source', source],
      ['geo', JSON.stringify(geoMetadata)]
    ])
  );
}
