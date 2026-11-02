import {expect, test} from 'vitest';
import {orderProceduralGraph, type ProceduralGraph} from '../../src/materialx/procedural-graph';

test('orders dependencies without changing authored nodes', () => {
  const graph: ProceduralGraph = {
    nodes: [
      {
        id: 'consumer',
        operation: 'identity',
        inputs: {in: {type: 'float', connection: {node: 'source', output: 'out'}}},
        outputs: {out: 'float'}
      },
      {
        id: 'source',
        operation: 'constant',
        inputs: {value: {type: 'float', value: 1}},
        outputs: {out: 'float'}
      }
    ],
    outputs: {out: {node: 'consumer', output: 'out'}}
  };
  expect(orderProceduralGraph(graph).map(node => node.id)).toEqual(['source', 'consumer']);
  expect(graph.nodes[0].id).toBe('consumer');
  graph.nodes[1].inputs.value = {type: 'float', connection: {node: 'consumer', output: 'out'}};
  expect(() => orderProceduralGraph(graph)).toThrow('cycle');
});

test('rejects missing graph outputs', () => {
  expect(() =>
    orderProceduralGraph({nodes: [], outputs: {out: {node: 'missing', output: 'out'}}})
  ).toThrow('missing');
});

test.each(['', 'same'])('rejects empty or duplicate node IDs: %s', identifier => {
  const node = {id: identifier, operation: 'constant', inputs: {}, outputs: {out: 'float'}};
  expect(() => orderProceduralGraph({nodes: [node, {...node}], outputs: {}})).toThrow('node ID');
});

test.each([
  {type: 'color3', connection: {node: 'source', output: 'out'}},
  {type: 'float', value: 0, connection: {node: 'source', output: 'out'}}
])('rejects incompatible or ambiguous inputs', input => {
  expect(() =>
    orderProceduralGraph({
      nodes: [
        {id: 'source', operation: 'constant', inputs: {}, outputs: {out: 'float'}},
        {id: 'consumer', operation: 'identity', inputs: {in: input}, outputs: {out: 'float'}}
      ],
      outputs: {}
    })
  ).toThrow();
});

test('deduplicates dependencies shared by multiple ports and consumers', () => {
  const connection = {node: 'source', output: 'out'};
  const graph: ProceduralGraph = {
    nodes: [
      {
        id: 'first',
        operation: 'add',
        inputs: {a: {type: 'float', connection}, b: {type: 'float', connection}},
        outputs: {out: 'float'}
      },
      {
        id: 'second',
        operation: 'identity',
        inputs: {in: {type: 'float', connection}},
        outputs: {out: 'float'}
      },
      {id: 'source', operation: 'constant', inputs: {}, outputs: {out: 'float'}}
    ],
    outputs: {}
  };
  expect(orderProceduralGraph(graph).map(node => node.id)).toEqual(['source', 'first', 'second']);
  expect(orderProceduralGraph({nodes: [], outputs: {}})).toEqual([]);
});
