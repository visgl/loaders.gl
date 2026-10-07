import {beforeAll, expect, test, vi} from 'vitest';
import {LzoDecompressor} from '../src/lzo-decompressor';
import {LzoDecompressor as LazyLzoDecompressor} from '../src';
import {loadLzoWasm} from '../src/lib/compress-utils/lzo/wasm';

/** Independently generated reference blocks, shared across immutable assertions. */
const fixtures: Uint8Array[] = [];
/** Recreates the deterministic LZO 2.10 oracle input. */
function createExpectedInput(): Uint8Array {
  const input = new Uint8Array(32768);
  let state = 42;
  for (let index = 0; index < input.length; index++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    input[index] = index < 18000 ? state >>> 24 : input[index - 18000];
    if (index < 5000) input[index] = 65;
  }
  return input;
}
const expected = createExpectedInput();
beforeAll(async () => {
  for (const name of ['1', '999']) {
    const response = await fetch(
      `/__loaders_gl_test_fixtures__/modules/compression/test/fixtures/lzo/${name}.bin`
    );
    fixtures.push(new Uint8Array(await response.arrayBuffer()));
  }
});
test.each([true, false])('LZO1X oracle blocks decode with useWasm=%s', async useWasm => {
  const decoder = new LzoDecompressor({useWasm});
  await decoder.preload();
  for (const fixture of fixtures) {
    expect(
      new Uint8Array(await decoder.decompress(fixture.slice().buffer, expected.length + 100))
    ).toEqual(expected);
    expect(() => decoder.decompressSync(fixture.slice().buffer, expected.length - 1)).toThrow();
  }
});
test('LZO validates size, offsets, end markers and empty output', () => {
  const decoder = new LzoDecompressor({useWasm: false, maxOutputSize: 100});
  expect(new Uint8Array(decoder.decompressSync(new Uint8Array([17, 0, 0]).buffer, 0))).toEqual(
    new Uint8Array()
  );
  for (const bytes of [[], [17], [17, 4, 0], [17, 0, 0, 0], [0, 0, 0]]) {
    expect(() => decoder.decompressSync(new Uint8Array(bytes).buffer, 100)).toThrow();
  }
  for (const size of [undefined, -1, 1.5, 101, Infinity])
    expect(() => decoder.decompressSync(new ArrayBuffer(0), size)).toThrow(RangeError);
  expect(() => new LzoDecompressor({maxOutputSize: -1})).toThrow(RangeError);
});
test('LZO falls back when WASM compilation is blocked and supports lazy sync after preload', async () => {
  const instantiate = vi.spyOn(WebAssembly, 'instantiate').mockRejectedValue(new Error('blocked'));
  try {
    const decoder = new LazyLzoDecompressor();
    await decoder.preload();
    expect(
      new Uint8Array(decoder.decompressSync(fixtures[0].slice().buffer, expected.length))
    ).toEqual(expected);
  } finally {
    instantiate.mockRestore();
  }
});

test('Vendored WASM decodes independent fixtures without fallback', async () => {
  const decode = await loadLzoWasm();
  for (const fixture of fixtures) {
    expect(decode(fixture, expected.length)).toEqual(expected);
    expect(() => decode(fixture, expected.length - 1)).toThrow();
  }
});
