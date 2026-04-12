// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Forked from https://github.com/chrelad/openlayers/blob/master/tests/Format/
// under OpenLayers license (only used for test cases)
// See README.md in `./data` directory for full license text copy.

import {expect, test} from 'vitest';
// import {validateLoader} from 'test/common/conformance';

import {CSWRecordsLoader} from '@loaders.gl/wms';
import {parse} from '@loaders.gl/core';

// const CSW_REQUEST_2_0_2 =
// '<csw:GetRecords xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" service="CSW" version="2.0.2" resultType="results" startPosition="10" maxRecords="20">' +
//   '<csw:Query typeNames="csw:Record">' +
//     '<csw:ElementSetName>brief</csw:ElementSetName>' +
//     '<csw:Constraint version="1.1.0">' +
//       '<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' +
//         '<ogc:PropertyIsLike wildCard="*" singleChar="." escapeChar="!">' +
//           '<ogc:PropertyName>my_prop</ogc:PropertyName>' +
//           '<ogc:Literal>my_prop_value</ogc:Literal>' +
//         '</ogc:PropertyIsLike>' +
//       '</ogc:Filter>' +
//     '</csw:Constraint>' +
//   '</csw:Query>' +
// '</csw:GetRecords>';

const CSW_RESPONSE_2_0_2 =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<csw:GetRecordsResponse xmlns:csw="http://www.opengis.net/cat/csw/2.0.2">' +
  '<csw:SearchStatus timestamp="2009-06-08T12:03:34" />' +
  '<csw:SearchResults numberOfRecordsMatched="10" numberOfRecordsReturned="2" elementSet="brief" nextRecord="3">' +
  '<csw:BriefRecord xmlns:geonet="http://www.fao.org/geonetwork" xmlns:ows="http://www.opengis.net/ows" xmlns:dc="http://purl.org/dc/elements/1.1/">' +
  '<dc:identifier>895ac38b-7aef-4a21-b593-b35a6fc7bba9</dc:identifier>' +
  '<dc:title>Sample title</dc:title>' +
  '<ows:BoundingBox crs="::Lambert Azimuthal Projection">' +
  '<ows:LowerCorner>156 -3</ows:LowerCorner>' +
  '<ows:UpperCorner>37 83</ows:UpperCorner>' +
  '</ows:BoundingBox>' +
  '<ows:BoundingBox crs="::WGS 1984">' +
  '<ows:LowerCorner>51.1 -34.6</ows:LowerCorner>' +
  '<ows:UpperCorner>-17.3 38.2</ows:UpperCorner>' +
  '</ows:BoundingBox>' +
  '</csw:BriefRecord>' +
  '<csw:BriefRecord xmlns:geonet="http://www.fao.org/geonetwork" xmlns:ows="http://www.opengis.net/ows" xmlns:dc="http://purl.org/dc/elements/1.1/">' +
  '<dc:identifier>8a7245c3-8546-42de-8e6f-8fb8b5fd1bc3</dc:identifier>' +
  '<dc:title>Second record : sample title</dc:title>' +
  '<ows:BoundingBox crs="::WGS 1984">' +
  '<ows:LowerCorner>51.1 -34.6</ows:LowerCorner>' +
  '<ows:UpperCorner>-17.3 38.2</ows:UpperCorner>' +
  '</ows:BoundingBox>' +
  '</csw:BriefRecord>' +
  '</csw:SearchResults>' +
  '</csw:GetRecordsResponse>';
test('CSWGetRecordsLoader', async () => {
  const cswRecords = await parse(CSW_RESPONSE_2_0_2, CSWRecordsLoader);
  // t.comment(JSON.stringify(cswRecords));

  const searchStatus = cswRecords.searchStatus;
  const searchResults = cswRecords.searchResults;
  const records = cswRecords.records;

  // test getRecordsResponse object
  expect(searchStatus, 'object contains SearchStatus property').toBeTruthy();
  expect(searchResults, 'object contains SearchResults property').toBeTruthy();
  expect(records, 'object contains records property').toBeTruthy();

  // test SearchResults attributes
  expect(
    searchResults.numberOfRecordsMatched,
    'check value for SearchResults.numberOfRecordsMatched'
  ).toBe(10);
  expect(
    searchResults.numberOfRecordsReturned,
    'check value for SearchResults.numberOfRecordsReturned'
  ).toBe(2);
  expect(searchResults.elementSet, 'check value for SearchResults.elementSet').toBe('brief');
  expect(searchResults.nextRecord, 'check value for SearchResults.nextRecord').toBe(3);

  // test records
  expect(records.length, 'object contains 10 records').toBe(2);
  const testRecord = records[0];
  // expect(testRecord.type, "check value for record.type").toBe("BriefRecord");
  expect(testRecord.title, 'check value for record.title').toBe('Sample title');

  // test bbox  TODO
  // expect(testRecord.boundingBoxes.length, "object contains 2 BoundingBoxes").toBe(2);
  // const bbox = testRecord.boundingBoxes[0];
  // expect(bbox, "object contains BoundingBox properties").toBeTruthy();
  // expect(bbox.crs, "check value for BoundingBox.crs").toBe("::Lambert Azimuthal Projection");
  // expect(bbox.value, -3, 37, 83], "check value for record.BoundingBox").toBe([156);
});
