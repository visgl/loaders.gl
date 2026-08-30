// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import type {GeoMetadata} from '@loaders.gl/schema';
import {
  getGeoMetadata,
  getMetadataValue,
  parseJSONStringMetadata,
  setGeoMetadata,
  setMetadataValue,
  unpackGeoMetadata,
  unpackJSONStringMetadata
} from '@loaders.gl/schema';

describe('schema metadata helpers', () => {
  test('reads and writes Map and object metadata', () => {
    const mapMetadata = new Map<string, string>();
    const objectMetadata: Record<string, string> = {};

    expect(getMetadataValue(mapMetadata, 'missing')).toBeNull();
    expect(getMetadataValue(objectMetadata, 'missing')).toBeNull();
    setMetadataValue(mapMetadata, 'key', 'map value');
    setMetadataValue(objectMetadata, 'key', 'object value');
    expect(getMetadataValue(mapMetadata, 'key')).toBe('map value');
    expect(getMetadataValue(objectMetadata, 'key')).toBe('object value');
  });

  test('parses JSON metadata defensively', () => {
    expect(parseJSONStringMetadata('')).toBeNull();
    expect(parseJSONStringMetadata('{"value": 1}')).toEqual({value: 1});
    expect(parseJSONStringMetadata('null')).toBeNull();
    expect(parseJSONStringMetadata('1')).toBeNull();
    expect(parseJSONStringMetadata('[1, 2]')).toEqual([1, 2]);
    expect(parseJSONStringMetadata('{')).toBeNull();
  });

  test('reads and writes GeoParquet metadata', () => {
    const geoMetadata: GeoMetadata = {
      version: '1.1.0',
      primary_column: 'geometry',
      columns: {
        geometry: {encoding: 'WKB', geometry_types: ['Point']}
      }
    };
    const mapMetadata = new Map<string, string>();
    const objectMetadata: Record<string, string> = {};

    expect(getGeoMetadata(undefined)).toBeNull();
    expect(getGeoMetadata(objectMetadata)).toBeNull();
    setGeoMetadata(mapMetadata, geoMetadata);
    setGeoMetadata(objectMetadata, geoMetadata);
    expect(getGeoMetadata(mapMetadata)?.columns.geometry.encoding).toBe('wkb');
    expect(getGeoMetadata(objectMetadata)?.primary_column).toBe('geometry');
    expect(getGeoMetadata({geo: '{'})).toBeNull();
    expect(getGeoMetadata({geo: JSON.stringify({columns: {empty: null, value: 1}})})).toEqual({
      columns: {empty: null, value: 1}
    });
  });

  test('unpacks GeoParquet metadata into flat entries', () => {
    const metadata: Record<string, string> = {};
    unpackGeoMetadata(metadata);
    expect(metadata).toEqual({});

    setGeoMetadata(metadata, {
      version: '1.0.0',
      primary_column: 'shape',
      columns: {shape: {encoding: 'WKB', geometry_types: ['Polygon']}}
    });
    unpackGeoMetadata(metadata);
    expect(metadata['geo.version']).toBe('1.0.0');
    expect(metadata['geo.primary_column']).toBe('shape');
    expect(metadata['geo.columns']).toBe('shape');

    const mapMetadata = new Map<string, string>([['geo', JSON.stringify({columns: undefined})]]);
    unpackGeoMetadata(mapMetadata);
    expect(mapMetadata.get('geo.columns')).toBe('');
  });

  test('unpacks arbitrary JSON metadata', () => {
    const metadata: Record<string, string> = {config: JSON.stringify({name: 'test', count: 2})};
    unpackJSONStringMetadata(metadata, 'config');
    expect(metadata['config.name']).toBe('test');
    expect(metadata['config.count']).toBe('2');
    unpackJSONStringMetadata(metadata, 'missing');

    const mapMetadata = new Map<string, string>([
      ['config', JSON.stringify({enabled: true, options: {mode: 'fast'}})]
    ]);
    unpackJSONStringMetadata(mapMetadata, 'config');
    expect(mapMetadata.get('config.enabled')).toBe('true');
    expect(mapMetadata.get('config.options')).toBe('{"mode":"fast"}');
  });
});
