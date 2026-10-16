// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */
import * as thrift from '../utils/thrift-runtime';

/** Constructor arguments for the Parquet geospatial bounding-box Thrift structure. */
export interface IBoundingBoxArgs {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
  zmin?: number;
  zmax?: number;
  mmin?: number;
  mmax?: number;
}

/** Parquet geospatial bounding-box Thrift structure. */
export class BoundingBox {
  public xmin: number;
  public xmax: number;
  public ymin: number;
  public ymax: number;
  public zmin?: number;
  public zmax?: number;
  public mmin?: number;
  public mmax?: number;

  constructor(args: IBoundingBoxArgs) {
    this.xmin = getRequiredCoordinate(args.xmin, 'xmin');
    this.xmax = getRequiredCoordinate(args.xmax, 'xmax');
    this.ymin = getRequiredCoordinate(args.ymin, 'ymin');
    this.ymax = getRequiredCoordinate(args.ymax, 'ymax');
    this.zmin = args.zmin;
    this.zmax = args.zmax;
    this.mmin = args.mmin;
    this.mmax = args.mmax;
  }

  /** Writes this bounding box to a Thrift protocol. */
  public write(output: thrift.TProtocol): void {
    output.writeStructBegin('BoundingBox');
    writeCoordinate(output, 'xmin', 1, this.xmin);
    writeCoordinate(output, 'xmax', 2, this.xmax);
    writeCoordinate(output, 'ymin', 3, this.ymin);
    writeCoordinate(output, 'ymax', 4, this.ymax);
    writeCoordinate(output, 'zmin', 5, this.zmin);
    writeCoordinate(output, 'zmax', 6, this.zmax);
    writeCoordinate(output, 'mmin', 7, this.mmin);
    writeCoordinate(output, 'mmax', 8, this.mmax);
    output.writeFieldStop();
    output.writeStructEnd();
  }

  /** Reads a bounding box from a Thrift protocol. */
  public static read(input: thrift.TProtocol): BoundingBox {
    input.readStructBegin();
    const args: Partial<IBoundingBoxArgs> = {};
    while (true) {
      const field = input.readFieldBegin();
      if (field.ftype === thrift.Thrift.Type.STOP) break;
      if (field.fid >= 1 && field.fid <= 8 && field.ftype === thrift.Thrift.Type.DOUBLE) {
        const coordinateNames: Array<keyof IBoundingBoxArgs> = [
          'xmin',
          'xmax',
          'ymin',
          'ymax',
          'zmin',
          'zmax',
          'mmin',
          'mmax'
        ];
        args[coordinateNames[field.fid - 1]] = input.readDouble();
      } else {
        input.skip(field.ftype);
      }
      input.readFieldEnd();
    }
    input.readStructEnd();
    return new BoundingBox(args as IBoundingBoxArgs);
  }
}

/** Writes one optional coordinate to a Thrift protocol. */
function writeCoordinate(
  output: thrift.TProtocol,
  name: string,
  fieldId: number,
  value: number | undefined
): void {
  if (value === undefined) return;
  output.writeFieldBegin(name, thrift.Thrift.Type.DOUBLE, fieldId);
  output.writeDouble(value);
  output.writeFieldEnd();
}

/** Validates one required coordinate reported by the Thrift structure. */
function getRequiredCoordinate(value: number | undefined, name: string): number {
  if (value === undefined) {
    throw new thrift.Thrift.TProtocolException(
      thrift.Thrift.TProtocolExceptionType.UNKNOWN,
      `Required field[${name}] is unset!`
    );
  }
  return value;
}
