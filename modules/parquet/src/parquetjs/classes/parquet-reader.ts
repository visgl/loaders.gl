// Forked from https://github.com/kbajalc/parquets under MIT license (Copyright (c) 2017 ironSource Ltd.)
import {ParquetEnvelopeReader} from './parquet-envelope-reader';
import {FileMetaData} from '../parquet-thrift';
import {ParquetSchema} from '../schema/schema';
import {ParquetCursor} from './parquet-cursor';
import {PARQUET_VERSION} from '../../constants';
import {decodeSchema} from '../utils/decode-utils';

/**
 * A parquet reader allows retrieving the rows from a parquet file in order.
 * The basic usage is to create a reader and then retrieve a cursor/iterator
 * which allows you to consume row after row until all rows have been read. It is
 * important that you call close() after you are finished reading the file to
 * avoid leaking file descriptors.
 */
export class ParquetReader<T> implements AsyncIterable<T> {
  /**
   * return a new parquet reader initialized with a read function
   */
  static async openBlob<T>(blob: Blob): Promise<ParquetReader<T>> {
    const readFn = async (start: number, length: number) => {
      const arrayBuffer = await blob.slice(start, start + length).arrayBuffer();
      return Buffer.from(arrayBuffer);
    };
    const closeFn = async () => {};
    const size = blob.size;
    const envelopeReader = new ParquetEnvelopeReader(readFn, closeFn, size);
    try {
      await envelopeReader.readHeader();
      const metadata = await envelopeReader.readFooter();
      return new ParquetReader(metadata, envelopeReader);
    } catch (err) {
      await envelopeReader.close();
      throw err;
    }
  }

  /**
   * return a new parquet reader initialized with a read function
   */
  static async openArrayBuffer<T>(arrayBuffer: ArrayBuffer): Promise<ParquetReader<T>> {
    const readFn = async (start: number, length: number) => Buffer.from(arrayBuffer, start, length);
    const closeFn = async () => {};
    const size = arrayBuffer.byteLength;
    const envelopeReader = new ParquetEnvelopeReader(readFn, closeFn, size);
    try {
      await envelopeReader.readHeader();
      const metadata = await envelopeReader.readFooter();
      return new ParquetReader(metadata, envelopeReader);
    } catch (err) {
      await envelopeReader.close();
      throw err;
    }
  }

  /**
   * Open the parquet file pointed to by the specified path and return a new
   * parquet reader
   */
  static async openFile<T>(filePath: string): Promise<ParquetReader<T>> {
    const envelopeReader = await ParquetEnvelopeReader.openFile(filePath);
    try {
      await envelopeReader.readHeader();
      const metadata = await envelopeReader.readFooter();
      return new ParquetReader<T>(metadata, envelopeReader);
    } catch (err) {
      await envelopeReader.close();
      throw err;
    }
  }

  static async openBuffer<T>(buffer: Buffer): Promise<ParquetReader<T>> {
    const envelopeReader = await ParquetEnvelopeReader.openBuffer(buffer);
    try {
      await envelopeReader.readHeader();
      const metadata = await envelopeReader.readFooter();
      return new ParquetReader<T>(metadata, envelopeReader);
    } catch (err) {
      await envelopeReader.close();
      throw err;
    }
  }

  public metadata: FileMetaData;
  public envelopeReader: ParquetEnvelopeReader;
  public schema: ParquetSchema;

  /**
   * Create a new parquet reader from the file metadata and an envelope reader.
   * It is not recommended to call this constructor directly except for advanced
   * and internal use cases. Consider using one of the open{File,Buffer} methods
   * instead
   */
  constructor(metadata: FileMetaData, envelopeReader: ParquetEnvelopeReader) {
    if (metadata.version !== PARQUET_VERSION) {
      throw new Error('invalid parquet version');
    }

    this.metadata = metadata;
    this.envelopeReader = envelopeReader;
    const root = this.metadata.schema[0];
    const {schema} = decodeSchema(this.metadata.schema, 1, root.num_children!);
    this.schema = new ParquetSchema(schema);
  }

  /**
   * Close this parquet reader. You MUST call this method once you're finished
   * reading rows
   */
  async close(): Promise<void> {
    await this.envelopeReader.close();
    // this.envelopeReader = null;
    // this.metadata = null;
  }

  /**
   * Return a cursor to the file. You may open more than one cursor and use
   * them concurrently. All cursors become invalid once close() is called on
   * the reader object.
   *
   * The required_columns parameter controls which columns are actually read
   * from disk. An empty array or no value implies all columns. A list of column
   * names means that only those columns should be loaded from disk.
   */
  getCursor(): ParquetCursor<T>;
  // @ts-ignore
  getCursor<K extends keyof T>(columnList: (K | K[])[]): ParquetCursor<Pick<T, K>>;
  getCursor(columnList: (string | string[])[]): ParquetCursor<Partial<T>>;
  getCursor(columnList?: (string | string[])[]): ParquetCursor<Partial<T>> {
    if (!columnList) {
      // tslint:disable-next-line:no-parameter-reassignment
      columnList = [];
    }

    // tslint:disable-next-line:no-parameter-reassignment
    columnList = columnList.map((x) => (Array.isArray(x) ? x : [x]));

    return new ParquetCursor<T>(
      this.metadata,
      this.envelopeReader,
      this.schema,
      columnList as string[][]
    );
  }

  /**
   * Return the number of rows in this file. Note that the number of rows is
   * not neccessarily equal to the number of rows in each column.
   */
  getRowCount(): number {
    return Number(this.metadata.num_rows);
  }

  /**
   * Returns the ParquetSchema for this file
   */
  getSchema(): ParquetSchema {
    return this.schema;
  }

  /**
   * Returns the user (key/value) metadata for this file
   */
  getMetadata(): Record<string, string> {
    const md: Record<string, string> = {};
    for (const kv of this.metadata.key_value_metadata!) {
      md[kv.key] = kv.value!;
    }
    return md;
  }

  /**
   * Implement AsyncIterable
   */
  // tslint:disable-next-line:function-name
  [Symbol.asyncIterator](): AsyncIterator<T> {
    return this.getCursor()[Symbol.asyncIterator]();
  }
}
