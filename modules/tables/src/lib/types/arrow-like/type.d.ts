// This code is adapted from ArrowJS https://github.com/apache/arrow
// under Apache license http://www.apache.org/licenses/LICENSE-2.0

// import {Type as TypeEnum} from './enum';
import Field from '../../schema/field';

type Type = number; // keyof typeof TypeEnum;

export type TypedIntArray =
  Int8Array | Uint8Array |
  Int16Array | Uint16Array |
  Int32Array | Uint32Array |
  Int32Array | Uint32Array;

export type TypedFloatArray =
    Uint16Array |
    Float32Array |
    Float64Array;

export type TypedArray = TypedIntArray | TypedFloatArray;

export type AnyArrayType = Array<any> | TypedIntArray | TypedFloatArray;

export class DataType {
  static            isNull(x: any): boolean;
  static             isInt(x: any): boolean;
  static           isFloat(x: any): boolean;
  static          isBinary(x: any): boolean;
  static            isUtf8(x: any): boolean;
  static            isBool(x: any): boolean;
  static         isDecimal(x: any): boolean;
  static            isDate(x: any): boolean;
  static            isTime(x: any): boolean;
  static       isTimestamp(x: any): boolean;
  static        isInterval(x: any): boolean;
  static            isList(x: any): boolean;
  static          isStruct(x: any): boolean;
  static           isUnion(x: any): boolean;
  static isFixedSizeBinary(x: any): boolean;
  static   isFixedSizeList(x: any): boolean;
  static             isMap(x: any): boolean;
  static      isDictionary(x: any): boolean;

  get typeId(): Type;
  get ArrayType(): AnyArrayType;
  compareTo(other: DataType): boolean;
}

// NULL

export class Null extends DataType {
  get typeId(): Type;
  readonly [Symbol.toStringTag]: string;
  toString(): string;
}

// BOOLEANS

export class Bool extends DataType  {
  get typeId(): Type;
  get ArrayType(): Uint8Array;
  readonly [Symbol.toStringTag]: string;
  toString(): string;
}

// INTS

export abstract class Int extends DataType  {
  constructor(isSigned: boolean, bitWidth: number);
  get typeId(): Type;
  get ArrayType(): TypedIntArray;
  readonly [Symbol.toStringTag]: string;
  toString(): string;
}

export class Int8 extends Int { constructor(); }
export class Int16 extends Int { constructor(); }
export class Int32 extends Int { constructor(); }
export class Int64 extends Int { constructor(); }
export class Uint8 extends Int { constructor(); }
export class Uint16 extends Int { constructor(); }
export class Uint32 extends Int { constructor(); }
export class Uint64 extends Int { constructor(); }

// FLOATS

export abstract class Float extends DataType  {
  constructor(precision: number);
  get typeId(): Type;
  get ArrayType(): TypedFloatArray;
  readonly [Symbol.toStringTag]: string;
  toString(): string;
}

export class Float16 extends Float { constructor(); }
export class Float32 extends Float { constructor(); }
export class Float64 extends Float { constructor(); }

// STRINGS

export class Utf8 extends DataType {
  get typeId(): Type;
  get ArrayType(): Uint8Array;
  readonly [Symbol.toStringTag]: string;
  toString(): string;
}

// DATES, TIMES AND INTERVALS

type DateUnit = {
  DAY: number,
  MILLISECOND: number
}

export abstract class Date extends DataType {
  constructor(unit: number);
  get typeId(): Type;
  get ArrayType(): Int32Array;
  readonly [Symbol.toStringTag]: string;
  toString(): string;
}

export class DateDay extends Date { constructor() }
export class DateMillisecond extends Date { constructor() }

type TimeUnit = {
  SECOND: number,
  MILLISECOND: number,
  MICROSECOND: number,
  NANOSECOND: number
}

export abstract class Time extends DataType {
  constructor(unit, bitWidth);
  get typeId(): Type;
  get ArrayType(): Int32Array;
  readonly [Symbol.toStringTag]: string;
  toString(): string;
}

export class TimeSecond extends Time { constructor() }
export class TimeMillisecond extends Time { constructor() }
// export class TimeMicrosecond extends Time {}
// export class TimeNanosecond extends Time {}

export abstract class Timestamp extends DataType {
  constructor(unit, timezone?);
  get typeId(): Type;
  get ArrayType(): Int32Array;
  readonly [Symbol.toStringTag]: string;
  toString(): string;
}

export class TimestampSecond extends Timestamp { constructor() }
export class TimestampMillisecond extends Timestamp { constructor() }
export class TimestampMicrosecond extends Timestamp { constructor() }
export class TimestampNanosecond extends Timestamp { constructor() }

type IntervalUnit = {
  DAY_TIME: number;
  YEAR_MONTH: number;
}

export abstract class Interval extends DataType {
  constructor(unit: number);
  get typeId(): Type;
  get ArrayType(): Int32Array;
  readonly [Symbol.toStringTag]: string;
  toString(): string;
}

export class IntervalDayTime extends Interval { constructor() }
export class IntervalYearMonth extends Interval { constructor() }

export class FixedSizeList extends DataType {
  public readonly children: Field[];

  constructor(listSize: number, child: Field);
  public get typeId(): Type;
  public get valueType(): DataType; //  { return this.children[0].type; }
  public get valueField(): Field; //  { return this.children[0]; }
  public get ArrayType(): TypedArray; //  { return this.valueType.ArrayType; }
  readonly [Symbol.toStringTag]: string;
  public toString(): string;
}
