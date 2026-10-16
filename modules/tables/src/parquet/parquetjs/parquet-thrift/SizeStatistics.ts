// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {CompactInt64 as Int64} from '../utils/uint8-array-compact-protocol';
import * as thrift from '../utils/thrift-runtime';

/** Constructor arguments for Parquet size statistics. */
export interface ISizeStatisticsArgs {
  unencoded_byte_array_data_bytes?: number | Int64;
  repetition_level_histogram?: Array<number | Int64>;
  definition_level_histogram?: Array<number | Int64>;
}

/**
 * Optional Parquet metadata used to estimate decoded memory and nested values.
 *
 * This is intentionally a faithful representation of the Parquet thrift
 * structure. Consumers should treat absent histograms as unknown rather than
 * as zero counts.
 */
export class SizeStatistics {
  public unencoded_byte_array_data_bytes?: Int64;
  public repetition_level_histogram?: Array<Int64>;
  public definition_level_histogram?: Array<Int64>;

  constructor(args: ISizeStatisticsArgs = {}) {
    this.unencoded_byte_array_data_bytes = toInt64(args.unencoded_byte_array_data_bytes);
    this.repetition_level_histogram = toInt64List(args.repetition_level_histogram);
    this.definition_level_histogram = toInt64List(args.definition_level_histogram);
  }

  /** Writes size statistics to a Thrift protocol. */
  public write(output: thrift.TProtocol): void {
    output.writeStructBegin('SizeStatistics');
    if (this.unencoded_byte_array_data_bytes !== undefined) {
      output.writeFieldBegin('unencoded_byte_array_data_bytes', thrift.Thrift.Type.I64, 1);
      output.writeI64(this.unencoded_byte_array_data_bytes);
      output.writeFieldEnd();
    }
    writeInt64List(output, 'repetition_level_histogram', 2, this.repetition_level_histogram);
    writeInt64List(output, 'definition_level_histogram', 3, this.definition_level_histogram);
    output.writeFieldStop();
    output.writeStructEnd();
  }

  /** Reads size statistics from a Thrift protocol. */
  public static read(input: thrift.TProtocol): SizeStatistics {
    input.readStructBegin();
    const args: ISizeStatisticsArgs = {};
    while (true) {
      const field = input.readFieldBegin();
      if (field.ftype === thrift.Thrift.Type.STOP) break;
      if (field.fid === 1 && field.ftype === thrift.Thrift.Type.I64) {
        args.unencoded_byte_array_data_bytes = input.readI64();
      } else if (field.fid === 2 && field.ftype === thrift.Thrift.Type.LIST) {
        args.repetition_level_histogram = readInt64List(input);
      } else if (field.fid === 3 && field.ftype === thrift.Thrift.Type.LIST) {
        args.definition_level_histogram = readInt64List(input);
      } else {
        input.skip(field.ftype);
      }
      input.readFieldEnd();
    }
    input.readStructEnd();
    return new SizeStatistics(args);
  }
}

function toInt64(value: number | Int64 | undefined): Int64 | undefined {
  return value === undefined ? undefined : typeof value === 'number' ? new Int64(value) : value;
}

function toInt64List(values: Array<number | Int64> | undefined): Array<Int64> | undefined {
  return values?.map(value => toInt64(value)!);
}

function writeInt64List(
  output: thrift.TProtocol,
  name: string,
  fieldId: number,
  values: Array<Int64> | undefined
): void {
  if (!values) return;
  output.writeFieldBegin(name, thrift.Thrift.Type.LIST, fieldId);
  output.writeListBegin(thrift.Thrift.Type.I64, values.length);
  for (const value of values) output.writeI64(value);
  output.writeListEnd();
  output.writeFieldEnd();
}

function readInt64List(input: thrift.TProtocol): Array<Int64> {
  const list = input.readListBegin();
  const values: Array<Int64> = [];
  for (let index = 0; index < list.size; index++) values.push(input.readI64());
  input.readListEnd();
  return values;
}
