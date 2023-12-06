// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import type {Feature, GeoJSONTable} from '@loaders.gl/schema';
import type * as arrow from 'apache-arrow';
import type {ArrowTable} from '../lib/arrow-table';
import {serializeArrowSchema, parseGeometryFromArrow} from '@loaders.gl/arrow';
import {getGeometryColumnsFromSchema} from '@loaders.gl/gis';

/**
 * Wrap an apache arrow table in a loaders.gl table wrapper.
 * From this additional conversions are available.
 * @param arrowTable
 * @returns
 */
export function convertApacheArrowToArrowTable(arrowTable: arrow.Table): ArrowTable {
  return {
    shape: 'arrow-table',
    data: arrowTable
  };
}

/**
 * Convert an Apache Arrow table to a GeoJSONTable
 * @note Currently does not convert schema
 */
export function convertArrowToGeoJSONTable(table: ArrowTable): GeoJSONTable {
  const arrowTable = table.data;
  const schema = serializeArrowSchema(arrowTable.schema);
  const geometryColumns = getGeometryColumnsFromSchema(schema);

  // get encoding from geometryColumns['geometry']
  const encoding = geometryColumns.geometry.encoding;

  const features: Feature[] = [];

  for (let row = 0; row < arrowTable.numRows; row++) {
    // get first geometry from arrow geometry column
    const arrowGeometry = arrowTable.getChild('geometry')?.get(row);
    const arrowGeometryObject = {encoding, data: arrowGeometry};

    // parse arrow geometry to geojson feature
    const feature = parseGeometryFromArrow(arrowGeometryObject);
    if (feature) {
      features.push(feature);
    }
  }

  return {
    shape: 'geojson-table',
    type: 'FeatureCollection',
    features
  };
}
