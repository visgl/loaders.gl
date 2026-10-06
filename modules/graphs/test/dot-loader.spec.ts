// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, describe, expect, test} from 'vitest';
import {parseDOT} from '../src/lib/parse-dot';
import type {DOTGraphData} from '../src';
import clusterDot from './data/cluster.dot?raw';
import karateDot from './data/karate.dot?raw';

describe('DOT graph fixtures', () => {
  let cluster: DOTGraphData;
  let karate: DOTGraphData;
  beforeAll(() => {
    cluster = parseDOT(clusterDot);
    karate = parseDOT(karateDot);
  });

  test('parses undirected graph defaults and numeric attributes', () => {
    expect(karate.metadata).toMatchObject({
      id: 'karate',
      directed: false,
      strict: false,
      attributes: {label: 'Karate Club'}
    });
    expect(karate.nodes).toHaveLength(8);
    expect(karate.nodes.find(node => node.id === '0')?.attributes).toMatchObject({
      label: 'Mr. Hi',
      shape: 'circle'
    });
    expect(karate.edges.find(edge => edge.sourceId === '0' && edge.targetId === '1')).toMatchObject(
      {directed: false, attributes: {weight: 3}}
    );
  });

  test('preserves clusters, scoped defaults, edge chains, and graph attributes', () => {
    expect(cluster.metadata).toMatchObject({
      id: 'G',
      directed: true,
      attributes: {label: 'Cluster Example'}
    });
    expect(cluster.metadata.subgraphs.map(subgraph => subgraph.id)).toEqual([
      'cluster_0',
      'cluster_1'
    ]);
    expect(cluster.metadata.subgraphs[0].attributes).toMatchObject({
      style: 'filled',
      color: 'lightgrey',
      label: 'process #1'
    });
    expect(cluster.nodes.find(node => node.id === 'a0')?.attributes).toMatchObject({
      style: 'filled',
      color: 'white',
      subgraphs: [{id: 'cluster_0'}]
    });
    expect(
      cluster.edges.find(edge => edge.sourceId === 'a3' && edge.targetId === 'end')?.directed
    ).toBe(false);
    expect(cluster.nodes.find(node => node.id === 'start')?.attributes).toEqual({
      shape: 'Mdiamond'
    });
  });
});

test('preserves quoted and HTML identifiers, repeated attributes, edge IDs, and labels', () => {
  const graph = parseDOT(`strict digraph "Named graph" {
    ;; graph [rankdir=LR] [label="Graph"]; edge [weight=2];
    "a:b" [label=<<B>Alpha</B>>, active; score=-1.5][score=3];
    <Beta> [label="Beta"]; "a:b" -> <Beta> [id="edge", label="Relation", dir=back];
    "a:b" [color=red];
  };`);
  expect(graph.metadata).toMatchObject({
    id: 'Named graph',
    strict: true,
    attributes: {rankdir: 'LR', label: 'Graph'}
  });
  expect(graph.nodes[0]).toMatchObject({
    id: 'a:b',
    label: '<<B>Alpha</B>>',
    attributes: {active: true, score: 3, color: 'red'}
  });
  expect(graph.nodes[1].id).toBe('<Beta>');
  expect(graph.edges[0]).toMatchObject({
    id: 'edge',
    label: 'Relation',
    directed: true,
    attributes: {weight: 2, dir: 'back'}
  });
});

test('inherits defaults into nested named and anonymous subgraphs without leaking them', () => {
  const graph = parseDOT(`graph {
    node [shape=box]; edge [weight=1];
    subgraph outer { color=red; node [color=blue];
      subgraph { graph [label="inner"]; a -- b [weight=3]; }
      c;
    }
    d; c -- d;
  }`);
  expect(graph.metadata.subgraphs).toEqual([
    {id: 'outer', attributes: {color: 'red'}, parentId: undefined},
    {id: 'subgraph_1', attributes: {label: 'inner'}, parentId: 'outer'}
  ]);
  expect(graph.nodes[0].attributes?.subgraphs).toMatchObject([{id: 'outer'}, {id: 'subgraph_1'}]);
  expect(graph.nodes.find(node => node.id === 'd')?.attributes).toEqual({shape: 'box'});
  expect(graph.edges.map(edge => edge.attributes?.weight)).toEqual([3, 1]);
});

