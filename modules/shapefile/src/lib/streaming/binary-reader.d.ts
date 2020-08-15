
export default class BinaryReader {
  constructor(arrayBuffer: ArrayBuffer);

  hasAvailableBytes(bytes: number): boolean;

  /** Get the required number of bytes from the iterator */
  getDataView(bytes?: number): DataView;

  skip(bytes: number);
  rewind(bytes: number);
}
