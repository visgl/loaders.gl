import test from 'tape-promise/tape';
import {dumpTilesToObject} from '../../../src/i3s-converter/helpers/dump-parser';

test('tile-converter(i3s)#dumpTilesToObject - conversion from dump map to object', (t) => {
  const inputMap = new Map();
  inputMap.set('file1', {
    nodes: [{nodeId: 1, done: true}]
  });
  inputMap.set('file2', {
    nodes: [
      {nodeId: 2, done: new Map()},
      {nodeId: 3, done: new Map()}
    ]
  });
  const {nodes} = inputMap.get('file2');
  nodes[0].done.set('geometry', false);
  nodes[0].done.set('texture', false);
  nodes[0].done.set('shared', true);
  nodes[1].done.set('geometry', true);
  nodes[1].done.set('texture', true);
  nodes[1].done.set('shared', false);
  inputMap.set('file3', {nodes: []});
  inputMap.set('file4', {nodes: [{nodeId: 4, done: new Map()}]});

  const expectedResult = {
    file1: {
      nodes: [{nodeId: 1, done: true}]
    },
    file2: {
      nodes: [
        {nodeId: 2, done: {geometry: false, texture: false, shared: true}},
        {nodeId: 3, done: {geometry: true, texture: true, shared: false}}
      ]
    },
    file3: {nodes: []},
    file4: {nodes: [{nodeId: 4, done: {}}]}
  };

  const result = dumpTilesToObject(inputMap);
  t.deepEqual(result, expectedResult);
  t.end();
});
