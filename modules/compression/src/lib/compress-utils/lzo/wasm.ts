// SPDX-License-Identifier: MIT
import {LZO_WASM_BASE64} from './wasm-data';

/** Decoder-only C ABI exports from the vendored compress-utils asset. */
type LzoWasmExports = WebAssembly.Exports & {
  /** Linear memory owned by the decoder. */
  memory: WebAssembly.Memory;
  /** Initializes the WASI reactor. */
  _initialize(): void;
  /** Allocates a caller-owned buffer. */
  cu_alloc(length: number): number;
  /** Releases a buffer. */
  cu_free(pointer: number): void;
  /** Decodes one block, writing the actual length to lengthPointer. */
  cu_decompress(
    algorithm: number,
    inputPointer: number,
    inputLength: number,
    outputPointer: number,
    lengthPointer: number
  ): number;
};

/** Creates a preloaded synchronous raw LZO1X decoder without external asset requests. */
export async function loadLzoWasm(): Promise<(input: Uint8Array, capacity: number) => Uint8Array> {
  const bytes = Uint8Array.from(atob(LZO_WASM_BASE64), character => character.charCodeAt(0));
  const {instance} = await WebAssembly.instantiate(bytes, {});
  const exports = instance.exports as LzoWasmExports;
  exports._initialize();
  return (input, capacity) => {
    const pointers: number[] = [];
    /** Allocates a checked buffer and records it for cleanup. */
    function allocate(length: number): number {
      const pointer = exports.cu_alloc(Math.max(length, 1));
      if (!pointer) throw new Error('lzo: allocation failed');
      pointers.push(pointer);
      return pointer;
    }
    try {
      const inputPointer = allocate(input.length);
      const outputPointer = allocate(capacity);
      const lengthPointer = allocate(4);
      new Uint8Array(exports.memory.buffer, inputPointer, input.length).set(input);
      new DataView(exports.memory.buffer).setUint32(lengthPointer, capacity, true);
      const status = exports.cu_decompress(
        11,
        inputPointer,
        input.length,
        outputPointer,
        lengthPointer
      );
      if (status !== 0) throw new Error(`lzo: decompression failed (status ${status})`);
      const length = new DataView(exports.memory.buffer).getUint32(lengthPointer, true);
      return new Uint8Array(exports.memory.buffer, outputPointer, length).slice();
    } finally {
      for (const pointer of pointers) exports.cu_free(pointer);
    }
  };
}
