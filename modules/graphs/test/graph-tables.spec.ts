// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {parse, parseSync} from '@loaders.gl/core';
import {
  Bool,
  Float32,
  Float64,
  Int32,
  Int64,
  Struct,
  Utf8,
  tableFromIPC,
  tableToIPC
} from 'apache-arrow';
import {DOTLoader, GraphMLLoader} from '../src';
import {DOTLoaderWithParser} from '../src/dot-loader';
import {GraphMLLoaderWithParser} from '../src/graphml-loader';
import {buildGraphTables} from '../src/lib/build-graph-tables';
import type {GraphTables} from '../src';

const DOCUMENT = `<graphml>
  <key id="count" for="node" attr.type="int"><default>5</default></key>
  <key id="large" for="all" attr.type="long"/>
  <key id="weight" for="edge" attr.type="float"/>
  <key id="flag" for="all" attr.type="boolean"><default> \n </default></key>
  <key id="id" for="node" attr.type="string"/>
  <graph edgedefault="directed">
    <node id="001"><data key="large">9007199254740993</data><data key="id">application ID</data></node>
    <node id="b"><data key="flag"> \n </data></node>
    <edge source="001" target="b"><data key="weight">1.5</data></edge>
  </graph>
</graphml>`;

/** Extracts the default Arrow output after checking its discriminators. */
function getArrowGraph(output: unknown): GraphTables {
  const graph = output as GraphTables;
  expect(graph.shape).toBe('tables');
  expect(graph.tables.map(entry => [entry.name, entry.table.shape])).toEqual([
    ['nodes', 'arrow-table'],
    ['edges', 'arrow-table']
  ]);
  return graph;
}

