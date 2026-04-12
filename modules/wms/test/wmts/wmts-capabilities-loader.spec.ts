// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// @ts-nocheck

// Forked from https://github.com/chrelad/openlayers/blob/master/tests/Format/WMTSCapabilities/v1_0_0.html
// under OpenLayers license (only used for test cases)
// See README.md in `./data` directory for full license text copy.
/*

import {expect, test} from 'vitest';
// import {validateLoader} from 'test/common/conformance';

import {_WMTSCapabilitiesLoader as WMTSCapabilitiesLoader, _WMTSCapabilities as WMTSCapabilities} from '@loaders.gl/wms';
import {load} from '@loaders.gl/core';

const WMTS_CAPABILITIES_RESPONSE_URL =
  '@loaders.gl/wms/test/data/wmts/get-capabilities-response.xml';

test('WMTSCapabilitiesLoader#response.xml', async (t) => {
  const capabilities = (await load(
    WMTS_CAPABILITIES_RESPONSE_URL,
    WMTSCapabilitiesLoader
  )) as WMTSCapabilities;

  expect(typeof capabilities, 'parsed').toBe('object');

  
});

test.skip('WMTSCapabilitiesLoader#response.xml#OWS', async (t) => {
  const capabilities = (await load(
    WMTS_CAPABILITIES_RESPONSE_URL,
    WMTSCapabilitiesLoader
  )) as WMTSCapabilities;

  // ows:ServiceIdentification
  const serviceIdentification = capabilities.serviceIdentification;
  t.equal(
    serviceIdentification.title,
    'Web Map Tile Service',
    'ows:ServiceIdentification title is correct'
  );
  t.equal(
    serviceIdentification.serviceTypeVersion,
    '1.0.0',
    'ows:ServiceIdentification serviceTypeVersion is correct'
  );
  t.equal(
    serviceIdentification.serviceType,
    'OGC WMTS',
    'ows:ServiceIdentification serviceType is correct'
  );

  // ows:ServiceProvider
  const serviceProvider = capabilities.serviceProvider;
  expect(serviceProvider.providerName, 'ows:ServiceProvider providerName is correct').toBe('MiraMon');
  t.equal(
    serviceProvider.providerSite.href,
    'http://www.creaf.uab.es/miramon',
    'ows:ServiceProvider providerSite is correct'
  );
  t.equal(
    serviceProvider.serviceContact.individualName,
    'Joan Maso Pau',
    'ows:ServiceProvider individualName is correct'
  );
  t.equal(
    serviceProvider.serviceContact.positionName,
    'Senior Software Engineer',
    'ows:ServiceProvider positionName is correct'
  );
  t.equal(
    serviceProvider.serviceContact.contactInfo.address.administrativeArea,
    'Barcelona',
    'ows:ServiceProvider address administrativeArea is correct'
  );
  t.equal(
    serviceProvider.serviceContact.contactInfo.address.city,
    'Bellaterra',
    'ows:ServiceProvider address city is correct'
  );
  t.equal(
    serviceProvider.serviceContact.contactInfo.address.country,
    'Spain',
    'ows:ServiceProvider address country is correct'
  );
  t.equal(
    serviceProvider.serviceContact.contactInfo.address.deliveryPoint,
    'Fac Ciencies UAB',
    'ows:ServiceProvider address deliveryPoint is correct'
  );
  t.equal(
    serviceProvider.serviceContact.contactInfo.address.electronicMailAddress,
    'joan.maso@uab.es',
    'ows:ServiceProvider address electronicMailAddress is correct'
  );
  // t.equal(
  //   serviceProvider.serviceContact.contactInfo.address.postalCode,
  //   '08193',
  //   'ows:ServiceProvider address postalCode is correct'
  // );
  t.equal(
    serviceProvider.serviceContact.contactInfo.phone.voice,
    '+34 93 581 1312',
    'ows:ServiceProvider phone voice is correct'
  );

  // ows:OperationsMetadata
  // const operationsMetadata = capabilities.operationsMetadata;
  // t.equal(
  //   operationsMetadata.GetCapabilities.dcp.http.get,
  //   'http://www.miramon.uab.es/cgi-bin/MiraMon5_0.cgi?',
  //   'ows:OperationsMetadata GetCapabilities url is correct'
  // );
  // t.equal(
  //   operationsMetadata.GetFeatureInfo.dcp.http.get,
  //   'http://www.miramon.uab.es/cgi-bin/MiraMon5_0.cgi?',
  //   'ows:OperationsMetadata GetFeatureInfo url is correct'
  // );
  // t.equal(
  //   operationsMetadata.GetTile.dcp.http.get,
  //   'http://www.miramon.uab.es/cgi-bin/MiraMon5_0.cgi?',
  //   'ows:OperationsMetadata GetTile url is correct'
  // );

  
});

// eslint-disable-next-line max-statements
test.skip('WMTSCapabilitiesLoader#response.xml#layers', async (t) => {
  const capabilities = (await load(
    WMTS_CAPABILITIES_RESPONSE_URL,
    WMTSCapabilitiesLoader
  )) as WMTSCapabilities;

  // var xml = document.getElementById("ogcsample").firstChild.nodeValue;
  // var doc = new OpenLayers.Format.XML().read(xml);

  // var obj = new OpenLayers.Format.WMTSCapabilities().read(doc);
  const contents = capabilities.contents;

  const numOfLayers = contents.layers.length;
  expect(numOfLayers, 'correct count of layers').toBe(1);

  const layer = contents.layers[0];
  expect(layer.abstract, 'layer abstract is correct').toBe('Coastline/shorelines (BA010)');
  expect(layer.identifier, 'layer identifier is correct').toBe('coastlines');
  expect(layer.title, 'layer title is correct').toBe('Coastlines');

  const numOfFormats = layer.formats.length;
  expect(numOfFormats, 'correct count of formats').toBe(2);
  expect(layer.formats[0], 'format image/png is correct').toBe('image/png');
  expect(layer.formats[1], 'format image/gif is correct').toBe('image/gif');

  const numOfStyles = layer.styles.length;
  expect(numOfStyles, 'correct count of styles').toBe(2);
  expect(layer.styles[0].identifier, 'style 0 identifier is correct').toBe('DarkBlue');
  expect(layer.styles[0].isDefault, 'style 0 isDefault is correct').toBe('true');
  expect(layer.styles[0].title, 'style 0 title is correct').toBe('Dark Blue');
  expect(layer.styles[1].identifier, 'style 1 identifier is correct').toBe('thickAndRed');
  expect(!layer.styles[1].isDefault, 'style 1 isDefault is correct').toBeTruthy();
  expect(layer.styles[1].title, 'style 1 title is correct').toBe('Thick And Red');
  // expect(layer.styles[1].abstract, "style 1 abstract is correct").toBe("Specify this style if you want your maps to have thick red coastlines. ");

  expect(layer.tileMatrixSetLinks.length, 'correct count of tileMatrixSetLinks').toBe(1);
  expect(layer.tileMatrixSetLinks[0].tileMatrixSet, 'tileMatrixSet is correct').toBe('BigWorld');

  const wgs84Bbox = layer.bounds;
  expect(wgs84Bbox.left, 'wgs84BoundingBox left is correct').toBe(-180.0);
  expect(wgs84Bbox.right, 'wgs84BoundingBox right is correct').toBe(180.0);
  expect(wgs84Bbox.bottom, 'wgs84BoundingBox bottom is correct').toBe(-90.0);
  expect(wgs84Bbox.top, 'wgs84BoundingBox top is correct').toBe(90.0);

  
});

// eslint-disable-next-line max-statements
test.skip('WMTSCapabilitiesLoader#response.xml#test_tileMatrixSets', async (t) => {
  const capabilities = (await load(
    WMTS_CAPABILITIES_RESPONSE_URL,
    WMTSCapabilitiesLoader
  )) as WMTSCapabilities;

  const tileMatrixSets = capabilities.contents.tileMatrixSets;
  expect(tileMatrixSets.BigWorld, 'tileMatrixSets \'BigWorld\' found').toBeTruthy();
  const bigWorld = tileMatrixSets.BigWorld;
  expect(bigWorld.identifier, 'tileMatrixSets identifier is correct').toBe('BigWorld');
  expect(bigWorld.matrixIds.length, 'tileMatrix count is correct').toBe(2);
  expect(bigWorld.matrixIds[0].identifier, 'tileMatrix 0 identifier is correct').toBe('1e6');
  expect(bigWorld.matrixIds[0].matrixHeight, 'tileMatrix 0 matrixHeight is correct').toBe(50000);
  expect(bigWorld.matrixIds[0].matrixWidth, 'tileMatrix 0 matrixWidth is correct').toBe(60000);
  t.equal(
    bigWorld.matrixIds[0].scaleDenominator,
    1000000,
    'tileMatrix 0 scaleDenominator is correct'
  );
  expect(bigWorld.matrixIds[0].tileWidth, 'tileMatrix 0 tileWidth is correct').toBe(256);
  expect(bigWorld.matrixIds[0].tileHeight, 'tileMatrix 0 tileHeight is correct').toBe(256);
  t.equal(
    bigWorld.matrixIds[0].topLeftCorner.lon,
    -180,
    'tileMatrix 0 topLeftCorner.lon is correct'
  );
  expect(bigWorld.matrixIds[0].topLeftCorner.lat, 'tileMatrix 0 topLeftCorner.lat is correct').toBe(84);

  expect(bigWorld.matrixIds[1].identifier, 'tileMatrix 1 identifier is correct').toBe('2.5e6');
  expect(bigWorld.matrixIds[1].matrixHeight, 'tileMatrix 1 matrixHeight is correct').toBe(7000);
  expect(bigWorld.matrixIds[1].matrixWidth, 'tileMatrix 1 matrixWidth is correct').toBe(9000);
  t.equal(
    bigWorld.matrixIds[1].scaleDenominator,
    2500000,
    'tileMatrix 1 scaleDenominator is correct'
  );
  expect(bigWorld.matrixIds[1].tileWidth, 'tileMatrix 1 tileWidth is correct').toBe(256);
  expect(bigWorld.matrixIds[1].tileHeight, 'tileMatrix 1 tileHeight is correct').toBe(256);
  t.equal(
    bigWorld.matrixIds[1].topLeftCorner.lon,
    -180,
    'tileMatrix 1 topLeftCorner.lon is correct'
  );
  expect(bigWorld.matrixIds[1].topLeftCorner.lat, 'tileMatrix 1 topLeftCorner.lat is correct').toBe(84);

  
});
*/
