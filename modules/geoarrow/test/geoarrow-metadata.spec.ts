// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {mergeGeoArrowMetadata} from '@loaders.gl/geoarrow';

test('mergeGeoArrowMetadata is deterministic and unions geometry types canonically', () => {
  const left = mergeGeoArrowMetadata([
    {
      encoding: 'geoarrow.wkb',
      geometry_types: ['Polygon', 'Point Z'],
      crs: {type: 'name', properties: {name: 'EPSG:4326'}},
      source: {version: 1, name: 'fixture'}
    },
    {
      encoding: 'geoarrow.wkb',
      geometry_types: ['LineString', 'Point'],
      crs: {properties: {name: 'EPSG:4326'}, type: 'name'},
      source: {name: 'fixture', version: 1}
    }
  ]);
  const right = mergeGeoArrowMetadata([
    {
      encoding: 'geoarrow.wkb',
      geometry_types: ['LineString', 'Point'],
      crs: {properties: {name: 'EPSG:4326'}, type: 'name'},
      source: {name: 'fixture', version: 1}
    },
    {
      encoding: 'geoarrow.wkb',
      geometry_types: ['Polygon', 'Point Z'],
      crs: {type: 'name', properties: {name: 'EPSG:4326'}},
      source: {version: 1, name: 'fixture'}
    }
  ]);

  expect(left).toEqual(right);
  expect(left.valid).toBe(true);
  expect(left.metadata.geometry_types).toEqual(['Point', 'Point Z', 'LineString', 'Polygon']);
  expect(left.metadata.source).toEqual({version: 1, name: 'fixture'});
});

test('mergeGeoArrowMetadata reports strict conflicts without preserving unsafe claims', () => {
  const result = mergeGeoArrowMetadata([
    {encoding: 'geoarrow.point', crs: 'EPSG:4326'},
    {encoding: 'geoarrow.wkb', crs: 'EPSG:3857'}
  ]);

  expect(result.valid).toBe(false);
  expect(result.metadata).toEqual({});
  expect(result.conflicts.map(conflict => [conflict.key, conflict.action])).toEqual([
    ['crs', 'rejected'],
    ['encoding', 'rejected']
  ]);
});

test('mergeGeoArrowMetadata supports permissive and repair conflict policies', () => {
  const values = [{encoding: 'geoarrow.point'}, {encoding: 'geoarrow.linestring'}] as const;
  const permissive = mergeGeoArrowMetadata(values, {mode: 'permissive'});
  const repair = mergeGeoArrowMetadata(values, {mode: 'repair'});

  expect(permissive.metadata.encoding).toBe('geoarrow.point');
  expect(permissive.conflicts[0]?.action).toBe('preserved-first');
  expect(repair.metadata).toEqual({});
  expect(repair.conflicts[0]?.action).toBe('dropped');
});
