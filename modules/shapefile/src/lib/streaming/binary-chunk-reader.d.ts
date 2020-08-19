export default class BinaryChunkReader {
  constructor();

  write(arrayBuffer: ArrayBuffer);
  end();

  hasAvailableBytes(bytes: number): boolean;

  /** Get the required number of bytes from the iterator */
  getDataView(bytes?: number): DataView | null;

  skip(bytes: number);
  rewind(bytes: number);
}
