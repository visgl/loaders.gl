// This code is adapted from ArrowJS https://github.com/apache/arrow
// under Apache license http://www.apache.org/licenses/LICENSE-2.0

import {Type} from './enum';

import Field from './field';

export {Type} from './enum';

export type TypedIntArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Int32Array
  | Uint32Array
  | Uint8ClampedArray;

export type TypedFloatArray = Float32Array | Float64Array;

export type TypedArray = TypedIntArray | TypedFloatArray;

export type AnyArrayType = Array<any> | TypedIntArray | TypedFloatArray;

export class DataType {
  static isNull(x: any): boolean {
    return x && x.typeId === Type.Null;
  }
  static isInt(x: any): boolean {
    return x && x.typeId === Type.Int;
  }
  static isFloat(x: any): boolean {
    return x && x.typeId === Type.Float;
  }
  static isBinary(x: any): boolean {
    return x && x.typeId === Type.Binary;
  }
  static isUtf8(x: any): boolean {
    return x && x.typeId === Type.Utf8;
  }
  static isBool(x: any): boolean {
    return x && x.typeId === Type.Bool;
  }
  static isDecimal(x: any): boolean {
    return x && x.typeId === Type.Decimal;
  }
  static isDate(x: any): boolean {
    return x && x.typeId === Type.Date;
  }
  static isTime(x: any): boolean {
    return x && x.typeId === Type.Time;
  }
  static isTimestamp(x: any): boolean {
    return x && x.typeId === Type.Timestamp;
  }
  static isInterval(x: any): boolean {
    return x && x.typeId === Type.Interval;
  }
  static isList(x: any): boolean {
    return x && x.typeId === Type.List;
  }
  static isStruct(x: any): boolean {
    return x && x.typeId === Type.Struct;
  }
  static isUnion(x: any): boolean {
    return x && x.typeId === Type.Union;
  }
  static isFixedSizeBinary(x: any): boolean {
    return x && x.typeId === Type.FixedSizeBinary;
  }
  static isFixedSizeList(x: any): boolean {
    return x && x.typeId === Type.FixedSizeList;
  }
  static isMap(x: any): boolean {
    return x && x.typeId === Type.Map;
  }
  static isDictionary(x: any): boolean {
    return x && x.typeId === Type.Dictionary;
  }

  get typeId(): Type {
    return Type.NONE;
  }

  // get ArrayType(): AnyArrayType {
  //   return Int8Array;
  // }

  // get ArrayType() { return Array; }
  compareTo(other: DataType): boolean {
    // TODO
    return this === other; // comparer.visit(this, other);
  }
}

// NULL

export class Null extends DataType {
  get typeId(): Type {
    return Type.Null;
  }
  get [Symbol.toStringTag](): string {
    return 'Null';
  }
  toString(): string {
    return 'Null';
  }
}

// BOOLEANS

export class Bool extends DataType {
  get typeId(): Type {
    return Type.Bool;
  }
  // get ArrayType() {
  //   return Uint8Array;
  // }
  get [Symbol.toStringTag](): string {
    return 'Bool';
  }
  toString(): string {
    return 'Bool';
  }
}

// INTS

export class Int extends DataType {
  readonly isSigned: boolean;
  readonly bitWidth: number;
  constructor(isSigned, bitWidth) {
    super();
    this.isSigned = isSigned;
    this.bitWidth = bitWidth;
  }
  get typeId(): Type {
    return Type.Int;
  }
  // get ArrayType() {
  //   switch (this.bitWidth) {
  //     case 8:
  //       return this.isSigned ? Int8Array : Uint8Array;
  //     case 16:
  //       return this.isSigned ? Int16Array : Uint16Array;
  //     case 32:
  //       return this.isSigned ? Int32Array : Uint32Array;
  //     case 64:
  //       return this.isSigned ? Int32Array : Uint32Array;
  //     default:
  //       throw new Error(`Unrecognized ${this[Symbol.toStringTag]} type`);
  //   }
  // }
  get [Symbol.toStringTag](): string {
    return 'Int';
  }
  toString(): string {
    return `${this.isSigned ? 'I' : 'Ui'}nt${this.bitWidth}`;
  }
}

export class Int8 extends Int {
  constructor() {
    super(true, 8);
  }
}
export class Int16 extends Int {
  constructor() {
    super(true, 16);
  }
}
export class Int32 extends Int {
  constructor() {
    super(true, 32);
  }
}
export class Int64 extends Int {
  constructor() {
    super(true, 64);
  }
}
export class Uint8 extends Int {
  constructor() {
    super(false, 8);
  }
}
export class Uint16 extends Int {
  constructor() {
    super(false, 16);
  }
}
export class Uint32 extends Int {
  constructor() {
    super(false, 32);
  }
}
export class Uint64 extends Int {
  constructor() {
    super(false, 64);
  }
}

// FLOATS

const Precision = {
  HALF: 16,
  SINGLE: 32,
  DOUBLE: 64
};

export class Float extends DataType {
  readonly precision: number;
  constructor(precision) {
    super();
    this.precision = precision;
  }
  get typeId(): Type {
    return Type.Float;
  }
  // get ArrayType() {
  //   switch (this.precision) {
  //     case Precision.HALF:
  //       return Uint16Array;
  //     case Precision.SINGLE:
  //       return Float32Array;
  //     case Precision.DOUBLE:
  //       return Float64Array;
  //     default:
  //       throw new Error(`Unrecognized ${this[Symbol.toStringTag]} type`);
  //   }
  // }
  get [Symbol.toStringTag](): string {
    return 'Float';
  }
  toString(): string {
    return `Float${this.precision}`;
  }
}

