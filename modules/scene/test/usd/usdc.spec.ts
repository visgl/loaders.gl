// SPDX-License-Identifier: MIT
import {expect, test} from 'vitest';
import {USDLoaderWithParser} from '../../src/usd-loader';
import {parseUSDA} from '../../src/usd/lib/parse-usda';
import {parseUSDC} from '../../src/usd/lib/parse-usdc';

/** Loads a tiny checked-in official OpenUSD fixture through Vite. */
async function readFixture(name: string): Promise<ArrayBuffer> {
  return (await fetch(new URL(`./data/${name}`, import.meta.url))).arrayBuffer();
}

test('USDC official crate matches equivalent USDA prim hierarchy', async () => {
  const [binary, ascii] = await Promise.all([
    readFixture('sphere.usdc'),
    readFixture('sphere.usda')
  ]);
  const stage = await USDLoaderWithParser.parse(binary, {usd: {compose: false}});
  const expected = parseUSDA(new TextDecoder().decode(ascii));
  expect(stage.format).toBe('usdc');
  expect(stage.rootPrims).toEqual(expected.rootPrims);
});

test('USDC official crate preserves int and float default attributes', async () => {
  const stage = parseUSDC(await readFixture('attributes.usdc'));
  expect(stage.rootPrims[0].name).toBe('a');
  expect(stage.rootPrims[0].attributes.x).toMatchObject({type: 'int', value: 3});
  expect(stage.rootPrims[0].attributes.y).toMatchObject({type: 'float', value: 5.5});
});

test('USDC rejects unsupported versions, truncated sections and invalid offsets', async () => {
  const source = await readFixture('sphere.usdc');
  const version = source.slice(0);
  new Uint8Array(version)[9] = 9;
  expect(() => parseUSDC(version)).toThrow(/version/);
  expect(() => parseUSDC(source.slice(0, 100))).toThrow(/section/);
  const pointer = source.slice(0);
  new DataView(pointer).setBigUint64(16, 999999n, true);
  expect(() => parseUSDC(pointer)).toThrow(/section table/);
});

test('USDC mesh preserves tuple boundaries, signed defaults, assets and relationships', async () => {
  const stage = parseUSDC(await readFixture('triangle.usdc'));
  expect(stage.metadata).toMatchObject({defaultPrim: 'World', upAxis: 'Z', metersPerUnit: 0.01});
  const mesh = stage.rootPrims[0].children[0];
  expect(mesh.type).toBe('Mesh');
  expect(mesh.attributes.points.value).toEqual([
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0]
  ]);
  expect(mesh.attributes.faceVertexIndices.value).toEqual([0, 1, 2]);
  expect(mesh.attributes.negative.value).toBe(-7);
  expect(mesh.attributes.texture.value).toEqual({assetPath: 'texture.png'});
  expect(mesh.attributes.target.value).toEqual([{path: '/World'}]);
});

test('USDC retains authored time samples as data without animation objects', async () => {
  const stage = parseUSDC(await readFixture('triangle.usdc'));
  const attribute = stage.rootPrims[0].children[0].attributes.weight;
  expect(attribute.value).toBeNull();
  expect(attribute.metadata.timeSamples).toEqual({times: [0, 1], values: [1, 2]});
});

test('USDC section names stop at the first null rather than scanning padding', async () => {
  const source = await readFixture('sphere.usdc');
  const view = new DataView(source);
  const table = Number(view.getBigUint64(16, true));
  const entry = table + 8;
  const name = new Uint8Array(source, entry, 16);
  const terminator = name.indexOf(0);
  expect(terminator).toBeLessThan(15);
  name[terminator + 1] = 10;
  expect(parseUSDC(source).rootPrims[0].name).toBe('Sphere');
});

test.each([
  ['too many sections', 'count-limit', /table length/],
  ['truncated table', 'truncated-table', /table length/],
  ['duplicate section names', 'duplicate', /duplicate section/],
  ['section before bootstrap', 'before-bootstrap', /out of bounds/],
  ['section outside file', 'outside-file', /out of bounds/],
  ['missing required section', 'missing', /missing required/],
  ['unterminated bounded name', 'unterminated', /missing required/]
] as const)('USDC rejects %s before decoding payloads', async (_name, mutation, error) => {
  const source = await readFixture('sphere.usdc');
  const view = new DataView(source);
  const bytes = new Uint8Array(source);
  const table = Number(view.getBigUint64(16, true));
  const entry = table + 8;
  switch (mutation) {
    case 'count-limit':
      view.setBigUint64(table, 17n, true);
      break;
    case 'truncated-table':
      view.setBigUint64(table, view.getBigUint64(table, true) + 1n, true);
      break;
    case 'duplicate':
      bytes.set(bytes.slice(entry, entry + 16), entry + 32);
      break;
    case 'before-bootstrap':
      view.setBigUint64(entry + 16, 0n, true);
      break;
    case 'outside-file':
      view.setBigUint64(entry + 24, BigInt(source.byteLength), true);
      break;
    case 'missing':
      bytes.fill(0, entry, entry + 16);
      bytes.set(new TextEncoder().encode('UNKNOWN'), entry);
      break;
    case 'unterminated':
      bytes.fill(65, entry, entry + 16);
      break;
  }
  expect(() => parseUSDC(source)).toThrow(error);
});
