// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// parse-wkt-crs was forked from https://github.com/DanielJDufour/wkt-crs under Creative Commons CC0 1.0 license.

import {expect, test} from 'vitest';
import {parseSync, encodeTextSync} from '@loaders.gl/core';
import {WKTCRSLoader, WKTCRSWriter} from '@loaders.gl/wkt';

const roundtrip = wkt => encodeTextSync(parseSync(wkt, WKTCRSLoader, {raw: true}), WKTCRSWriter);

const condense = wkt => wkt.trim().replace(/(?<=[,\[\]])[ \n]+/g, '');

test('parseWKTCRS#NAD27 / UTM zone 16N', () => {
  const wkt =
    'PROJCS["NAD27 / UTM zone 16N",GEOGCS["NAD27",DATUM["North_American_Datum_1927",SPHEROID["Clarke 1866",6378206.4,294.9786982139006,AUTHORITY["EPSG","7008"]],AUTHORITY["EPSG","6267"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4267"]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",-87],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["Easting",EAST],AXIS["Northing",NORTH],AUTHORITY["EPSG","26716"]]';
  const data = parseSync(wkt, WKTCRSLoader, {raw: false, debug: false});
  // console.log(JSON.stringify(data, undefined, 2));
  expect(data.length).toEqual(1);
  expect(Object.keys(data)).toEqual(['0', 'PROJCS']);
  expect(data.PROJCS.AUTHORITY).toEqual(['AUTHORITY', 'EPSG', '26716']);
  expect(data.PROJCS === data[0]).toEqual(true);
  expect(data.PROJCS[1] === 'NAD27 / UTM zone 16N').toEqual(true);
  expect(data.PROJCS.GEOGCS === data[0][2]).toEqual(true);
});

test('parseWKTCRS#wikipedia example', () => {
  const wkt = `GEODCRS["WGS 84",
  DATUM["World Geodetic System 1984",
    ELLIPSOID["WGS 84", 6378137, 298.257223563, LENGTHUNIT["metre", 1]]],
  CS[ellipsoidal, 2],
    AXIS["Latitude (lat)", north, ORDER[1]],
    AXIS["Longitude (lon)", east, ORDER[2]],
    ANGLEUNIT["degree", 0.0174532925199433]]`;
  const data = parseSync(wkt, WKTCRSLoader, {debug: false});
  expect(data.GEODCRS[1]).toEqual('WGS 84');
  expect(data.GEODCRS.DATUM.ELLIPSOID[3]).toEqual(298.257223563);
  expect(data.GEODCRS.CS[1]).toEqual('ellipsoidal');
  expect(data.GEODCRS.ANGLEUNIT[2]).toEqual(0.0174532925199433);
});

test.skip('parseWKTCRS#wikipedia raw', () => {
  const wkt = `GEODCRS["WGS 84",
  DATUM["World Geodetic System 1984",
    ELLIPSOID["WGS 84", 6378137, 298.257223563, LENGTHUNIT["metre", 1]]],
  CS[ellipsoidal, 2],
    AXIS["Latitude (lat)", north, ORDER[1]],
    AXIS["Longitude (lon)", east, ORDER[2]],
    ANGLEUNIT["degree", 0.0174532925199433]]`;
  const data = parseSync(wkt, WKTCRSLoader, {debug: false, raw: true});
  expect(data.GEODCRS[1]).toEqual('WGS 84');
  expect(data.GEODCRS.DATUM.ELLIPSOID[3]).toEqual('raw:298.257223563');
  expect(data.GEODCRS.CS[1]).toEqual('raw:ellipsoidal');
  expect(data.GEODCRS.ANGLEUNIT[2]).toEqual('raw:0.0174532925199433');
  expect(roundtrip(wkt)).toEqual(condense(wkt));
});

