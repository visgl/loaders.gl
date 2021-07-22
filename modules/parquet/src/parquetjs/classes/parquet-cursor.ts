// Forked from https://github.com/kbajalc/parquets under MIT license (Copyright (c) 2017 ironSource Ltd.)
import {FileMetaData} from '../parquet-thrift';
import {ParquetEnvelopeReader} from './parquet-envelope-reader';
import {ParquetSchema} from '../schema/schema';
import {ParquetRecord} from '../schema/declare';
import * as Shred from '../schema/shred';

/**
 * A parquet cursor is used to retrieve rows from a parquet file in order
 */
export class ParquetCursor<T> implements AsyncIterable<T> {
  public metadata: FileMetaData;
  public envelopeReader: ParquetEnvelopeReader;
  public schema: ParquetSchema;
  public columnList: string[][];
  public rowGroup: ParquetRecord[];
  public rowGroupIndex: number;

  /**
   * Create a new parquet reader from the file metadata and an envelope reader.
   * It is usually not recommended to call this constructor directly except for
   * advanced and internal use cases. Consider using getCursor() on the
   * ParquetReader instead
   */
  constructor(
    metadata: FileMetaData,
    envelopeReader: ParquetEnvelopeReader,
    schema: ParquetSchema,
    columnList: string[][]
  ) {
    this.metadata = metadata;
    this.envelopeReader = envelopeReader;
    this.schema = schema;
    this.columnList = columnList;
    this.rowGroup = [];
    this.rowGroupIndex = 0;
  }

  /**
   * Retrieve the next row from the cursor. Returns a row or NULL if the end
   * of the file was reached
   */
  async next<T = any>(): Promise<T> {
    if (this.rowGroup.length === 0) {
      if (this.rowGroupIndex >= this.metadata.row_groups.length) {
        // @ts-ignore
        return null;
      }
      const rowBuffer = await this.envelopeReader.readRowGroup(
        this.schema,
        this.metadata.row_groups[this.rowGroupIndex],
        this.columnList
      );
      this.rowGroup = Shred.materializeRecords(this.schema, rowBuffer);
      this.rowGroupIndex++;
    }
    return this.rowGroup.shift() as any;
  }

  /**
   * Rewind the cursor the the beginning of the file
   */
  rewind(): void {
    this.rowGroup = [];
    this.rowGroupIndex = 0;
  }

  /**
   * Implement AsyncIterable
   */
  // tslint:disable-next-line:function-name
  [Symbol.asyncIterator](): AsyncIterator<T> {
    let done = false;
    return {
      next: async () => {
        if (done) {
          return {done, value: null};
        }
        const value = await this.next();
        if (value === null) {
          return {done: true, value};
        }
        return {done: false, value};
      },
      return: async () => {
        done = true;
        return {done, value: null};
      },
      throw: async () => {
        done = true;
        return {done: true, value: null};
      }
    };
  }
}
