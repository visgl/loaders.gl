import {expect, test} from 'vitest';
import {parseMaterialX} from '../../src/materialx/parse-materialx';

test('native MaterialX parser preserves interleaved categories and string values', () => {
  const result = parseMaterialX(
    '<materialx version="1.39"><input name="first" value="01"/><output name="middle"/><input name="last" value="a &amp; b"/></materialx>'
  );
  expect(result.root.children.map(child => child.category)).toEqual(['input', 'output', 'input']);
  expect(result.root.children[0].attributes.value).toBe('01');
  expect(result.root.children[2].attributes.value).toBe('a & b');
});

test('MaterialX loader preloads and accepts UTF-8 buffers and text', async () => {
  const {MaterialXLoader} = await import('../../src/materialx-loader-types');
  expect('parse' in MaterialXLoader).toBe(false);
  const loader = await MaterialXLoader.preload();
  const text = '<materialx version="1.39"><nodegraph name="café"/></materialx>';
  const buffer = new TextEncoder().encode(text).buffer;
  const expected = parseMaterialX(text);
  expect(await loader.parse(buffer)).toEqual(expected);
  expect(loader.parseSync(buffer)).toEqual(expected);
  expect(await loader.parseText(text)).toEqual(expected);
  expect(loader.parseTextSync(text)).toEqual(expected);
});