describe('Graph tables', () => {
  test('GraphML defaults to typed Arrow tables through metadata and sync APIs', async () => {
    const graph = getArrowGraph(await parse(DOCUMENT, GraphMLLoader));
    const nodes = graph.tables[0].table;
    const edges = graph.tables[1].table;
    expect(nodes.data.getChild('id')!.toArray()).toEqual(['001', 'b']);
    const attributes = nodes.data.getChild('attributes')!;
    expect(attributes.get(0).toJSON()).toMatchObject({
      count: 5,
      large: 9007199254740993n,
      flag: false,
      id: 'application ID'
    });
    expect(attributes.get(1).toJSON()).toMatchObject({count: 5, large: null, flag: false});
    expect(edges.data.get(0)!.toJSON()).toMatchObject({
      sourceId: '001',
      targetId: 'b',
      directed: true
    });
    expect(attributes.type).toBeInstanceOf(Struct);
    const fields = (attributes.type as Struct).children;
    expect(fields.find(field => field.name === 'count')!.type).toBeInstanceOf(Int32);
    expect(fields.find(field => field.name === 'large')!.type).toBeInstanceOf(Int64);
    expect(fields.find(field => field.name === 'flag')!.type).toBeInstanceOf(Bool);
    expect(
      (edges.data.getChild('attributes')!.type as Struct).children.find(
        field => field.name === 'weight'
      )!.type
    ).toBeInstanceOf(Float32);
    expect(nodes.schema?.fields.map(field => field.name)).toEqual(['id', 'label', 'attributes']);
    const binary = new TextEncoder().encode(DOCUMENT).buffer;
    for (const output of [
      parseSync(DOCUMENT, GraphMLLoaderWithParser),
      parseSync(binary, GraphMLLoaderWithParser),
      await GraphMLLoaderWithParser.parse(binary)
    ]) {
      expect(getArrowGraph(output).tables[0].table.data.getChild('attributes')!.get(0).large).toBe(
        9007199254740993n
      );
    }
    const restored = tableFromIPC(tableToIPC(nodes.data));
    expect(restored.getChild('attributes')!.get(0).large).toBe(9007199254740993n);
  });

  test('empty graphs retain structural and declared application schemas', () => {
    const graph = getArrowGraph(
      parseSync(
        '<graphml><key id="unused" for="all" attr.type="double"/><graph/></graphml>',
        GraphMLLoaderWithParser
      )
    );
    for (const {table} of graph.tables) {
      expect(table.data.numRows).toBe(0);
      expect((table.data.getChild('attributes')!.type as Struct).children[0].type).toBeInstanceOf(
        Float64
      );
    }
    const dot = getArrowGraph(parseSync('graph {}', DOTLoaderWithParser));
    expect(dot.tables[1].table.data.schema.fields.map(field => field.name)).toEqual([
      'id',
      'sourceId',
      'targetId',
      'directed',
      'label',
      'attributes'
    ]);
  });

  test('DOT retains coalesced IDs, nested membership, and graph metadata', async () => {
    const output = await parse(
      'strict digraph Example { subgraph cluster { a [label=" A ", weight=2]; a -> b [id=3]; a -> b [id="updated"]; } }',
      DOTLoader
    );
    const graph = getArrowGraph(output);
    expect(output.metadata).toMatchObject({
      id: 'Example',
      strict: true,
      directed: true,
      subgraphs: [{id: 'cluster'}]
    });
    expect(graph.tables[1].table.data.numRows).toBe(1);
    expect(graph.tables[1].table.data.getChild('id')!.get(0)).toBe('updated');
    expect(graph.tables[0].table.data.getChild('label')!.get(0)).toBe(' A ');
    const attributes = graph.tables[0].table.data.getChild('attributes')!.get(0);
    expect(attributes.weight).toBe(2);
    expect(attributes.subgraphs.get(0).id).toBe('cluster');
  });

  test('DOT binary APIs preserve rows with empty attribute structs', async () => {
    const binary = new TextEncoder().encode('graph { a -- b [id=3]; }').buffer;
    for (const output of [
      parseSync(binary, DOTLoaderWithParser),
      await DOTLoaderWithParser.parse(binary)
    ]) {
      const graph = getArrowGraph(output);
      const nodes = graph.tables[0].table.data;
      expect(nodes.numRows).toBe(2);
      expect(nodes.getChild('attributes')!.length).toBe(2);
      expect(nodes.getChild('attributes')!.get(0).toJSON()).toEqual({});
      expect(graph.tables[1].table.data.getChild('id')!.get(0)).toBe('3');
    }
  });

  test('object-row-table output uses standard wrappers and exact long values', () => {
    const graph = parseSync(DOCUMENT, GraphMLLoaderWithParser, {
      graphml: {shape: 'object-row-table'}
    });
    expect(graph.shape).toBe('tables');
    if (graph.shape !== 'tables' || graph.tables[0].table.shape !== 'object-row-table')
      throw new Error('Expected object rows');
    expect(graph.tables[0].table.data[0]).toMatchObject({
      id: '001',
      attributes: {large: 9007199254740993n}
    });
    const dot = parseSync('graph { a -- b; }', DOTLoaderWithParser, {
      dot: {shape: 'object-row-table'}
    });
    expect(dot.shape).toBe('tables');
    expect(dot.metadata.directed).toBe(false);
  });

  test('mixed and invalid application values use deterministic string columns', () => {
    const graph = getArrowGraph(
      buildGraphTables(
        [
          {id: 'a', attributes: {mixed: 1, flag: true, nested: {one: 1}, list: [1, 2]}},
          {id: 'b', attributes: {mixed: 'quoted', flag: false, nested: {two: 'second'}, list: []}}
        ],
        [],
        'arrow-table'
      )
    );
    const attributes = graph.tables[0].table.data.getChild('attributes')!;
    expect(
      (attributes.type as Struct).children.find(field => field.name === 'mixed')!.type
    ).toBeInstanceOf(Utf8);
    expect(attributes.get(0).mixed).toBe('1');
    expect(attributes.get(1).nested.one).toBeNull();
    expect(Array.from(attributes.get(0).list)).toEqual([1, 2]);
    const invalid = getArrowGraph(
      parseSync(
        '<graphml><key id="value" attr.type="int"/><key id="large" attr.type="long"/><graph><node id="a"><data key="value">invalid</data><data key="large">9223372036854775808</data></node></graph></graphml>',
        GraphMLLoaderWithParser
      )
    );
    expect(invalid.tables[0].table.data.getChild('attributes')!.get(0).toJSON()).toMatchObject({
      value: 'invalid',
      large: '9223372036854775808'
    });
  });

  test('rejects unsupported output shapes', () => {
    expect(() =>
      parseSync('graph {}', DOTLoaderWithParser, {dot: {shape: 'columnar-table' as any}})
    ).toThrow('Unsupported graph shape');
  });
});
