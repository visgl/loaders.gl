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