test('parseWKTCRS#wikipedia concat', () => {
  const wkt = `
    CONCAT_MT[
      PARAM_MT["Mercator_2SP",
        PARAMETER["semi_major",6370997.0],
        PARAMETER["semi_minor",6370997.0],
        PARAMETER["central_meridian",180.0],
        PARAMETER["false_easting",-500000.0],
        PARAMETER["false_northing",-1000000.0],
        PARAMETER["standard parallel 1",60.0]],
      PARAM_MT["Affine",
        PARAMETER["num_row",3],
        PARAMETER["num_col",3],
        PARAMETER["elt_0_1",1],
        PARAMETER["elt_0_2",2],
        PARAMETER["elt 1 2",3]]]
  `;
  const data = parseSync(wkt, WKTCRSLoader, {debug: false, raw: true});
  expect(data.CONCAT_MT.PARAM_MT).toEqual(undefined);
  expect(data.CONCAT_MT.MULTIPLE_PARAM_MT.length).toEqual(2);
});

test.skip('parseWKTCRS#wikipedia datum shift', () => {
  const wkt = `
  COORDINATEOPERATION["AGD84 to GDA94 Auslig 5m",
  SOURCECRS["…full CRS definition required here but omitted for brevity…"],
  TARGETCRS["…full CRS definition required here but omitted for brevity…"],
  METHOD["Geocentric translations", ID["EPSG", 1031]],
  PARAMETER["X-axis translation", -128.5, LENGTHUNIT["metre", 1]],
  PARAMETER["Y-axis translation",  -53.0, LENGTHUNIT["metre", 1]],
  PARAMETER["Z-axis translation",  153.4, LENGTHUNIT["metre", 1]],
  OPERATIONACCURACY[5],
  AREA["Australia onshore"],
  BBOX[-43.7, 112.85, -9.87, 153.68]]
  `;
  const data = parseSync(wkt, WKTCRSLoader, {debug: false, raw: true});
  // stringifying array ignores keys added on
  const str = JSON.stringify(data);
  expect(str).toEqual('[["COORDINATEOPERATION","AGD84 to GDA94 Auslig 5m",["SOURCECRS","…full CRS definition required here but omitted for brevity…"],["TARGETCRS","…full CRS definition required here but omitted for brevity…"],["METHOD","Geocentric translations",["ID","EPSG","raw:1031"]],["PARAMETER","X-axis translation","raw:-128.5",["LENGTHUNIT","metre","raw:1"]],["PARAMETER","Y-axis translation","raw:-53.0",["LENGTHUNIT","metre","raw:1"]],["PARAMETER","Z-axis translation","raw:153.4",["LENGTHUNIT","metre","raw:1"]],["OPERATIONACCURACY","raw:5"],["AREA","Australia onshore"],["BBOX","raw:-43.7","raw:112.85","raw:-9.87","raw:153.68"]]]');
  expect(roundtrip(wkt)).toEqual(condense(wkt));
});

test('parseWKTCRS#proj4js example', () => {
  const wkt =
    'PROJCS["NAD83 / Massachusetts Mainland",GEOGCS["NAD83",DATUM["North_American_Datum_1983",SPHEROID["GRS 1980",6378137,298.257222101,AUTHORITY["EPSG","7019"]],AUTHORITY["EPSG","6269"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4269"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Lambert_Conformal_Conic_2SP"],PARAMETER["standard_parallel_1",42.68333333333333],PARAMETER["standard_parallel_2",41.71666666666667],PARAMETER["latitude_of_origin",41],PARAMETER["central_meridian",-71.5],PARAMETER["false_easting",200000],PARAMETER["false_northing",750000],AUTHORITY["EPSG","26986"],AXIS["X",EAST],AXIS["Y",NORTH]]';
  const data = parseSync(wkt, WKTCRSLoader);
  expect(data.PROJCS[1]).toEqual('NAD83 / Massachusetts Mainland');
});

