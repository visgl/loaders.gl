// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* tslint:disable */
/* eslint-disable */
import * as thrift from 'thrift';

export interface IVariantTypeArgs {
  specification_version?: number;
}
export class VariantType {
  public specification_version?: number;
  constructor(args?: IVariantTypeArgs) {
    this.specification_version = args?.specification_version;
  }
  public write(output: thrift.TProtocol): void {
    output.writeStructBegin('VariantType');
    if (this.specification_version != null) {
      output.writeFieldBegin('specification_version', thrift.Thrift.Type.BYTE, 1);
      output.writeByte(this.specification_version);
      output.writeFieldEnd();
    }
    output.writeFieldStop();
    output.writeStructEnd();
  }
  public static read(input: thrift.TProtocol): VariantType {
    const args: IVariantTypeArgs = {};
    input.readStructBegin();
    while (true) {
      const field = input.readFieldBegin();
      if (field.ftype === thrift.Thrift.Type.STOP) break;
      if (field.fid === 1 && field.ftype === thrift.Thrift.Type.BYTE) {
        args.specification_version = input.readByte();
      } else {
        input.skip(field.ftype);
      }
      input.readFieldEnd();
    }
    input.readStructEnd();
    return new VariantType(args);
  }
}
