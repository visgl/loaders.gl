import {fetchFile, isBrowser} from '@loaders.gl/core';
import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {GeoPackageDataSource} from '../src/geopackage-source-loader';

const GEOPACKAGE_FIXTURE = '@loaders.gl/geopackage/test/data/rivers_multi.gpkg';

test.runIf(isBrowser)(
  'GeoPackage source exposes shared scan metadata for the default table',
  async () => {
    const response = await fetchFile(GEOPACKAGE_FIXTURE);
    const source = new GeoPackageDataSource(new Blob([await response.arrayBuffer()]), {
      geopackage: {}
    });
    const metadata = await source.getQueryMetadata();

    expect(metadata.queryType).toBe('table');
    expect(metadata.columns.map(column => column.name)).toContain('geometry');
    expect(metadata.columns.find(column => column.name === 'geometry')?.role).toBe('geometry');
    expect(metadata.capabilities.table?.projection).toBe('residual');
  }
);

test.runIf(isBrowser)(
  'GeoPackage source handles missing defaults, bounds, and geometry fields',
  async () => {
    const source = new GeoPackageDataSource(new Blob([]), {geopackage: {}});
    const tableData = arrow.tableFromArrays({value: [1]});
    source.getMetadata = async () => ({
      tables: [
        {
          name: 'fallback',
          geometryColumnName: 'missing',
          geometryTypeName: 'POINT',
          isDefault: false
        }
      ]
    });
    source.getTable = async () => ({shape: 'arrow-table', data: tableData}) as never;

    const metadata = await source.getQueryMetadata();
    expect(metadata.name).toBe('fallback');
    expect(metadata.spatial).toBeUndefined();
    expect(metadata.columns[0]?.role).toBe('attribute');
  }
);

test.runIf(isBrowser)(
  'GeoPackage source marks a source geometry field when it is not normalized',
  async () => {
    const source = new GeoPackageDataSource(new Blob([]), {geopackage: {}});
    const tableData = arrow.tableFromArrays({geom: [1]});
    source.getMetadata = async () => ({
      tables: [
        {
          name: 'geometry',
          identifier: 'identified',
          description: 'description',
          geometryColumnName: 'geom',
          geometryTypeName: 'POINT',
          bounds: [
            [0, 1],
            [2, 3]
          ],
          isDefault: true
        }
      ]
    });
    source.getTable = async () => ({shape: 'arrow-table', data: tableData}) as never;

    const metadata = await source.getQueryMetadata();
    expect(metadata.name).toBe('identified');
    expect(metadata.description).toBe('description');
    expect(metadata.spatial?.bounds).toEqual({minimum: [0, 1], maximum: [2, 3]});
    expect(metadata.columns[0]?.role).toBe('geometry');
  }
);
