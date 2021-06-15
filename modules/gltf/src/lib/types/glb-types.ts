export type GLBBinChunk = {
  byteOffset: number;
  byteLength: number;
  arrayBuffer: ArrayBuffer;
};

export type GLB = {
  type: string;
  version: number; // Version 2 of binary glTF container format

  // Put less important stuff in a header, to avoid clutter
  header: {
    byteOffset: number; // Byte offset into the initial arrayBuffer
    byteLength: number;
    hasBinChunk: boolean;
  };

  // Per spec we must iterate over chunks, ignoring all except JSON and BIN
  json: {};
  binChunks: GLBBinChunk[];
};
