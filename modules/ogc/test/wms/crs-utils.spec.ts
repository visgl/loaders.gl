// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  areServiceCRSEquivalent,
  getServiceCRSAxisOrder,
  normalizeServiceCRS,
  selectServiceCRS
} from '@loaders.gl/ogc/wms/api';
import {getServiceCRSMetersPerUnit} from '../../src/wms/crs-utils';

/** Length of one degree on the OGC equatorial convention, in meters. */
const METERS_PER_DEGREE = (2 * Math.PI * 6378137) / 360;

test('service CRS utilities normalize OGC and ArcGIS identifiers', () => {
  expect(normalizeServiceCRS('urn:ogc:def:crs:EPSG::3857')).toBe('EPSG:3857');
  expect(normalizeServiceCRS('http://www.opengis.net/def/crs/EPSG/0/3857')).toBe('EPSG:3857');
  expect(normalizeServiceCRS('CRS:84')).toBe('CRS:84');
  expect(areServiceCRSEquivalent('EPSG:900913', 3857)).toBe(true);
  expect(selectServiceCRS('EPSG:3857', ['EPSG:4326', 'EPSG:900913'])).toBe('EPSG:900913');
  expect(getServiceCRSAxisOrder('EPSG:4326')).toBe('yx');
  expect(getServiceCRSAxisOrder('CRS:84')).toBe('xy');
});

