/**
 * Compatibility declaration for meshoptimizer's decoder-only export.
 *
 * The package publishes its own declarations through package exports, but loaders.gl's current
 * TypeScript `node` module resolution does not inspect that exports map. This declaration preserves
 * the decoder-only runtime import so applications do not load the encoder and processing modules.
 */
declare module 'meshoptimizer/decoder' {
  /**
   * Decoder-only surface used by loaders.gl from the maintained `meshoptimizer` package.
   *
   * Each decode method writes exactly `count * byteStride` bytes into caller-provided storage and
   * throws when the source bitstream is malformed.
   */
  export const MeshoptDecoder: {
    /** Whether WebAssembly decoding can be initialized in the current runtime. */
    supported: boolean;
    /** Resolves after the decoder WebAssembly module is initialized. */
    ready: Promise<void>;
    /**
     * Decodes a fixed-stride attribute stream and optionally applies a post-decode filter.
     *
     * @param target Destination storage for at least `count * byteStride` bytes.
     * @param count Number of fixed-stride elements to decode.
     * @param byteStride Number of bytes in each decoded element.
     * @param source Complete compressed attribute bitstream.
     * @param filter Optional meshopt post-decode filter name.
     */
    decodeVertexBuffer: (
      target: Uint8Array,
      count: number,
      byteStride: number,
      source: Uint8Array,
      filter?: string
    ) => void;
    /**
     * Decodes a triangle-list index stream.
     *
     * @param target Destination storage for at least `count * byteStride` bytes.
     * @param count Number of indices to decode.
     * @param byteStride Number of bytes in each decoded index.
     * @param source Complete compressed triangle bitstream.
     */
    decodeIndexBuffer: (
      target: Uint8Array,
      count: number,
      byteStride: number,
      source: Uint8Array
    ) => void;
    /**
     * Decodes an arbitrary index sequence.
     *
     * @param target Destination storage for at least `count * byteStride` bytes.
     * @param count Number of indices to decode.
     * @param byteStride Number of bytes in each decoded index.
     * @param source Complete compressed index-sequence bitstream.
     */
    decodeIndexSequence: (
      target: Uint8Array,
      count: number,
      byteStride: number,
      source: Uint8Array
    ) => void;
    /**
     * Dispatches decoding using a glTF meshopt compression mode and optional filter.
     *
     * @param target Destination storage for at least `count * byteStride` bytes.
     * @param count Number of fixed-stride elements to decode.
     * @param byteStride Number of bytes in each decoded element.
     * @param source Complete compressed bitstream.
     * @param mode glTF meshopt compression mode.
     * @param filter Optional meshopt post-decode filter name.
     */
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
