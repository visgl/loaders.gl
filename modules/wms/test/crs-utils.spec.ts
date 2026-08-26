import test from 'test/utils/vitest-tape';
import {
  areServiceCRSEquivalent,
  getServiceCRSAxisOrder,
  normalizeServiceCRS,
  selectServiceCRS
} from '@loaders.gl/wms';

test('service CRS utilities normalize OGC and ArcGIS identifiers', t => {
  t.equal(normalizeServiceCRS('urn:ogc:def:crs:EPSG::3857'), 'EPSG:3857');
  t.equal(normalizeServiceCRS('CRS:84'), 'CRS:84');
  t.ok(areServiceCRSEquivalent('EPSG:900913', 3857));
  t.equal(selectServiceCRS('EPSG:3857', ['EPSG:4326', 'EPSG:900913']), 'EPSG:900913');
  t.equal(getServiceCRSAxisOrder('EPSG:4326'), 'yx');
  t.equal(getServiceCRSAxisOrder('CRS:84'), 'xy');
  t.end();
});
