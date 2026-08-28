import {expect, test} from 'vitest';
import {
  areServiceCRSEquivalent,
  getServiceCRSAxisOrder,
  normalizeServiceCRS,
  selectServiceCRS
} from '@loaders.gl/wms';

test('service CRS utilities normalize OGC and ArcGIS identifiers', () => {
  expect(normalizeServiceCRS('urn:ogc:def:crs:EPSG::3857')).toBe('EPSG:3857');
  expect(normalizeServiceCRS('http://www.opengis.net/def/crs/EPSG/0/3857')).toBe('EPSG:3857');
  expect(normalizeServiceCRS('CRS:84')).toBe('CRS:84');
  expect(areServiceCRSEquivalent('EPSG:900913', 3857)).toBe(true);
  expect(selectServiceCRS('EPSG:3857', ['EPSG:4326', 'EPSG:900913'])).toBe('EPSG:900913');
  expect(getServiceCRSAxisOrder('EPSG:4326')).toBe('yx');
  expect(getServiceCRSAxisOrder('CRS:84')).toBe('xy');
});