export class Float16 extends Float {
  constructor() {
    super(Precision.HALF);
  }
}
export class Float32 extends Float {
  constructor() {
    super(Precision.SINGLE);
  }
}
export class Float64 extends Float {
  constructor() {
    super(Precision.DOUBLE);
  }
}

export class Binary extends DataType {
  constructor() {
    super();
  }
  get typeId() {
    return Type.Binary;
  }
  toString() {
    return 'Binary';
  }
  get [Symbol.toStringTag]() {
    return 'Binary';
  }
}

// STRINGS

export class Utf8 extends DataType {
  get typeId(): Type {
    return Type.Utf8;
  }
  // get ArrayType() {
  //   return Uint8Array;
  // }
  get [Symbol.toStringTag](): string {
    return 'Utf8';
  }
  toString(): string {
    return 'Utf8';
  }
}

// DATES, TIMES AND INTERVALS

const DateUnit = {
  DAY: 0,
  MILLISECOND: 1
};

export class Date extends DataType {
  readonly unit: number;
  constructor(unit) {
    super();
    this.unit = unit;
  }
  get typeId(): Type {
    return Type.Date;
  }
  // get ArrayType() {
  //   return Int32Array;
  // }
  get [Symbol.toStringTag](): string {
    return 'Date';
  }
  toString(): string {
    return `Date${(this.unit + 1) * 32}<${DateUnit[this.unit]}>`;
  }
}

export class DateDay extends Date {
  constructor() {
    super(DateUnit.DAY);
  }
}
export class DateMillisecond extends Date {
  constructor() {
    super(DateUnit.MILLISECOND);
  }
}

const TimeUnit = {
  SECOND: 1,
  MILLISECOND: 1e3,
  MICROSECOND: 1e6,
  NANOSECOND: 1e9
};

export class Time extends DataType {
  readonly unit: any;
  readonly bitWidth: number;

  constructor(unit: any, bitWidth: number) {
    super();
    this.unit = unit;
    this.bitWidth = bitWidth;
  }
  get typeId(): Type {
    return Type.Time;
  }
  toString(): string {
    return `Time${this.bitWidth}<${TimeUnit[this.unit]}>`;
  }
  get [Symbol.toStringTag](): string {
    return 'Time';
  }
  // get ArrayType() {
  //   return Int32Array;
  // }
}

export class TimeSecond extends Time {
  constructor() {
    super(TimeUnit.SECOND, 32);
  }
}
export class TimeMillisecond extends Time {
  constructor() {
    super(TimeUnit.MILLISECOND, 32);
  }
}
// export class TimeMicrosecond extends Time { constructor() { super(TimeUnit.MICROSECOND, 64); } }
// export class TimeNanosecond extends Time { constructor() { super(TimeUnit.NANOSECOND, 64); } }

export class Timestamp extends DataType {
  readonly unit: any;
  readonly timezone: any;

  constructor(unit: any, timezone = null) {
    super();
    this.unit = unit;
    this.timezone = timezone;
  }
  get typeId(): Type {
    return Type.Timestamp;
  }
  // get ArrayType() {
  //   return Int32Array;
  // }
  get [Symbol.toStringTag](): string {
    return 'Timestamp';
  }
  toString(): string {
    return `Timestamp<${TimeUnit[this.unit]}${this.timezone ? `, ${this.timezone}` : ''}>`;
  }
}

export class TimestampSecond extends Timestamp {
  constructor(timezone = null) {
    super(TimeUnit.SECOND, timezone);
  }
}
export class TimestampMillisecond extends Timestamp {
  constructor(timezone = null) {
    super(TimeUnit.MILLISECOND, timezone);
  }
}
export class TimestampMicrosecond extends Timestamp {
  constructor(timezone = null) {
    super(TimeUnit.MICROSECOND, timezone);
  }
}
export class TimestampNanosecond extends Timestamp {
  constructor(timezone = null) {
    super(TimeUnit.NANOSECOND, timezone);
  }
}

const IntervalUnit = {
  DAY_TIME: 0,
  YEAR_MONTH: 1
};

export class Interval extends DataType {
  readonly unit: number;
  constructor(unit: number) {
    super();
    this.unit = unit;
  }
  get typeId(): Type {
    return Type.Interval;
  }
  // get ArrayType() {
  //   return Int32Array;
  // }
  get [Symbol.toStringTag](): string {
    return 'Interval';
  }
  toString(): string {
    return `Interval<${IntervalUnit[this.unit]}>`;
  }
}

export class IntervalDayTime extends Interval {
  constructor() {
    super(IntervalUnit.DAY_TIME);
  }
}
export class IntervalYearMonth extends Interval {
  constructor() {
    super(IntervalUnit.YEAR_MONTH);
  }
}

export class FixedSizeList extends DataType {
  readonly listSize: number;
  readonly children: Field[];

  constructor(listSize: number, child: Field) {
    super();
    this.listSize = listSize;
    this.children = [child];
  }
  get typeId(): Type {
    return Type.FixedSizeList;
  }
  get valueType() {
    return this.children[0].type;
  }
  get valueField() {
    return this.children[0];
  }
  // get ArrayType() {
  //   return this.valueType.ArrayType;
  // }
  get [Symbol.toStringTag](): string {
    return 'FixedSizeList';
  }
  toString(): string {
    return `FixedSizeList[${this.listSize}]<${this.valueType}>`;
  }
}

export class Struct extends DataType {
  public readonly children: Field[];

  constructor(children: Field[]) {
    super();
    this.children = children;
  }

  public get typeId() {
    return Type.Struct;
  }
  public toString() {
    return `Struct<{${this.children.map((f) => `${f.name}:${f.type}`).join(', ')}}>`;
  }
  get [Symbol.toStringTag](): string {
    return 'Struct';
  }
}
