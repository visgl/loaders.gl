// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */
import * as thrift from '../utils/thrift-runtime';
import {BoundingBox} from './BoundingBox';

/** Constructor arguments for Parquet geospatial column statistics. */
export interface IGeospatialStatisticsArgs {
  bbox?: BoundingBox;
  geospatial_types?: number[];
}

/** Parquet geospatial column statistics stored on a column chunk. */
export class GeospatialStatistics {
  public bbox?: BoundingBox;
  public geospatial_types?: number[];

  constructor(args: IGeospatialStatisticsArgs = {}) {
    this.bbox = args.bbox;
    this.geospatial_types = args.geospatial_types;
  }

  /** Writes these geospatial statistics to a Thrift protocol. */
  public write(output: thrift.TProtocol): void {
    output.writeStructBegin('GeospatialStatistics');
    if (this.bbox) {
      output.writeFieldBegin('bbox', thrift.Thrift.Type.STRUCT, 1);
      this.bbox.write(output);
      output.writeFieldEnd();
    }
    if (this.geospatial_types) {
      output.writeFieldBegin('geospatial_types', thrift.Thrift.Type.LIST, 2);
      output.writeListBegin(thrift.Thrift.Type.I32, this.geospatial_types.length);
      for (const geospatialType of this.geospatial_types) output.writeI32(geospatialType);
      output.writeListEnd();
      output.writeFieldEnd();
    }
    output.writeFieldStop();
    output.writeStructEnd();
  }

  /** Reads geospatial statistics from a Thrift protocol. */
  public static read(input: thrift.TProtocol): GeospatialStatistics {
    input.readStructBegin();
    const args: IGeospatialStatisticsArgs = {};
    while (true) {
      const field = input.readFieldBegin();
      if (field.ftype === thrift.Thrift.Type.STOP) break;
      if (field.fid === 1 && field.ftype === thrift.Thrift.Type.STRUCT) {
        args.bbox = BoundingBox.read(input);
      } else if (field.fid === 2 && field.ftype === thrift.Thrift.Type.LIST) {
        const list = input.readListBegin();
        args.geospatial_types = [];
        for (let index = 0; index < list.size; index++) {
          args.geospatial_types.push(input.readI32());
        }
        input.readListEnd();
      } else {
        input.skip(field.ftype);
      }
      input.readFieldEnd();
    }
    input.readStructEnd();
    return new GeospatialStatistics(args);
  }
}
