// loaders.gl, MIT license

// Forked from https://github.com/chrelad/openlayers/blob/master/tests/Format/WFSCapabilities/v1_0_0.html
// under OpenLayers license (only used for test cases)
// See README.md in `./data` directory for full license text copy.

import test from 'tape-promise/tape';
// import {validateLoader} from 'test/common/conformance';

// @ts-nocheck

import {WFSCapabilitiesLoader, WFSCapabilities} from '@loaders.gl/wms';
import {load} from '@loaders.gl/core';

const WFS_CAPABILITIES_RESPONSE_URL =
  '@loaders.gl/wms/test/data/wmts/get-capabilities-response.xml';

test('WFSCapabilitiesLoader#response.xml', async (t) => {
  const capabilities = (await load(
    WFS_CAPABILITIES_RESPONSE_URL,
    WFSCapabilitiesLoader
  )) as WFSCapabilities;

  t.equal(typeof capabilities, 'object', 'parsed');

  t.end();
});

// TODO - copied from WMTS

test.skip('WFSCapabilitiesLoader#response.xml#OWS', async (t) => {
  const capabilities = (await load(
    WFS_CAPABILITIES_RESPONSE_URL,
    WFSCapabilitiesLoader
  )) as WFSCapabilities;

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
    'OGC WFS',
    'ows:ServiceIdentification serviceType is correct'
  );

  // ows:ServiceProvider
  const serviceProvider = capabilities.serviceProvider;
  t.equal(serviceProvider.providerName, 'MiraMon', 'ows:ServiceProvider providerName is correct');
  t.equal(
    serviceProvider.providerSite,
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
  t.equal(
    serviceProvider.serviceContact.contactInfo.address.postalCode,
    '08193',
    'ows:ServiceProvider address postalCode is correct'
  );
  t.equal(
    serviceProvider.serviceContact.contactInfo.phone.voice,
    '+34 93 581 1312',
    'ows:ServiceProvider phone voice is correct'
  );

  // ows:OperationsMetadata
  const operationsMetadata = capabilities.operationsMetadata;
  t.equal(
    operationsMetadata.GetCapabilities.dcp.http.get,
    'http://www.miramon.uab.es/cgi-bin/MiraMon5_0.cgi?',
    'ows:OperationsMetadata GetCapabilities url is correct'
  );
  t.equal(
    operationsMetadata.GetFeatureInfo.dcp.http.get,
    'http://www.miramon.uab.es/cgi-bin/MiraMon5_0.cgi?',
    'ows:OperationsMetadata GetFeatureInfo url is correct'
  );
  t.equal(
    operationsMetadata.GetTile.dcp.http.get,
    'http://www.miramon.uab.es/cgi-bin/MiraMon5_0.cgi?',
    'ows:OperationsMetadata GetTile url is correct'
  );

  t.end();
});

// eslint-disable-next-line max-statements
test.skip('WFSCapabilitiesLoader#response.xml#layers', async (t) => {
  const capabilities = (await load(
    WFS_CAPABILITIES_RESPONSE_URL,
    WFSCapabilitiesLoader
  )) as WFSCapabilities;

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

