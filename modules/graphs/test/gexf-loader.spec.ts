// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, describe, expect, test} from 'vitest';
import {
  Bool,
  Float32,
  Float64,
  Int32,
  Int64,
  List,
  Struct,
  Utf8,
  tableFromIPC,
  tableToIPC
} from 'apache-arrow';
import {GEXFLoaderWithParser} from '../src/gexf-loader';
import {parseGEXF} from '../src/lib/parse-gexf';
import type {GEXFOutput, GraphData, GraphTables} from '../src';

const DOCUMENT = `<g:gexf xmlns:g="http://gexf.net/1.3" xmlns:v="http://gexf.net/1.3/viz" version="1.3">
<g:meta lastmodifieddate="2026-10-06"><g:creator>Example</g:creator><g:description> Graph </g:description><g:keywords>test</g:keywords></g:meta>
<g:graph defaultedgetype="directed">
  <g:attributes class="node">
    <g:attribute id="0" title="count" type="integer"><g:default>5</g:default></g:attribute>
    <g:attribute id="1" title="large" type="long"/>
    <g:attribute id="2" title="tags" type="liststring"><g:default>[first, second]</g:default></g:attribute>
    <g:attribute id="3" title="flag" type="boolean"><g:default>0</g:default></g:attribute>
    <g:attribute id="4" title="id" type="string"/>
    <g:attribute id="5" title="numbers" type="listlong"/>
  </g:attributes>
  <g:attributes class="edge"><g:attribute id="0" title="score" type="float"><g:default>1.5</g:default></g:attribute></g:attributes>
  <g:nodes>
    <g:node id="001" label=" A &amp; B ">
      <g:attvalues><g:attvalue for="1" value="9007199254740993"/><g:attvalue for="3" value="true"/><g:attvalue for="4" value="application ID"/><g:attvalue for="5" value="[9007199254740993, -2]"/></g:attvalues>
      <v:color r="255" g="0" b="128" a="0.5"/><v:position x="1.5" y="-2"/><v:size value="3"/><v:shape value="image" uri="https://example.invalid/image.png"/>
    </g:node>
    <g:node id="b"><g:attvalues><g:attvalue for="2" value=""/></g:attvalues></g:node>
  </g:nodes>
  <g:edges>
    <g:edge source="001" target="b" weight="2.5" kind="friend" label="edge"><v:thickness value="2"/><v:shape value="dotted"/></g:edge>
    <g:edge id="edge-0" source="001" target="b" type="undirected"/>
    <g:edge source="b" target="b"/>
  </g:edges>
</g:graph></g:gexf>`;

/** Builds a small static document around a test-specific graph. */
function wrapGraph(contents: string, attributes = ''): string {
  return `<gexf version="1.2"><graph ${attributes}>${contents}</graph></gexf>`;
}

/** Extracts Arrow tables after checking output discriminators. */
function getArrowTables(output: GEXFOutput): GraphTables {
  expect(output.shape).toBe('tables');
  const graph = output as GraphTables;
  expect(graph.tables.map(entry => entry.table.shape)).toEqual(['arrow-table', 'arrow-table']);
  return graph;
}

/** Extracts compatibility records after checking their discriminator. */
function getPlainGraph(text: string): GraphData {
  const output = parseGEXF(text, 'plain-graph-data');
  if (output.shape !== 'plain-graph-data') throw new Error('Expected plain graph data.');
  return output;
}