describe('service CRS identifier semantics', () => {
  // Columns: input, normalized identifier, authority axis order, meters per CRS unit.
  test.each([
    // CRS84 spellings: WMS 1.3.0 code, OGC register URN and URI forms, and the math.gl form.
    ['CRS:84', 'CRS:84', 'xy', METERS_PER_DEGREE],
    ['crs:84', 'CRS:84', 'xy', METERS_PER_DEGREE],
    ['OGC:CRS84', 'CRS:84', 'xy', METERS_PER_DEGREE],
    ['urn:ogc:def:crs:OGC:1.3:CRS84', 'CRS:84', 'xy', METERS_PER_DEGREE],
    ['urn:ogc:def:crs:OGC::CRS84', 'CRS:84', 'xy', METERS_PER_DEGREE],
    ['http://www.opengis.net/def/crs/OGC/1.3/CRS84', 'CRS:84', 'xy', METERS_PER_DEGREE],
    ['https://www.opengis.net/def/crs/OGC/0/CRS84', 'CRS:84', 'xy', METERS_PER_DEGREE],
    ['https://www.opengis.net/def/crs/OGC/0/CRS84h', 'OGC:CRS84H', 'xy', METERS_PER_DEGREE],
    // EPSG:4326 in all unversioned forms has the EPSG latitude-first axis order.
    [4326, 'EPSG:4326', 'yx', METERS_PER_DEGREE],
    ['epsg:4326', 'EPSG:4326', 'yx', METERS_PER_DEGREE],
    ['urn:ogc:def:crs:EPSG::4326', 'EPSG:4326', 'yx', METERS_PER_DEGREE],
    ['urn:x-ogc:def:crs:EPSG:4326', 'EPSG:4326', 'yx', METERS_PER_DEGREE],
    ['urn:x-ogc:def:crs:EPSG::4326', 'EPSG:4326', 'yx', METERS_PER_DEGREE],
    ['http://www.opengis.net/def/crs/EPSG/0/4326', 'EPSG:4326', 'yx', METERS_PER_DEGREE],
    // Versioned EPSG identifiers stay distinct, but keep the axis order and unit of the code.
    [
      'urn:ogc:def:crs:EPSG:6.18:3:4326',
      'URN:OGC:DEF:CRS:EPSG:6.18:3:4326',
      'yx',
      METERS_PER_DEGREE
    ],
    ['urn:ogc:def:crs:EPSG:6.3:4326', 'URN:OGC:DEF:CRS:EPSG:6.3:4326', 'yx', METERS_PER_DEGREE],
    [
      'http://www.opengis.net/def/crs/EPSG/9.9/4326',
      'HTTP://WWW.OPENGIS.NET/DEF/CRS/EPSG/9.9/4326',
      'yx',
      METERS_PER_DEGREE
    ],
    // The legacy GML form is longitude first by convention.
    [
      'http://www.opengis.net/gml/srs/epsg.xml#4326',
      'HTTP://WWW.OPENGIS.NET/GML/SRS/EPSG.XML#4326',
      'xy',
      undefined
    ],
    // Other geographic and northing-first EPSG codes from the built-in table.
    ['EPSG:4258', 'EPSG:4258', 'yx', METERS_PER_DEGREE],
    ['http://www.opengis.net/def/crs/EPSG/0/4258', 'EPSG:4258', 'yx', METERS_PER_DEGREE],
    ['EPSG:4269', 'EPSG:4269', 'yx', METERS_PER_DEGREE],
    ['urn:ogc:def:crs:EPSG::3035', 'EPSG:3035', 'yx', undefined],
    ['EPSG:3006', 'EPSG:3006', 'yx', undefined],
    ['EPSG:31467', 'EPSG:31467', 'yx', undefined],
    // Easting-first projected CRSs.
    ['EPSG:3857', 'EPSG:3857', 'xy', 1],
    ['EPSG:25832', 'EPSG:25832', 'xy', undefined],
    ['EPSG:32618', 'EPSG:32618', 'xy', undefined],
    // Other authorities keep their own authority.
    ['urn:ogc:def:crs:IAU::30100', 'IAU:30100', 'xy', undefined],
    ['http://www.opengis.net/def/crs/IAU/0/30100', 'IAU:30100', 'xy', undefined],
    ['IAU:30100', 'IAU:30100', 'xy', undefined],
    ['urn:ogc:def:crs:IAU:2015:30100', 'URN:OGC:DEF:CRS:IAU:2015:30100', 'xy', undefined],
    ['urn:ogc:def:crs:ESRI::102100', 'ESRI:102100', 'xy', 1]
  ] as const)('%s', (input, identifier, axisOrder, metersPerUnit) => {
    expect(normalizeServiceCRS(input)).toBe(identifier);
    expect(getServiceCRSAxisOrder(input)).toBe(axisOrder);
    const unit = getServiceCRSMetersPerUnit(input);
    if (metersPerUnit === undefined) {
      expect(unit).toBeUndefined();
    } else {
      expect(unit).toBeCloseTo(metersPerUnit);
    }
  });

  test('non-EPSG authorities never become EPSG codes', () => {
    expect(areServiceCRSEquivalent('urn:ogc:def:crs:IAU::30100', 'EPSG:30100')).toBe(false);
    expect(areServiceCRSEquivalent('urn:ogc:def:crs:IAU::30100', 'IAU:30100')).toBe(true);
    expect(selectServiceCRS('IAU:30100', ['EPSG:30100', 'urn:ogc:def:crs:IAU::30100'])).toBe(
      'urn:ogc:def:crs:IAU::30100'
    );
  });

  test('CRS84 spellings are equivalent, and CRS84 is not EPSG:4326', () => {
    expect(areServiceCRSEquivalent('CRS:84', 'urn:ogc:def:crs:OGC:1.3:CRS84')).toBe(true);
    expect(
      areServiceCRSEquivalent('OGC:CRS84', 'http://www.opengis.net/def/crs/OGC/1.3/CRS84')
    ).toBe(true);
    expect(areServiceCRSEquivalent('CRS:84', 'EPSG:4326')).toBe(false);
  });

  test('versioned EPSG identifiers are not equal to the unversioned code', () => {
    expect(areServiceCRSEquivalent('urn:ogc:def:crs:EPSG:6.3:4326', 'EPSG:4326')).toBe(false);
  });

  test('ESRI Web Mercator codes stay equivalent to EPSG:3857', () => {
    expect(areServiceCRSEquivalent('urn:ogc:def:crs:ESRI::102100', 'EPSG:3857')).toBe(true);
    expect(areServiceCRSEquivalent(102100, 'EPSG:3857')).toBe(true);
  });

  test('the caller axis order wins over the built-in table', () => {
    expect(getServiceCRSAxisOrder('EPSG:4326', {axisOrder: 'xy'})).toBe('xy');
    expect(getServiceCRSAxisOrder('EPSG:25832', {axisOrder: 'yx'})).toBe('yx');
    expect(getServiceCRSAxisOrder('EPSG:4258', {})).toBe('yx');
  });
});
