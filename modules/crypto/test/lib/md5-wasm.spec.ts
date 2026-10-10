import {afterEach, expect, test, vi} from 'vitest';
import md5WASM from '../../src/lib/algorithms/md5-wasm';
const textEncoder = new TextEncoder();
test('md5WASM#hash supports ArrayBuffer and Uint8Array inputs', async () => {
  const input = textEncoder.encode('array md5 input');
  const arrayBufferInput = input.buffer.slice(0);
  const hashFromTypedArray = await md5WASM(input);
  const hashFromArrayBuffer = await md5WASM(arrayBufferInput);
  expect(hashFromTypedArray, 'hash matches expected value').toBe(
    'debde7239b0aafd48eccd2d048e80c3a'
  );
  expect(hashFromArrayBuffer, 'ArrayBuffer input hashes match').toBe(hashFromTypedArray);
});
test('md5WASM#hash works when Buffer is undefined', async () => {
  const originalBuffer = globalThis.Buffer;
  // @ts-ignore Buffer is intentionally overridden for this test
  globalThis.Buffer = undefined;
  try {
    const input = textEncoder.encode('bufferless md5 input');
    const hash = await md5WASM(input);
    expect(hash, 'hash generated without Buffer present').toBe('c2cccb15893fdb77c499a18ee750c51b');
  } finally {
    if (typeof originalBuffer === 'undefined') {
      delete globalThis.Buffer;
    } else {
      globalThis.Buffer = originalBuffer;
    }
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('md5WASM rejects invalid input instead of losing an early error', async () => {
  await expect(md5WASM(null)).rejects.toThrow(TypeError);
});

test.each(['instantiate', 'hash'] as const)(
  'md5WASM propagates an asynchronous %s failure',
  async (failureStage) => {
    const initializationError = new Error('WASM failure');
    // Just above the WASM threshold; no large fixture or real WASM memory is needed.
    const input = new Uint8Array(1048577);
    vi.spyOn(WebAssembly, 'Memory').mockImplementation(function createMemory() {
      return {buffer: new ArrayBuffer(input.length + 131)} as WebAssembly.Memory;
    });
    const instantiate = vi.spyOn(WebAssembly, 'instantiate');
    if (failureStage === 'instantiate') {
      instantiate.mockRejectedValue(initializationError);
    } else {
      instantiate.mockResolvedValue({
        instance: {
          exports: {
            get getA() {
              throw initializationError;
            }
          }
        }
      } as unknown as WebAssembly.WebAssemblyInstantiatedSource);
    }
    await expect(md5WASM(input)).rejects.toBe(initializationError);
  }
);

test('md5WASM hashes a representative WASM input correctly', async () => {
  await expect(md5WASM(new Uint8Array(1048577))).resolves.toBe('9587b149ff392ca6887a05d921e73e72');
});
