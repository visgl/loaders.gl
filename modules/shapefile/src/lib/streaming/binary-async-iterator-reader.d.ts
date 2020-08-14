
export default class BinaryAsyncIteratorReader {
  constructor(asyncIterator: AsyncIterator<ArrayBuffer>);

  /** Get the required number of bytes from the iterator */
  getDataView(bytes: number): Promise<DataView>;
}
