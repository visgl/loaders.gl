// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Forked from https://github.com/chrelad/openlayers/blob/master/tests/Format/WFSCapabilities/v1_0_0.html
// under OpenLayers license (only used for test cases)
// See README.md in `./data` directory for full license text copy.

import {expect, test} from 'vitest';
// import {validateLoader} from 'test/common/conformance';

// @ts-nocheck

import {_WFSCapabilitiesLoader as WFSCapabilitiesLoader} from '@loaders.gl/wms';
import {load} from '@loaders.gl/core';

const WFS_CAPABILITIES_RESPONSE_URL =
  '@loaders.gl/wms/test/data/wmts/get-capabilities-response.xml';

test('WFSCapabilitiesLoader#response.xml', async (t) => {
  const capabilities = await load(
    WFS_CAPABILITIES_RESPONSE_URL,
    WFSCapabilitiesLoader
  );

  expect(typeof capabilities, 'parsed').toBe('object');

  
});

// TODO - copied from WMTS

test.skip('WFSCapabilitiesLoader#response.xml#OWS', async () => {
  const capabilities = await load(
    WFS_CAPABILITIES_RESPONSE_URL,
    WFSCapabilitiesLoader
  );

  // ows:ServiceIdentification
  const serviceIdentification = capabilities.serviceIdentification;
  expect(
    serviceIdentification.title,
    'ows:ServiceIdentification title is correct'
  ).toBe('Web Map Tile Service');
  expect(
    serviceIdentification.serviceTypeVersion,
    'ows:ServiceIdentification serviceTypeVersion is correct'
  ).toBe('1.0.0');
  expect(
    serviceIdentification.serviceType,
    'ows:ServiceIdentification serviceType is correct'
  ).toBe('OGC WFS');

  // ows:ServiceProvider
  const serviceProvider = capabilities.serviceProvider;
  expect(serviceProvider.providerName, 'ows:ServiceProvider providerName is correct').toBe('MiraMon');
  expect(
    serviceProvider.providerSite,
    'ows:ServiceProvider providerSite is correct'
  ).toBe('http://www.creaf.uab.es/miramon');
  expect(
    serviceProvider.serviceContact.individualName,
    'ows:ServiceProvider individualName is correct'
  ).toBe('Joan Maso Pau');
  expect(
    serviceProvider.serviceContact.positionName,
    'ows:ServiceProvider positionName is correct'
  ).toBe('Senior Software Engineer');
  expect(
    serviceProvider.serviceContact.contactInfo.address.administrativeArea,
    'ows:ServiceProvider address administrativeArea is correct'
  ).toBe('Barcelona');
  expect(
    serviceProvider.serviceContact.contactInfo.address.city,
    'ows:ServiceProvider address city is correct'
  ).toBe('Bellaterra');
  expect(
    serviceProvider.serviceContact.contactInfo.address.country,
    'ows:ServiceProvider address country is correct'
  ).toBe('Spain');
  expect(
    serviceProvider.serviceContact.contactInfo.address.deliveryPoint,
    'ows:ServiceProvider address deliveryPoint is correct'
  ).toBe('Fac Ciencies UAB');
  expect(
    serviceProvider.serviceContact.contactInfo.address.electronicMailAddress,
    'ows:ServiceProvider address electronicMailAddress is correct'
  ).toBe('joan.maso@uab.es');
  expect(
    serviceProvider.serviceContact.contactInfo.address.postalCode,
    'ows:ServiceProvider address postalCode is correct'
  ).toBe('08193');
  expect(
    serviceProvider.serviceContact.contactInfo.phone.voice,
    'ows:ServiceProvider phone voice is correct'
  ).toBe('+34 93 581 1312');

  // ows:OperationsMetadata
  const operationsMetadata = capabilities.operationsMetadata;
  expect(
    operationsMetadata.GetCapabilities.dcp.http.get,
    'ows:OperationsMetadata GetCapabilities url is correct'
  ).toBe('http://www.miramon.uab.es/cgi-bin/MiraMon5_0.cgi?');
  expect(
    operationsMetadata.GetFeatureInfo.dcp.http.get,
    'ows:OperationsMetadata GetFeatureInfo url is correct'
  ).toBe('http://www.miramon.uab.es/cgi-bin/MiraMon5_0.cgi?');
  expect(
    operationsMetadata.GetTile.dcp.http.get,
    'ows:OperationsMetadata GetTile url is correct'
  ).toBe('http://www.miramon.uab.es/cgi-bin/MiraMon5_0.cgi?');
});

// eslint-disable-next-line max-statements
test.skip('WFSCapabilitiesLoader#response.xml#layers', async () => {
  const capabilities = await load(
    WFS_CAPABILITIES_RESPONSE_URL,
    WFSCapabilitiesLoader
  );

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
