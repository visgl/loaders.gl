// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {createScanQueryMetadata} from '../../../src';

describe('createScanQueryMetadata', () => {
  test('derives immutable panel columns from a schema', () => {
    const metadata = createScanQueryMetadata({
      sourceType: 'example',
      queryType: 'table',
      execution: {status: 'supported', method: 'read'},
      schema: {
        fields: [
          {
            name: 'id',
            type: 'int64',
            nullable: false,
            metadata: {title: 'Feature ID', description: 'Stable identifier'}
          },
          {name: 'geometry', type: 'binary', nullable: true}
        ],
        metadata: {format: 'example'}
      },
      columnRoles: {id: 'identifier', geometry: 'geometry'},
      capabilities: {
        table: {
          projection: 'pushdown',
          predicate: 'residual',
          limit: 'residual',
          streaming: true,
          cancellation: true
        },
        bounds: 'pushdown'
      },
      spatial: {
        bounds: {minimum: [-180, -90], maximum: [180, 90]},
        coordinateReferenceSystems: ['EPSG:4326'],
        spatialReference: {
          crs: {
            state: 'explicit',
            definition: 'EPSG:4326',
            representation: 'identifier',
            provenance: 'metadata'
          },
          coordinateFrame: 'geographic',
          coordinateOrder: ['x', 'y']
        }
      },
      statistics: {rowCount: 12n}
    });

    expect(metadata.columns).toEqual([
      {
        name: 'id',
        type: 'int64',
        nullable: false,
        role: 'identifier',
        title: 'Feature ID',
        description: 'Stable identifier',
        metadata: {title: 'Feature ID', description: 'Stable identifier'}
      },
      {
        name: 'geometry',
        type: 'binary',
        nullable: true,
        role: 'geometry',
        title: undefined,
        description: undefined,
        metadata: {}
      }
    ]);
    expect(metadata.spatial?.bounds).toEqual({
      minimum: [-180, -90],
      maximum: [180, 90]
    });
    expect(metadata.spatial?.spatialReference?.crs).toEqual({
      state: 'explicit',
      definition: 'EPSG:4326',
      representation: 'identifier',
      provenance: 'metadata'
    });
    expect(Object.isFrozen(metadata)).toBe(true);
    expect(metadata.execution).toEqual({status: 'supported', method: 'read'});
    expect(Object.isFrozen(metadata.execution)).toBe(true);
    expect(Object.isFrozen(metadata.columns)).toBe(true);
    expect(Object.isFrozen(metadata.schema.fields)).toBe(true);
    expect(Object.isFrozen(metadata.spatial?.spatialReference)).toBe(true);
  });

  test('normalizes multiscale raster levels', () => {
    const metadata = createScanQueryMetadata({
      sourceType: 'omezarr',
      queryType: 'raster',
      execution: {status: 'supported', method: 'getRaster'},
      schema: {fields: [], metadata: {}},
      capabilities: {levelOfDetail: 'pushdown'},
      levels: [{index: 0, width: 1024, height: 512, scale: [1, 1]}]
    });

    expect(metadata.levels).toEqual([{index: 0, width: 1024, height: 512, scale: [1, 1]}]);
    expect(Object.isFrozen(metadata.levels)).toBe(true);
    expect(Object.isFrozen(metadata.levels?.[0])).toBe(true);
  });

  test('requires a concrete reason for metadata-only sources', () => {
    expect(() =>
      createScanQueryMetadata({
        sourceType: 'example',
        queryType: 'point-cloud',
        execution: {status: 'metadata-only', reason: '   '},
        schema: {fields: [], metadata: {}},
        capabilities: {}
      })
    ).toThrow('requires a concrete reason');
  });

  test('rejects execution methods from another query family', () => {
    expect(() =>
      createScanQueryMetadata({
        sourceType: 'example',
        queryType: 'raster',
        execution: {status: 'supported', method: 'read'},
        schema: {fields: [], metadata: {}},
        capabilities: {}
      })
    ).toThrow('not valid for raster queries');
  });
});
