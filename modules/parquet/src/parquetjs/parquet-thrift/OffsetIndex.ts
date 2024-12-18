// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 ironSource Ltd.
// Forked from https://github.com/kbajalc/parquets under MIT license

/* tslint:disable */
/* eslint-disable */
/*
 * Autogenerated by @creditkarma/thrift-typescript v3.7.2
 * DO NOT EDIT UNLESS YOU ARE SURE THAT YOU KNOW WHAT YOU ARE DOING
 */
import * as thrift from 'thrift';
import * as PageLocation from './PageLocation';
export interface IOffsetIndexArgs {
  page_locations: Array<PageLocation.PageLocation>;
}
export class OffsetIndex {
  public page_locations: Array<PageLocation.PageLocation>;
  constructor(args: IOffsetIndexArgs) {
    if (args != null && args.page_locations != null) {
      this.page_locations = args.page_locations;
    } else {
      throw new thrift.Thrift.TProtocolException(
        thrift.Thrift.TProtocolExceptionType.UNKNOWN,
        'Required field[page_locations] is unset!'
      );
    }
  }
  public write(output: thrift.TProtocol): void {
    output.writeStructBegin('OffsetIndex');
    if (this.page_locations != null) {
      output.writeFieldBegin('page_locations', thrift.Thrift.Type.LIST, 1);
      output.writeListBegin(thrift.Thrift.Type.STRUCT, this.page_locations.length);
      this.page_locations.forEach((value_1: PageLocation.PageLocation): void => {
        value_1.write(output);
      });
      output.writeListEnd();
      output.writeFieldEnd();
    }
    output.writeFieldStop();
    output.writeStructEnd();
    return;
  }
  public static read(input: thrift.TProtocol): OffsetIndex {
    input.readStructBegin();
    let _args: any = {};
    while (true) {
      const ret: thrift.TField = input.readFieldBegin();
      const fieldType: thrift.Thrift.Type = ret.ftype;
      const fieldId: number = ret.fid;
      if (fieldType === thrift.Thrift.Type.STOP) {
        break;
      }
      switch (fieldId) {
        case 1:
          if (fieldType === thrift.Thrift.Type.LIST) {
            const value_2: Array<PageLocation.PageLocation> =
              new Array<PageLocation.PageLocation>();
            const metadata_1: thrift.TList = input.readListBegin();
            const size_1: number = metadata_1.size;
            for (let i_1: number = 0; i_1 < size_1; i_1++) {
              const value_3: PageLocation.PageLocation = PageLocation.PageLocation.read(input);
              value_2.push(value_3);
            }
            input.readListEnd();
            _args.page_locations = value_2;
          } else {
            input.skip(fieldType);
          }
          break;
        default: {
          input.skip(fieldType);
        }
      }
      input.readFieldEnd();
    }
    input.readStructEnd();
    if (_args.page_locations !== undefined) {
      return new OffsetIndex(_args);
    } else {
      throw new thrift.Thrift.TProtocolException(
        thrift.Thrift.TProtocolExceptionType.UNKNOWN,
        'Unable to read OffsetIndex from input'
      );
    }
  }
}