test('parseWKTCRS#parse attribute that ends in number (TOWGS84)', () => {
  const wkt =
    ' GEOGCS["SAD69",DATUM["South_American_Datum_1969",SPHEROID["GRS 1967 Modified",6378160,298.25,AUTHORITY["EPSG","7050"]],TOWGS84[-57,1,-41,0,0,0,0],AUTHORITY["EPSG","6618"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4618"]]';
  expect(roundtrip(wkt)).toEqual(condense(wkt));
});

test.skip('parseWKTCRS#another parse bug', () => {
  const wkt =
    'PROJCS["ETRS89 / TM35FIN(E,N)",GEOGCS["ETRS89",DATUM["European_Terrestrial_Reference_System_1989",SPHEROID["GRS 1980",6378137,298.257222101,AUTHORITY["EPSG","7019"]],TOWGS84[0,0,0,0,0,0,0],AUTHORITY["EPSG","6258"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4258"]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",27],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["Easting",EAST],AXIS["Northing",NORTH],AUTHORITY["EPSG","3067"]]';
  const data = parseSync(wkt, WKTCRSLoader, {debug: false});
  expect(data.PROJCS[1]).toEqual('ETRS89 / TM35FIN(E,N)');
  expect(data.PROJCS.MULTIPLE_AXIS[1][2]).toEqual('NORTH');
  expect(roundtrip(wkt)).toEqual(wkt);
});

// Not clear where to find crs.json
// test.skip('parseWKTCRS#try to parse everything in crs.json', () => {
//   let data = require('./crs.json');
//   data = data.map(({wkt, esriwkt, prettywkt}) => ({
//     raw: {
//       wkt: parseSync(wkt, WKTCRSLoader, {raw: true}),
//       esriwkt: parseSync(esriwkt, WKTCRSLoader, {raw: true}),
//       prettywkt: parseSync(prettywkt, WKTCRSLoader, {raw: true})
//     },
//     dynamic: {
//       wkt: parseSync(wkt, WKTCRSLoader, {raw: false}),
//       esriwkt: parseSync(esriwkt, WKTCRSLoader, {raw: false}),
//       prettywkt: parseSync(prettywkt, WKTCRSLoader, {raw: false})
//     }
//   }));

//   // prettywkt and wkt should be equivalent
//   // only difference was white space
//   data.every(({raw, dynamic}) => {
//     t.deepEqual(raw.wkt, raw.prettywkt);
//     t.deepEqual(dynamic.wkt, dynamic.prettywkt);
//   });
// });

// test("7.5.6.3 Axis unit for ordinal coordinate systems", () => {
//   const wkt =  `NULL[CS[ordinal,2],
//   AXIS["inline (I)",southeast,ORDER[1]],
//   AXIS["crossline (J)",northeast,ORDER[2]]]`;
//   const data = parseSync(wkt, WKTCRSLoader, { debug: true });
//   t.deepEqual(data.CS[0], "ordinal");
//  t.end();
// });

test.skip('parseWKTCRS#sort parameters', () => {
  const wkt =
    'PROJCS["WGS_1984_Antarctic_Polar_Stereographic",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Stereographic_South_Pole"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",0.0],PARAMETER["Standard_Parallel_1",-71.0],UNIT["Meter",1.0]]';
  const data = parseSync(wkt, WKTCRSLoader, {debug: false, raw: true, sort: true});
  expect(encodeTextSync(data, WKTCRSWriter)).toEqual('PROJCS["WGS_1984_Antarctic_Polar_Stereographic",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Stereographic_South_Pole"],PARAMETER["Central_Meridian",0.0],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Standard_Parallel_1",-71.0],UNIT["Meter",1.0]]');
});

// test("sort example", () => {
//   const data = ["EXAMPLE", ["AXIS", "Northing", "raw:NORTH"], ["AXIS", "Easting", "raw:EAST"]];
//   wktcrs.sort(data);
//   t.deepEqual(data, ["EXAMPLE", ["AXIS", "Easting", "raw:EAST"], ["AXIS", "Northing", "raw:NORTH"]]);
//   t.end();
// });

