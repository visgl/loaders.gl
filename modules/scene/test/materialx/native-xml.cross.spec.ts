import {expect, test} from 'vitest';
import {parseMaterialX} from '../../src/materialx/parse-materialx';

test('native MaterialX parser preserves interleaved categories and string values', () => {
  const result = parseMaterialX('<materialx version="1.39"><input name="first" value="01"/><output name="middle"/><input name="last" value="a &amp; b"/></materialx>');
  expect(result.root.children.map(child => child.category)).toEqual(['input', 'output', 'input']);
  expect(result.root.children[0].attributes.value).toBe('01');
  expect(result.root.children[2].attributes.value).toBe('a & b');
});