describe('GEXFLoader', () => {
  let output: GEXFOutput;
  let tables: GraphTables;
  beforeAll(() => {
    output = parseGEXF(DOCUMENT);
    tables = getArrowTables(output);
  });

  test('preserves scoped types, defaults, identifiers, labels, and document metadata', () => {
    expect(output.metadata).toEqual({
      version: '1.3',
      directed: true,
      attributes: {
        creator: 'Example',
        description: ' Graph ',
        keywords: 'test',
        lastmodifieddate: '2026-10-06'
      }
    });
    const nodes = tables.tables[0].table.data;
    expect(nodes.getChild('id')!.toArray()).toEqual(['001', 'b']);
    expect(nodes.getChild('label')!.toArray()).toEqual([' A & B ', null]);
    const attributes = nodes.getChild('attributes')!;
    const first = attributes.get(0);
    expect(first.count).toBe(5);
    expect(first.large).toBe(9007199254740993n);
    expect(first.flag).toBe(true);
    expect(first.id).toBe('application ID');
    expect(Array.from(first.tags)).toEqual(['first', 'second']);
    expect(Array.from(first.numbers)).toEqual([9007199254740993n, -2n]);
    expect(attributes.get(1).large).toBeNull();
    expect(Array.from(attributes.get(1).tags)).toEqual([]);
    expect(attributes.get(1).flag).toBe(false);
    const fields = (attributes.type as Struct).children;
    expect(fields.find(field => field.name === 'count')!.type).toBeInstanceOf(Int32);
    expect(fields.find(field => field.name === 'large')!.type).toBeInstanceOf(Int64);
    expect(fields.find(field => field.name === 'flag')!.type).toBeInstanceOf(Bool);
    expect(fields.find(field => field.name === 'tags')!.type).toBeInstanceOf(List);
    expect((fields.find(field => field.name === 'numbers')!.type as List).valueType).toBeInstanceOf(
      Int64
    );
    const edges = tables.tables[1].table.data;
    expect(edges.getChild('attributes')!.get(0).score).toBe(1.5);
    expect((edges.getChild('attributes')!.type as Struct).children[0].type).toBeInstanceOf(Float32);
    expect(nodes.schema.fields.map(field => field.name)).toEqual(['id', 'label', 'attributes']);
  });

  test('retains native visualization properties, weights, and parallel edge kinds', () => {
    const visualization = tables.tables[0].table.data.getChild('attributes')!.get(0).gexf.viz;
    expect(visualization.color.toJSON()).toEqual({r: 255, g: 0, b: 128, a: 0.5});
    expect(visualization.position.toJSON()).toEqual({x: 1.5, y: -2});
    expect(visualization.size.value).toBe(3);
    expect(visualization.shape.toJSON()).toEqual({
      value: 'image',
      uri: 'https://example.invalid/image.png'
    });
    const edges = tables.tables[1].table.data;
    expect(edges.getChild('id')!.toArray()).toEqual(['_edge-0', 'edge-0', 'edge-2']);
    expect(edges.getChild('directed')!.toArray()).toEqual([true, false, true]);
    expect(edges.getChild('targetId')!.get(2)).toBe('b');
    expect(edges.getChild('attributes')!.get(0).gexf.toJSON()).toMatchObject({
      weight: 2.5,
      kind: 'friend'
    });
    expect(edges.getChild('attributes')!.get(0).gexf.viz.thickness.value).toBe(2);
    expect(edges.getChild('attributes')!.get(0).gexf.viz.shape.value).toBe('dotted');
  });

  test('Arrow tables survive IPC serialization', () => {
    const restored = tableFromIPC(tableToIPC(tables.tables[0].table.data));
    expect(restored.getChild('attributes')!.get(0).large).toBe(9007199254740993n);
    expect(Array.from(restored.getChild('attributes')!.get(0).numbers)).toEqual([
      9007199254740993n,
      -2n
    ]);
  });

  test('supports text, ArrayBuffer, and Uint8Array with all output shapes', async () => {
    const binary = new TextEncoder().encode(DOCUMENT);
    for (const result of [
      parseGEXF(binary),
      GEXFLoaderWithParser.parseSync(binary.buffer),
      await GEXFLoaderWithParser.parse(binary.buffer),
      GEXFLoaderWithParser.parseTextSync(DOCUMENT)
    ]) {
      expect(getArrowTables(result).tables[0].table.data.numRows).toBe(2);
    }
    const rows = GEXFLoaderWithParser.parseTextSync(DOCUMENT, {gexf: {shape: 'object-row-table'}});
    if (rows.shape !== 'tables' || rows.tables[0].table.shape !== 'object-row-table')
      throw new Error('Expected object rows.');
    expect(rows.tables[0].table.data[0].attributes).toMatchObject({
      large: 9007199254740993n,
      tags: ['first', 'second']
    });
    const plain = GEXFLoaderWithParser.parseSync(binary.buffer, {
      gexf: {shape: 'plain-graph-data'}
    });
    if (plain.shape !== 'plain-graph-data') throw new Error('Expected plain output.');
    expect(plain.nodes[0].attributes!.large).toBe(9007199254740993n);
    expect(plain.metadata).toEqual(output.metadata);
  });

  test('empty graphs preserve declared scalar and list schemas', () => {
    const graph = getArrowTables(
      parseGEXF(
        wrapGraph(
          `<attributes class="node"><attribute id="0" title="values" type="listdouble"/><attribute id="1" title="url" type="anyURI"/><attribute id="2" title="decimal" type="bigdecimal"/></attributes><nodes/><edges/>`
        )
      )
    );
    const nodes = graph.tables[0].table.data;
    expect(nodes.numRows).toBe(0);
    const fields = (nodes.getChild('attributes')!.type as Struct).children;
    expect((fields[0].type as List).valueType).toBeInstanceOf(Float64);
    expect(fields[1].type).toBeInstanceOf(Utf8);
    expect(fields[2].type).toBeInstanceOf(Utf8);
    expect(getArrowTables(parseGEXF('<gexf><graph/></gexf>')).tables[1].table.data.numRows).toBe(0);
  });

  test.each([
    'http://www.gexf.net/1.2draft',
    'http://gexf.net/1.2',
    'http://gexf.net/1.3'
  ])('resolves default namespace %s and locally bound viz namespaces', namespace => {
    const graph = getPlainGraph(
      `<gexf xmlns="${namespace}" version="1.2draft"><graph><nodes><node id="n"><color xmlns="${namespace}/viz" hex="#123456"/><v:position xmlns:v="${namespace}/viz" x="0" y="1" z="2"/><other:size xmlns:other="urn:foreign" value="8"/></node></nodes></graph></gexf>`
    );
    expect(graph.nodes[0].attributes).toEqual({
      gexf: {viz: {color: {hex: '#123456'}, position: {x: 0, y: 1, z: 2}}}
    });
  });

  test.each([
    ['boolean', '1', true],
    ['boolean', 'false', false],
    ['boolean', 'invalid', 'invalid'],
    ['integer', '+7', 7],
    ['integer', '7oops', '7oops'],
    ['integer', '9007199254740993', '9007199254740993'],
    ['byte', '-1', -1],
    ['short', '2', 2],
    ['long', '-9007199254740993', -9007199254740993n],
    ['float', '1.25e2', 125],
    ['double', '', ''],
    ['double', 'NaN', NaN],
    ['double', 'INF', Infinity],
    ['double', '-INF', -Infinity],
    ['double', '0x10', '0x10'],
    ['date', '2026-10-06', '2026-10-06'],
    ['char', 'x', 'x'],
    ['biginteger', '999999999999999999999999999', '999999999999999999999999999'],
    ['listinteger', '1|2;3', [1, 2, 3]],
    ['listboolean', '[true, false, 1]', [true, false, true]],
    ['liststring', 'first|second', ['first', 'second']]
  ])('casts %s value %s without losing invalid text', (type, value, expected) => {
    const graph = getPlainGraph(
      wrapGraph(
        `<attributes class="node"><attribute id="a" title="value" type="${type}"/></attributes><nodes><node id="n"><attvalues><attvalue for="a" value="${value}"/></attvalues></node></nodes>`
      )
    );
    expect(graph.nodes[0].attributes!.value).toEqual(expected);
  });

  test('list defaults are independent across plain node records', () => {
    const graph = getPlainGraph(
      wrapGraph(
        '<attributes class="node"><attribute id="a" title="value" type="liststring"><default>[]</default></attribute></attributes><nodes><node id="a"/><node id="b"/></nodes>'
      )
    );
    (graph.nodes[0].attributes!.value as string[]).push('changed');
    expect(graph.nodes[1].attributes!.value).toEqual([]);
  });

  test('quoted list strings retain commas, pipes, spaces, and escaped quotes', () => {
    const graph = getPlainGraph(
      wrapGraph(
        `<attributes class="node"><attribute id="a" title="value" type="liststring"/></attributes><nodes><node id="n"><attvalues><attvalue for="a" value="[' a,b ', 'c|d', &quot;e&quot;, 'it\\'s', 'a\\\\b']"/></attvalues></node></nodes>`
      )
    );
    expect(graph.nodes[0].attributes!.value).toEqual([' a,b ', 'c|d', 'e', "it's", 'a\\b']);
  });

  test.each([
    "['unterminated]",
    "['a' trailing]",
    '[a',
    'a]'
  ])('rejects malformed list %s', value => {
    expect(() =>
      getPlainGraph(
        wrapGraph(
          `<attributes class="node"><attribute id="a" title="value" type="liststring"/></attributes><nodes><node id="n"><attvalues><attvalue for="a" value="${value}"/></attvalues></node></nodes>`
        )
      )
    ).toThrow(/GEXF list/);
  });

  test('invalid and out-of-range scalar and list values promote to strings', () => {
    const graph = getArrowTables(
      parseGEXF(
        wrapGraph(
          `<attributes class="node"><attribute id="i" title="integer" type="integer"/><attribute id="l" title="long" type="long"/><attribute id="a" title="list" type="listinteger"/></attributes><nodes><node id="n"><attvalues><attvalue for="i" value="2147483648"/><attvalue for="l" value="9223372036854775808"/><attvalue for="a" value="[1, bad]"/></attvalues></node></nodes>`
        )
      )
    );
    const attributes = graph.tables[0].table.data.getChild('attributes')!.get(0);
    expect(attributes.integer).toBe('2147483648');
    expect(attributes.long).toBe('9223372036854775808');
    expect(Array.from(attributes.list)).toEqual(['1', 'bad']);
  });

  test.each([
    ['<gexf>', 'Invalid GEXF XML'],
    ['<!DOCTYPE gexf><gexf><graph/></gexf>', 'document types'],
    ['<other/>', '<gexf>'],
    ['<gexf xmlns="urn:foreign"><graph/></gexf>', '<gexf>'],
    ['<gexf version="2"><graph/></gexf>', 'version'],
    ['<gexf/>', '<graph>'],
    ['<gexf><graph/><graph/></gexf>', '<graph>'],
    [wrapGraph('', 'mode="dynamic"'), 'Dynamic'],
    [wrapGraph('', 'mode="slice" timestamp="1"'), 'Dynamic'],
    [wrapGraph('', 'defaultedgetype="mutual"'), 'edge type'],
    [wrapGraph('<nodes><node id="n" pid="p"/></nodes>'), 'Hierarchical'],
    [wrapGraph('<nodes><node id="n"><nodes/></node></nodes>'), 'Hierarchical'],
    [wrapGraph('<nodes><node id="n"><parents/></node></nodes>'), 'Hierarchical'],
    [wrapGraph('<nodes><node id="n" startopen="1"/></nodes>'), 'Dynamic'],
    [wrapGraph('<nodes><node id="n"><spells/></node></nodes>'), 'Dynamic'],
    [wrapGraph('<attributes class="node" mode="dynamic"/>'), 'Dynamic'],
    [
      wrapGraph(
        '<nodes><node id="n"><attvalues><attvalue for="a" value="1" end="2"/></attvalues></node></nodes>'
      ),
      'Dynamic'
    ],
    [wrapGraph('<nodes><node/></nodes>'), 'id attribute'],
    [wrapGraph('<nodes><node id="n"/><node id="n"/></nodes>'), 'Duplicate GEXF node'],
    [wrapGraph('<edges><edge source="a" target="b"/></edges>'), 'undeclared node'],
    [wrapGraph('<edges><edge target="b"/></edges>'), 'source attribute'],
    [
      wrapGraph(
        '<nodes><node id="n"/></nodes><edges><edge id="e" source="n" target="n"/><edge id="e" source="n" target="n"/></edges>'
      ),
      'Duplicate GEXF edge'
    ],
    [
      wrapGraph(
        '<nodes><node id="n"/></nodes><edges><edge source="n" target="n" type="mutual"/></edges>'
      ),
      'edge type'
    ],
    [wrapGraph('<attributes class="all"/>'), 'class'],
    [
      wrapGraph(
        '<attributes class="node"><attribute id="a" title="gexf" type="string"/></attributes>'
      ),
      'reserved'
    ],
    [
      wrapGraph(
        '<attributes class="node"><attribute id="a" title="a" type="string"/><attribute id="a" title="b" type="string"/></attributes>'
      ),
      'Duplicate'
    ],
    [
      wrapGraph(
        '<attributes class="node"><attribute id="a" title="a" type="string"/><attribute id="b" title="a" type="string"/></attributes>'
      ),
      'Duplicate'
    ],
    [
      wrapGraph(
        '<attributes class="node"><attribute id="a" title="a" type="unknown"/></attributes>'
      ),
      'attribute type'
    ],
    [
      wrapGraph(
        '<nodes><node id="n"><attvalues><attvalue for="unknown" value="1"/></attvalues></node></nodes>'
      ),
      'Undeclared'
    ],
    [
      wrapGraph(
        '<attributes class="node"><attribute id="a" title="a" type="string"/></attributes><nodes><node id="n"><attvalues><attvalue for="a"/></attvalues></node></nodes>'
      ),
      'value attribute'
    ],
    [wrapGraph('<nodes/><nodes/>'), 'container'],
    [
      wrapGraph('<nodes><node id="n"/></nodes><edges><edge id="" source="n" target="n"/></edges>'),
      'id attribute'
    ],
    [
      wrapGraph(
        '<attributes class="node"><attribute id="a" title="a" type="listliststring"/></attributes>'
      ),
      'attribute type'
    ]
  ])('rejects unsupported or malformed input: %s', (document, message) => {
    expect(() => parseGEXF(document)).toThrow(message);
  });
});
