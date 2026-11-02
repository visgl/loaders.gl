import {expect, test} from 'vitest';
import {parseMaterialX} from '../../src/materialx/parse-materialx';

test('MaterialX preserves graph connections, values and custom nodes', () => {
  const document = parseMaterialX('<materialx version="1.39"><nodegraph name="graph"><custom name="node" type="color3"><input name="in" type="color3" value="0.1, 0.2, 0.3"/></custom><output name="out" type="color3" nodename="node"/></nodegraph></materialx>');
  expect(document.version).toBe('1.39');
  const graph = document.root.children[0];
  expect(graph.children.map(element => element.category)).toEqual(['custom', 'output']);
  expect(graph.children[0].children[0].attributes.value).toBe('0.1, 0.2, 0.3');
  expect(graph.children[1].attributes.nodename).toBe('node');
});

test.each([
  '<materialx version="1.39">',
  '<other version="1.39"/>',
  '<materialx/>',
  '<!DOCTYPE materialx><materialx version="1.39"/>'
])('MaterialX rejects invalid input %s', text => {
  expect(() => parseMaterialX(text)).toThrow('MaterialX:');
});
