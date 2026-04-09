// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
// import {validateLoader} from 'test/common/conformance';

import {XMLLoader} from '@loaders.gl/xml';
import {load} from '@loaders.gl/core';

const FORECASTS_URL = '@loaders.gl/xml/test/data/forecasts.xml';

test('XMLLoader#forecasts.xml', async t => {
  const json = await load(FORECASTS_URL, XMLLoader);

  t.ok(json, 'got result');
  t.equal(typeof json, 'object', 'parsed');
  t.equal(json.WMT_MS_Capabilities.Capability.Layer.Layer[2].Name, 'world_rivers', 'contents');

  t.end();
});

test('XMLLoader#internal parser#forecasts.xml', async t => {
  const json = await load(FORECASTS_URL, XMLLoader, {xml: {_parser: 'internal'}});

  t.ok(json, 'got result');
  t.equal(typeof json, 'object', 'parsed');
  t.equal(json.WMT_MS_Capabilities.Capability.Layer.Layer[2].Name, 'world_rivers', 'contents');

  t.end();
});

test('XMLLoader#internal parser#parity', t => {
  const testCases = [
    {
      title: 'text-only node',
      xml: '<root><name>loaders.gl</name></root>'
    },
    {
      title: 'attributes',
      xml: '<root id="root-id"><child id="child-id">text</child></root>'
    },
    {
      title: 'repeated elements become arrays',
      xml: '<root><item>first</item><item>second</item></root>'
    },
    {
      title: 'single element can be forced to array',
      xml: '<root><item>first</item></root>',
      options: {arrayPaths: ['root.item']}
    },
    {
      title: 'self-closing element',
      xml: '<root><empty/></root>'
    },
    {
      title: 'mixed text and child element',
      xml: '<root><mixed>Hello <b>bold</b> tail</mixed></root>'
    },
    {
      title: 'CDATA is text',
      xml: '<root><text><![CDATA[escaped <xml> text]]></text></root>'
    },
    {
      title: 'XML entities are decoded',
      xml: '<root><text>Tom &amp; Jerry &lt;3</text></root>'
    },
    {
      title: 'processing instruction is ignored',
      xml: '<?xml version="1.0" encoding="UTF-8"?><root><text>ok</text></root>'
    },
    {
      title: 'namespace prefix can be preserved',
      xml: '<root><gml:Point srsName="EPSG:4326"><gml:pos>1 2</gml:pos></gml:Point></root>'
    },
    {
      title: 'namespace prefix can be removed',
      xml: '<root xmlns:gml="http://www.opengis.net/gml"><gml:Point><gml:pos>1 2</gml:pos></gml:Point></root>',
      options: {removeNSPrefix: true}
    },
    {
      title: 'text node name is configurable',
      xml: '<root><distance unit="meters">10</distance></root>',
      options: {textNodeName: '_text'}
    },
    {
      title: 'keys can be uncapitalized',
      xml: '<Root><ChildValue>text</ChildValue></Root>',
      options: {uncapitalizeKeys: true}
    },
    {
      title: 'attribute value parsing compatibility',
      xml: '<root><item count="2" enabled="true">text</item></root>',
      options: {_fastXML: {parseAttributeValue: true}}
    }
  ];

  for (const testCase of testCases) {
    const parserOptions = {textNodeName: 'value', ...testCase.options};
    const fastXML = XMLLoader.parseTextSync?.(testCase.xml, {
      xml: {...parserOptions, _parser: 'fast-xml-parser'}
    });
    const internalXML = XMLLoader.parseTextSync?.(testCase.xml, {
      xml: {...parserOptions, _parser: 'internal'}
    });

    t.deepEqual(internalXML, fastXML, testCase.title);
  }

  t.end();
});
