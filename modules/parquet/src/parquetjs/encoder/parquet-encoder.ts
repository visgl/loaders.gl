// Forked from https://github.com/kbajalc/parquets under MIT license (Copyright (c) 2017 ironSource Ltd.)
/* eslint-disable camelcase */
import {ParquetBuffer} from '../schema/declare';
import {ParquetSchema} from '../schema/schema';
import {shredRecord} from '../schema/shred';
import type {ParquetEncoderOptions} from './parquet-envelope-writer';
import {ParquetEnvelopeWriter} from './parquet-envelope-writer';
import type {WritableFile} from '@loaders.gl/loader-utils';

const PARQUET_DEFAULT_ROW_GROUP_SIZE = 4096;

/**

/**
 * Write a parquet file to an output stream. The ParquetEncoder will perform
 * buffering/batching for performance, so close() must be called after all rows
 * are written.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class ParquetEncoder<T> {
  public schema: ParquetSchema;
  public envelopeWriter: ParquetEnvelopeWriter;
  // @ts-ignore Row buffer typings...
  public rowBuffer: ParquetBuffer = {rowCount: 0};
  public rowGroupSize: number;
  public closed: boolean = false;
  public userMetadata: Record<string, string> = {};

  /**
   * Create a new buffered parquet writer for a given envelope writer
   */
  constructor(schema: ParquetSchema, file: WritableFile, options: ParquetEncoderOptions = {}) {
    this.schema = schema;
    this.envelopeWriter = new ParquetEnvelopeWriter(schema, file, 0, options);
    this.rowGroupSize = options.rowGroupSize || PARQUET_DEFAULT_ROW_GROUP_SIZE;

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.writeHeader();
  }

  async writeHeader(): Promise<void> {
    // TODO - better not mess with promises in the constructor
    try {
      await this.envelopeWriter.writeHeader();
    } catch (err) {
      await this.envelopeWriter.close();
      throw err;
    }
  }

  /**
   * Append a single row to the parquet file. Rows are buffered in memory until
   * rowGroupSize rows are in the buffer or close() is called
   */
  async appendRow<T>(row: T): Promise<void> {
    if (this.closed) {
      throw new Error('writer was closed');
    }
    shredRecord(this.schema, row, this.rowBuffer);
    if (this.rowBuffer.rowCount >= this.rowGroupSize) {
      // @ts-ignore
      this.rowBuffer = {rowCount: 0};
    }
  }

  /**
   * Finish writing the parquet file and commit the footer to disk. This method
   * MUST be called after you are finished adding rows. You must not call this
   * method twice on the same object or add any rows after the close() method has
   * been called
   */
  async close(callback?: () => void): Promise<void> {
    if (this.closed) {
      throw new Error('writer was closed');
    }

    this.closed = true;

    if (this.rowBuffer.rowCount > 0 || this.rowBuffer.rowCount >= this.rowGroupSize) {
      // @ts-ignore
      this.rowBuffer = {rowCount: 0};
    }

    await this.envelopeWriter.writeFooter(this.userMetadata);
    await this.envelopeWriter.close();
    // this.envelopeWriter = null;

    if (callback) {
      callback();
    }
  }

  /**
   * Add key<>value metadata to the file
   */
  setMetadata(key: string, value: string): void {
    // TODO: value to be any, obj -> JSON
    this.userMetadata[String(key)] = String(value);
  }

  /**
   * Set the parquet row group size. This values controls the maximum number
   * of rows that are buffered in memory at any given time as well as the number
   * of rows that are co-located on disk. A higher value is generally better for
   * read-time I/O performance at the tradeoff of write-time memory usage.
   */
  setRowGroupSize(cnt: number): void {
    this.rowGroupSize = cnt;
  }

  /**
   * Set the parquet data page size. The data page size controls the maximum
   * number of column values that are written to disk as a consecutive array
   */
  setPageSize(cnt: number): void {
    this.envelopeWriter.setPageSize(cnt);
  }
}
