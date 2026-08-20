// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* tslint:disable */
/* eslint-disable */
import * as thrift from 'thrift';

export interface IGeometryTypeArgs {
  crs?: string;
}
export class GeometryType {
  public crs?: string;
  constructor(args?: IGeometryTypeArgs) {
    this.crs = args?.crs;
  }
  public write(output: thrift.TProtocol): void {
    output.writeStructBegin('GeometryType');
    if (this.crs != null) {
      output.writeFieldBegin('crs', thrift.Thrift.Type.STRING, 1);
      output.writeString(this.crs);
      output.writeFieldEnd();
    }
    output.writeFieldStop();
    output.writeStructEnd();
  }
  public static read(input: thrift.TProtocol): GeometryType {
    const args: IGeometryTypeArgs = {};
    input.readStructBegin();
    while (true) {
      const field = input.readFieldBegin();
      if (field.ftype === thrift.Thrift.Type.STOP) break;
      if (field.fid === 1 && field.ftype === thrift.Thrift.Type.STRING) {
        args.crs = input.readString();
      } else {
        input.skip(field.ftype);
      }
      input.readFieldEnd();
    }
    input.readStructEnd();
    return new GeometryType(args);
  }
}