test('preserves safe application attribute names', () => {
  const graph = parseDOT(
    'graph { graph [__proto__="graph"]; node [__proto__="node"]; edge [__proto__="edge"]; a -- b; }'
  );
  expect(graph.metadata.attributes.__proto__).toBe('graph');
  expect(graph.nodes[0].attributes?.__proto__).toBe('node');
  expect(graph.edges[0].attributes?.__proto__).toBe('edge');
});

test('accepts line, block, and hash comments, whitespace, and slash-containing IDs', () => {
  const graph = parseDOT(
    '/* header */\n# directive\rgraph {\t\f a/b -- -2; // line\n a/b [label="/text"]; } # end'
  );
  expect(graph.nodes.map(node => node.id)).toEqual(['a/b', '-2']);
  expect(graph.edges[0].directed).toBe(false);
});

test.each([
  ['n', '\n'],
  ['l', '\n'],
  ['L', '\n'],
  ['t', '\t'],
  ['r', '\r'],
  ['"', '"'],
  ['\\', '\\'],
  ['q', 'q']
])('decodes quoted escape %s', (escape, expected) => {
  const graph = parseDOT(`graph { a [label="before\\${escape}after"]; }`);
  expect(graph.nodes[0].label).toBe(`before${expected}after`);
});

test.each(['id', 'Id', 'ID'])('uses the %s edge attribute as an identifier', key => {
  const graph = parseDOT(`graph { a -- b [${key}=5]; }`);
  expect(graph.edges[0].id).toBe('5');
});

test('applies unvalued boolean direction flags', () => {
  expect(parseDOT('graph { a -- b [directed]; }').edges[0].directed).toBe(true);
  expect(parseDOT('digraph { a -> b [dir=none]; }').edges[0].directed).toBe(false);
});

test('allows empty and anonymous graph bodies and subgraphs', () => {
  expect(parseDOT('graph {}').nodes).toEqual([]);
  expect(parseDOT('graph { { a; } }').metadata.subgraphs[0].id).toBe('subgraph_1');
});

test.each([
  ['', 'must start'],
  ['invalid {}', 'must start'],
  ['graph a', 'Unexpected end'],
  ['graph [', 'Expected token lbrace'],
  ['graph { a;', 'closing brace'],
  ['graph { subgraph x { a;', 'closing brace'],
  ['graph {} other', 'after DOT graph'],
  ['graph { = }', 'Unexpected token'],
  ['graph { a -- ; }', 'node identifier'],
  ['graph { a [=1] }', 'attribute name'],
  ['graph { a [x=] }', 'Invalid attribute value'],
  ['graph { a [x=1', 'Unexpected end'],
  ['graph { a [x="bad] }', 'Unterminated string'],
  ['graph { a [x="bad\\', 'Unterminated escape'],
  ['graph { a [x=<bad] }', 'Unterminated HTML'],
  ['graph { /* unclosed', 'Unterminated block comment'],
  ['graph { a:port -- b; }', 'ports are not supported']
])('rejects invalid or unsupported DOT: %s', (document, message) => {
  expect(() => parseDOT(document)).toThrow(message);
});

test('coalesces strict parallel edges and keeps multigraph edges otherwise', () => {
  const undirected = parseDOT(
    'strict graph { edge [weight=1]; a -- b [color=red]; b -- a [weight=2]; }'
  );
  expect(undirected.edges).toHaveLength(1);
  expect(undirected.edges[0].attributes).toEqual({weight: 2, color: 'red'});
  const directed = parseDOT('strict digraph { a -> b; a -> b [label="updated"]; b -> a; }');
  expect(directed.edges).toHaveLength(2);
  expect(directed.edges[0].label).toBe('updated');
  expect(parseDOT('graph { a -- b; b -- a; }').edges).toHaveLength(2);
});

test.each([
  'graph { a -> b; }',
  'digraph { a -- b; }'
])('rejects edge operators inconsistent with the graph declaration: %s', document => {
  expect(() => parseDOT(document)).toThrow('edge operator must match');
});
