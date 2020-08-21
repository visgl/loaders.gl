export default class BinaryChunkReader {
  constructor();

  write(arrayBuffer: ArrayBuffer);
  end();

  hasAvailableBytes(bytes: number): boolean;

  // Output type is nested array, e.g. [ [0, [1, 2]], ...]
  findBufferOffsets(bytes: number): any;

  /** Get the required number of bytes from the iterator */
  getDataView(bytes: number): DataView;

  skip(bytes: number);
  rewind(bytes: number);
}
