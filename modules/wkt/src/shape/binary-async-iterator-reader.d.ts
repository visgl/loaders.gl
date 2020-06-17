
export default class BinaryAsyncIteratorReader {
  constructor(asyncIterator: AsyncIterator<ArrayBuffer>);

  // Get the required number of bytes from the iterator
  getDataView(bytes: number): Promise<DataView>;

  // PRIVATE

  _getBytesFromBuffer(bytes: number, arrayBuffer: ArrayBuffer, offset: number);

  _getNextChunkFromIterator(): Promise<boolean>;

  _getArrayBuffer(bytes: number): ArrayBuffer;
}
