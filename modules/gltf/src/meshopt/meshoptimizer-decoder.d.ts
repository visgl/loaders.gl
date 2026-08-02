/**
 * Compatibility declaration for meshoptimizer's decoder-only export.
 *
 * The package publishes its own declarations through package exports, but loaders.gl's current
 * TypeScript `node` module resolution does not inspect that exports map. This declaration preserves
 * the decoder-only runtime import so applications do not load the encoder and processing modules.
 */
declare module 'meshoptimizer/decoder' {
  /** Maintained WebAssembly meshopt decoder. */
  export const MeshoptDecoder: {
    /** Whether WebAssembly decoding is available in this runtime. */
    supported: boolean;
    /** Resolves after the decoder WebAssembly module is initialized. */
    ready: Promise<void>;
    /** Decodes an attribute buffer and optionally applies a post-decode filter. */
    decodeVertexBuffer: (
      target: Uint8Array,
      count: number,
      byteStride: number,
      source: Uint8Array,
      filter?: string
    ) => void;
    /** Decodes a triangle index buffer. */
    decodeIndexBuffer: (
      target: Uint8Array,
      count: number,
      byteStride: number,
      source: Uint8Array
    ) => void;
    /** Decodes an arbitrary index sequence. */
    decodeIndexSequence: (
      target: Uint8Array,
      count: number,
      byteStride: number,
      source: Uint8Array
    ) => void;
    /** Dispatches decoding from a glTF meshopt compression mode and optional filter. */
    decodeGltfBuffer: (
      target: Uint8Array,
      count: number,
      byteStride: number,
      source: Uint8Array,
      mode: string,
      filter?: string
    ) => void;
  };
}
