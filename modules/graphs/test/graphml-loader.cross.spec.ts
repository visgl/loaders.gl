// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {parse, parseSync} from '@loaders.gl/core';
import {GraphMLLoader} from '../src';
import {parseGraphML} from '../src/lib/parse-graphml';
import {GraphMLLoaderWithParser} from '../src/graphml-loader';

const DOCUMENT = `<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <key id="label" for="node" attr.name="label" attr.type="string"/>
  <key id="count" for="node" attr.name="count" attr.type="int"><default>5</default></key>
  <key id="weight" for="edge" attr.name="weight" attr.type="double"><default>1.5</default></key>
  <key id="flag" for="all" attr.name="flag" attr.type="boolean"><default>true</default></key>
  <graph edgedefault="directed">
    <node id="001"><data key="label">Zero</data><data key="flag">false</data></node>
    <node id="b"><data key="count">7</data><data key="custom">note</data></node>
    <edge id="e" source="001" target="b"><data key="weight">2.5</data></edge>
    <edge source="b" target="001" directed="false"/>
  </graph>
</graphml>`;

describe('GraphMLLoader', () => {
  test('keeps the root loader metadata-only and preloads through core', async () => {
    expect('parseSync' in GraphMLLoader).toBe(false);
    const graph = await parse(DOCUMENT, GraphMLLoader);
    expect(graph.shape).toBe('plain-graph-data');
    expect(graph.nodes).toEqual([
      {id: '001', label: 'Zero', attributes: {count: 5, flag: false, label: 'Zero'}},
      {id: 'b', attributes: {count: 7, flag: true, custom: 'note'}}
    ]);
    expect(graph.edges).toEqual([
      {
        id: 'e',
        sourceId: '001',
        targetId: 'b',
        directed: true,
        attributes: {weight: 2.5, flag: true}
      },
      {
        id: 'edge-1',
        sourceId: 'b',
        targetId: '001',
        directed: false,
        attributes: {weight: 1.5, flag: true}
      }
    ]);
  });

  test('supports synchronous text and binary input', () => {
    const text = parseSync(DOCUMENT, GraphMLLoaderWithParser);
    const binary = parseSync(new TextEncoder().encode(DOCUMENT).buffer, GraphMLLoaderWithParser);
    expect(binary).toEqual(text);
  });

  test('supports prefixed elements, undirected defaults, and structured data', () => {
    const graph = parseSync(
      `<g:graphml xmlns:g="http://graphml.graphdrawing.org/xmlns">
      <g:graph edgedefault="undirected"><g:node id="a"><g:data key="vendor"><payload>value</payload></g:data></g:node>
      <g:node id="b"/><g:edge source="a" target="b"/></g:graph></g:graphml>`,
      GraphMLLoaderWithParser
    );
    expect(graph.nodes[0].attributes?.vendor).toBe('{"payload":"value"}');
    expect(graph.edges[0].directed).toBe(false);
  });

  test('rejects documents without a GraphML root or graph', () => {
    expect(() => parseSync('<other/>', GraphMLLoaderWithParser)).toThrow('<graphml>');
    expect(() => parseSync('<graphml/>', GraphMLLoaderWithParser)).toThrow();
  });

  test('selects the first graph, skips incomplete records, and preserves vendor data safely', () => {
    const graph = parseSync(
      `<graphml>
      <key id="category" for="node" attr.name="category"><default>general</default></key>
      <key id="unused" for="graph" attr.name="unused"><default>hidden</default></key>
      <graph edgedefault="undirected"><node/><node id="a">
        <data key="__proto__">safe</data><data key="vendor"><payload>value</payload></data>
      </node><node id="b"/><edge source="a"/><edge source="a" target="b" directed="true"/></graph>
      <graph edgedefault="directed"><node id="ignored"/></graph>
    </graphml>`,
      GraphMLLoaderWithParser
    );
    expect(graph.nodes.map(node => node.id)).toEqual(['a', 'b']);
    expect(graph.nodes[0].attributes?.category).toBe('general');
    expect(graph.nodes[0].attributes?.unused).toBeUndefined();
    expect(graph.nodes[0].attributes?.['__proto__']).toBe('safe');
    expect(graph.edges).toEqual([
      {id: 'edge-1', sourceId: 'a', targetId: 'b', directed: true, attributes: undefined}
    ]);
  });

  test.each([
    ['int', '7', 7],
    ['long', '9', 9],
    ['float', '1.25', 1.25],
    ['double', '2.5', 2.5],
    ['boolean', 'true', true],
    ['boolean', '0', false],
    ['string', '001', '001'],
    ['vendor', 'abc', 'abc'],
    ['int', 'unknown', 'unknown']
  ])('converts %s data %s', (type, value, expected) => {
    const graph = parseSync(
      `<graphml><key id="value" for="node" attr.name="value" attr.type="${type}"/>
      <graph edgedefault="directed"><node id="a"><data key="value">${value}</data></node></graph>
    </graphml>`,
      GraphMLLoaderWithParser
    );
    expect(graph.nodes[0].attributes?.value).toBe(expected);
  });

  test('parses direct UTF-8 inputs and the asynchronous implementation', async () => {
    const bytes = new TextEncoder().encode(DOCUMENT);
    const expected = parseGraphML(DOCUMENT);
    expect(parseGraphML(bytes)).toEqual(expected);
    expect(parseGraphML(bytes.buffer)).toEqual(expected);
    expect(await GraphMLLoaderWithParser.parse(bytes.buffer)).toEqual(expected);
    expect(() => parseGraphML(null as any)).toThrow('Unsupported GraphML input');
    expect(() => parseGraphML('<graphml><node/></graphml>')).toThrow('<graph>');
  });

  test('handles empty data, undeclared types, malformed records, and keys without IDs', () => {
    const graph = parseGraphML(`<graphml>
      <key/><key id="ignored" for="invalid"><default>value</default></key>
      <key id="plain"/><key id="double" attr.type="double"/>
      <key id="repeat"><default>first</default><default>second</default></key>
      <graph><key id="local" for="edge" attr.type="boolean"><default>unknown</default></key>
        <node>text</node><node id="a"><data/><data>text</data><data key="plain"/>
          <data key="double">invalid</data><data key="repeat">override</data></node>
        <node id="b"/><edge>text</edge><edge target="b"/>
        <edge source="a" target="b"><data key="label">Edge label</data></edge>
      </graph></graphml>`);
    expect(graph.nodes).toHaveLength(2);
    expect(graph.nodes[0].attributes?.double).toBe('invalid');
    expect(graph.nodes[1].attributes?.repeat).toBe('first');
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].label).toBe('Edge label');
    expect(graph.edges[0].directed).toBe(false);
  });

  test.each([
    'true',
    '1',
    'yes',
    'directed',
    'false',
    '0',
    'no',
    'undirected',
    'invalid'
  ])('reads direction override %s', directed => {
    const graph = parseGraphML(`<graphml><graph edgedefault="directed"><node id="a"/>
        <edge source="a" target="a" directed="${directed}"/></graph></graphml>`);
    expect(graph.edges[0].directed).toBe(!['false', '0', 'no', 'undirected'].includes(directed));
  });

  test.each([
    'true',
    '1',
    'yes',
    'y',
    'false',
    '0',
    'no',
    'n',
    'other'
  ])('reads boolean value %s', value => {
    const graph = parseGraphML(`<graphml><key id="flag" attr.type="boolean"/><graph>
        <node id="a"><data key="flag">${value}</data></node></graph></graphml>`);
    expect(graph.nodes[0].attributes?.flag).toBe(!['false', '0', 'no', 'n'].includes(value));
  });
});
