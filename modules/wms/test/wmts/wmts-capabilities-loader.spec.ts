// loaders.gl, MIT license

// @ts-nocheck

// Forked from https://github.com/chrelad/openlayers/blob/master/tests/Format/WMTSCapabilities/v1_0_0.html
// under OpenLayers license (only used for test cases)
// See README.md in `./data` directory for full license text copy.

import test from 'tape-promise/tape';
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

  t.equal(typeof capabilities, 'object', 'parsed');

  t.end();
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
  t.equal(serviceProvider.providerName, 'MiraMon', 'ows:ServiceProvider providerName is correct');
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

  t.end();
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
  t.equal(numOfLayers, 1, 'correct count of layers');

  const layer = contents.layers[0];
  t.equal(layer.abstract, 'Coastline/shorelines (BA010)', 'layer abstract is correct');
  t.equal(layer.identifier, 'coastlines', 'layer identifier is correct');
  t.equal(layer.title, 'Coastlines', 'layer title is correct');

  const numOfFormats = layer.formats.length;
  t.equal(numOfFormats, 2, 'correct count of formats');
  t.equal(layer.formats[0], 'image/png', 'format image/png is correct');
  t.equal(layer.formats[1], 'image/gif', 'format image/gif is correct');

  const numOfStyles = layer.styles.length;
  t.equal(numOfStyles, 2, 'correct count of styles');
  t.equal(layer.styles[0].identifier, 'DarkBlue', 'style 0 identifier is correct');
  t.equal(layer.styles[0].isDefault, 'true', 'style 0 isDefault is correct');
  t.equal(layer.styles[0].title, 'Dark Blue', 'style 0 title is correct');
  t.equal(layer.styles[1].identifier, 'thickAndRed', 'style 1 identifier is correct');
  t.ok(!layer.styles[1].isDefault, 'style 1 isDefault is correct');
  t.equal(layer.styles[1].title, 'Thick And Red', 'style 1 title is correct');
  // t.equal(layer.styles[1].abstract, "Specify this style if you want your maps to have thick red coastlines. ", "style 1 abstract is correct");

  t.equal(layer.tileMatrixSetLinks.length, 1, 'correct count of tileMatrixSetLinks');
  t.equal(layer.tileMatrixSetLinks[0].tileMatrixSet, 'BigWorld', 'tileMatrixSet is correct');

  const wgs84Bbox = layer.bounds;
  t.equal(wgs84Bbox.left, -180.0, 'wgs84BoundingBox left is correct');
  t.equal(wgs84Bbox.right, 180.0, 'wgs84BoundingBox right is correct');
  t.equal(wgs84Bbox.bottom, -90.0, 'wgs84BoundingBox bottom is correct');
  t.equal(wgs84Bbox.top, 90.0, 'wgs84BoundingBox top is correct');

  t.end();
});

// eslint-disable-next-line max-statements
test.skip('WMTSCapabilitiesLoader#response.xml#test_tileMatrixSets', async (t) => {
  const capabilities = (await load(
    WMTS_CAPABILITIES_RESPONSE_URL,
    WMTSCapabilitiesLoader
  )) as WMTSCapabilities;

  const tileMatrixSets = capabilities.contents.tileMatrixSets;
  t.ok(tileMatrixSets.BigWorld, 'tileMatrixSets \'BigWorld\' found');
  const bigWorld = tileMatrixSets.BigWorld;
  t.equal(bigWorld.identifier, 'BigWorld', 'tileMatrixSets identifier is correct');
  t.equal(bigWorld.matrixIds.length, 2, 'tileMatrix count is correct');
  t.equal(bigWorld.matrixIds[0].identifier, '1e6', 'tileMatrix 0 identifier is correct');
  t.equal(bigWorld.matrixIds[0].matrixHeight, 50000, 'tileMatrix 0 matrixHeight is correct');
  t.equal(bigWorld.matrixIds[0].matrixWidth, 60000, 'tileMatrix 0 matrixWidth is correct');
  t.equal(
    bigWorld.matrixIds[0].scaleDenominator,
    1000000,
    'tileMatrix 0 scaleDenominator is correct'
  );
  t.equal(bigWorld.matrixIds[0].tileWidth, 256, 'tileMatrix 0 tileWidth is correct');
  t.equal(bigWorld.matrixIds[0].tileHeight, 256, 'tileMatrix 0 tileHeight is correct');
  t.equal(
    bigWorld.matrixIds[0].topLeftCorner.lon,
    -180,
    'tileMatrix 0 topLeftCorner.lon is correct'
  );
  t.equal(bigWorld.matrixIds[0].topLeftCorner.lat, 84, 'tileMatrix 0 topLeftCorner.lat is correct');

  t.equal(bigWorld.matrixIds[1].identifier, '2.5e6', 'tileMatrix 1 identifier is correct');
  t.equal(bigWorld.matrixIds[1].matrixHeight, 7000, 'tileMatrix 1 matrixHeight is correct');
  t.equal(bigWorld.matrixIds[1].matrixWidth, 9000, 'tileMatrix 1 matrixWidth is correct');
  t.equal(
    bigWorld.matrixIds[1].scaleDenominator,
    2500000,
    'tileMatrix 1 scaleDenominator is correct'
  );
  t.equal(bigWorld.matrixIds[1].tileWidth, 256, 'tileMatrix 1 tileWidth is correct');
  t.equal(bigWorld.matrixIds[1].tileHeight, 256, 'tileMatrix 1 tileHeight is correct');
  t.equal(
    bigWorld.matrixIds[1].topLeftCorner.lon,
    -180,
    'tileMatrix 1 topLeftCorner.lon is correct'
  );
  t.equal(bigWorld.matrixIds[1].topLeftCorner.lat, 84, 'tileMatrix 1 topLeftCorner.lat is correct');

  t.end();
});
