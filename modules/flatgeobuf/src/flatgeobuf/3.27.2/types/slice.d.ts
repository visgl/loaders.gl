declare module 'slice-source' {
  function slice(source: ReadableStream | SliceSource): SliceSource;

  interface SliceChunk {
    value: Uint8Array;
    done: boolean;
  }

  interface SliceSource {
    slice(length: number): Promise<Uint8Array>;
    read(): Promise<SliceChunk>;
    cancel(): Promise<void>;
  }

  export = slice;
}
