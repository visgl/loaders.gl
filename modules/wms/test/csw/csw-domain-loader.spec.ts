// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Forked from https://github.com/chrelad/openlayers/blob/master/tests/Format/
// under OpenLayers license (only used for test cases)
// See README.md in `./data` directory for full license text copy.

import test from 'tape-promise/tape';
// import {validateLoader} from 'test/common/conformance';

import {CSWDomainLoader} from '@loaders.gl/wms';
import {parse} from '@loaders.gl/core';

// const CSW_REQUEST_2_0_2 =
// '<csw:GetDomain xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" service="CSW" version="2.0.2">' +
//   '<csw:PropertyName>type</csw:PropertyName>' +
// '</csw:GetDomain>';

const CSW_RESPONSE_2_0_2 =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<csw:GetDomainResponse xmlns:csw="http://www.opengis.net/cat/csw/2.0.2">' +
  '<csw:DomainValues type="csw:Record">' +
  '<csw:PropertyName>type</csw:PropertyName>' +
  '<csw:ListOfValues>' +
  '<csw:Value my_attr="my_value">dataset</csw:Value>' +
  '<csw:Value>service</csw:Value>' +
  '</csw:ListOfValues>' +
  '</csw:DomainValues>' +
  '</csw:GetDomainResponse>';
test('CSWGetDomainLoader', async (t) => {
  const domain = await parse(CSW_RESPONSE_2_0_2, CSWDomainLoader);
  t.comment(JSON.stringify(domain));

  const domainValues = domain.domainValues;
  // test getRecordsResponse object
  t.ok(domainValues, 'object contains domainValues property');

  // test DomainValues
  t.equal(domainValues.length, 1, 'object contains 1 object in domainValues');
  const domainValue = domainValues[0];
  t.equal(domainValue.type, 'csw:Record', 'check value for attribute type');
  t.equal(domainValue.propertyName, 'type', 'check value for element propertyName');
  t.ok(domainValue.values, 'object contains values property');

  // test ListOfValues
  t.equal(domainValue.values.length, 2, 'object contains 2 objects ' + 'in values');
  const value = domainValue.values[0];
  t.ok(value, 'object contains value property');
  t.equal(value.my_attr, 'my_value', 'check value for attribute my_attr');
  t.equal(value.value, 'dataset', 'check value for element Value');

  t.end();
});