test.skip('parseWKTCRS#sort params', () => {
  const wkt =
    'PARAMETERS[PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",-87],PARAMETER["scale_factor",0.9996]]';
  let data = parseSync(wkt, WKTCRSLoader, {debug: false, raw: true});
  expect(data[0].MULTIPLE_PARAMETER).toEqual([
    ['PARAMETER', 'latitude_of_origin', 'raw:0'],
    ['PARAMETER', 'central_meridian', 'raw:-87'],
    ['PARAMETER', 'scale_factor', 'raw:0.9996']
  ]);
  data = parseSync(wkt, WKTCRSLoader, {debug: false, raw: true, sort: true});
  expect(data[0].MULTIPLE_PARAMETER).toEqual([
    ['PARAMETER', 'central_meridian', 'raw:-87'],
    ['PARAMETER', 'latitude_of_origin', 'raw:0'],
    ['PARAMETER', 'scale_factor', 'raw:0.9996']
  ]);
  expect(encodeTextSync(data, WKTCRSWriter)).toEqual('PARAMETERS[PARAMETER["central_meridian",-87],PARAMETER["latitude_of_origin",0],PARAMETER["scale_factor",0.9996]]');
});

test('parseWKTCRS#parse inner parens', () => {
  const wkt =
    'GEOGCS["GRS 1980(IUGG, 1980)",DATUM["unknown",SPHEROID["GRS80",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433],AUTHORITY["epsg","7686"]]';
  const data = parseSync(wkt, WKTCRSLoader, {debug: false, raw: true});
  expect(data.GEOGCS[0]).toEqual('GEOGCS');
});

test.skip('WKTCRSWriter#authority', () => {
  const authority = ['AUTHORITY', 'EPSG', '9122'];
  const unparsed = encodeTextSync(authority, WKTCRSWriter);
  expect(unparsed).toEqual({data: 'AUTHORITY["EPSG","9122"]'});
});

test.skip('WKTCRSWriter#PRIMEM', () => {
  const authority = ['PRIMEM', 'Greenwich', 0, ['AUTHORITY', 'EPSG', '8901']];
  const unparsed = encodeTextSync(authority, WKTCRSWriter);
  expect(unparsed).toEqual({data: 'PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]]'});
});

test.skip('WKTCRSWriter#DATUM', () => {
  const datum = [
    'DATUM',
    'North_American_Datum_1927',
    ['SPHEROID', 'Clarke 1866', 6378206.4, 294.9786982139006, ['AUTHORITY', 'EPSG', '7008']],
    ['AUTHORITY', 'EPSG', '6267']
  ];
  const unparsed = encodeTextSync(datum, WKTCRSWriter);
  expect(unparsed).toEqual({
    data: 'DATUM["North_American_Datum_1927",SPHEROID["Clarke 1866",6378206.4,294.9786982139006,AUTHORITY["EPSG","7008"]],AUTHORITY["EPSG","6267"]]'
  });
});

test.skip('WKTCRSWriter#GEOGCS', () => {
  const data = [
    'GEOGCS',
    'NAD27',
    [
      'DATUM',
      'North_American_Datum_1927',
      ['SPHEROID', 'Clarke 1866', 6378206.4, 294.9786982139006, ['AUTHORITY', 'EPSG', '7008']],
      ['AUTHORITY', 'EPSG', '6267']
    ],
    ['PRIMEM', 'Greenwich', 0, ['AUTHORITY', 'EPSG', '8901']],
    ['UNIT', 'degree', 0.0174532925199433, ['AUTHORITY', 'EPSG', '9122']],
    ['AUTHORITY', 'EPSG', '4267']
  ];
  const unparsed = encodeTextSync(data, WKTCRSWriter);
  expect(unparsed).toEqual({
    data: 'GEOGCS["NAD27",DATUM["North_American_Datum_1927",SPHEROID["Clarke 1866",6378206.4,294.9786982139006,AUTHORITY["EPSG","7008"]],AUTHORITY["EPSG","6267"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4267"]]'
  });
});
