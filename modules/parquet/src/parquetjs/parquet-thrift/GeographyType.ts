// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* tslint:disable */
/* eslint-disable */
import * as thrift from '../utils/thrift-runtime';
import type {EdgeInterpolationAlgorithm} from './EdgeInterpolationAlgorithm';

export interface IGeographyTypeArgs {
  crs?: string;
  algorithm?: EdgeInterpolationAlgorithm;
}
export class GeographyType {
  public crs?: string;
  public algorithm?: EdgeInterpolationAlgorithm;
  constructor(args?: IGeographyTypeArgs) {
    this.crs = args?.crs;
    this.algorithm = args?.algorithm;
  }
  public write(output: thrift.TProtocol): void {
    output.writeStructBegin('GeographyType');
    if (this.crs != null) {
      output.writeFieldBegin('crs', thrift.Thrift.Type.STRING, 1);
      output.writeString(this.crs);
      output.writeFieldEnd();
    }
    if (this.algorithm != null) {
      output.writeFieldBegin('algorithm', thrift.Thrift.Type.I32, 2);
      output.writeI32(this.algorithm);
      output.writeFieldEnd();
    }
    output.writeFieldStop();
    output.writeStructEnd();
  }
  public static read(input: thrift.TProtocol): GeographyType {
    const args: IGeographyTypeArgs = {};
    input.readStructBegin();
    while (true) {
      const field = input.readFieldBegin();
      if (field.ftype === thrift.Thrift.Type.STOP) break;
      if (field.fid === 1 && field.ftype === thrift.Thrift.Type.STRING) {
        args.crs = input.readString();
      } else if (field.fid === 2 && field.ftype === thrift.Thrift.Type.I32) {
        args.algorithm = input.readI32();
      } else {
        input.skip(field.ftype);
      }
      input.readFieldEnd();
    }
    input.readStructEnd();
    return new GeographyType(args);
  }
}
