// loaders.gl, MIT license

import type {DataType, Field, Schema, SchemaMetadata} from '@loaders.gl/schema';
import {
  Field as ArrowField,
  Schema as ArrowSchema,
  DataType as ArrowDataType,
  Null,
  Binary,
  Bool,
  // Int,
  Int8,
  Int16,
  Int32,
  Int64,
  Uint8,
  Uint16,
  Uint32,
  Uint64,
  // Float,
  Float16,
  Float32,
  Float64,
  Utf8,
  // Date,
  DateDay,
  DateMillisecond,
  // Time,
  TimeMillisecond,
  TimeSecond,
  // Timestamp,
  TimestampSecond,
  TimestampMillisecond,
  TimestampMicrosecond,
  TimestampNanosecond,
  // Interval,
  IntervalDayTime,
  IntervalYearMonth,
  FixedSizeList,
  Struct
} from 'apache-arrow';

export function serializeArrowSchema(arrowSchema: ArrowSchema): Schema {
  return {
    fields: arrowSchema.fields.map((arrowField) => serializeArrowField(arrowField)),
    metadata: serializeArrowMetadata(arrowSchema.metadata)
  };
}

export function deserializeArrowSchema(schema: Schema): ArrowSchema {
  return new ArrowSchema(
    schema.fields.map((field) => deserializeArrowField(field)),
    deserializeArrowMetadata(schema.metadata)
  );
}

export function serializeArrowMetadata(arrowMetadata: Map<string, string>): SchemaMetadata {
  return Object.fromEntries(arrowMetadata);
}

export function deserializeArrowMetadata(metadata?: SchemaMetadata): Map<string, string> {
  return metadata ? new Map(Object.entries(metadata)) : new Map<string, string>();
}

export function serializeArrowField(field: ArrowField): Field {
  return {
    name: field.name,
    type: serializeArrowType(field.type),
    nullable: field.nullable,
    metadata: serializeArrowMetadata(field.metadata)
  };
}

export function deserializeArrowField(field: Field): ArrowField {
  return new ArrowField(
    field.name,
    deserializeArrowType(field.type),
    field.nullable,
    deserializeArrowMetadata(field.metadata)
  );
}

/** Converts a serializable loaders.gl data type to hydrated arrow data type */
// eslint-disable-next-line complexity
export function serializeArrowType(arrowType: ArrowDataType): DataType {
  switch (arrowType.constructor) {
    case Null:
      return 'null';
    case Binary:
      return 'binary';
    case Bool:
      return 'bool';
    // case Int: return 'int';
    case Int8:
      return 'int8';
    case Int16:
      return 'int16';
    case Int32:
      return 'int32';
    case Int64:
      return 'int64';
    case Uint8:
      return 'uint8';
    case Uint16:
      return 'uint16';
    case Uint32:
      return 'uint32';
    case Uint64:
      return 'uint64';
    // case Float: return 'float';
    case Float16:
      return 'float16';
    case Float32:
      return 'float32';
    case Float64:
      return 'float64';
    case Utf8:
      return 'utf8';
    // case Date: return 'date';
    case DateDay:
      return 'date-day';
    case DateMillisecond:
      return 'date-millisecond';
    // case Time: return 'time';
    case TimeMillisecond:
      return 'time-millisecond';
    case TimeSecond:
      return 'time-second';
    // case Timestamp: return 'timestamp';
    case TimestampSecond:
      return 'timestamp-second';
    case TimestampMillisecond:
      return 'timestamp-millisecond';
    case TimestampMicrosecond:
      return 'timestamp-microsecond';
    case TimestampNanosecond:
      return 'timestamp-nanosecond';
    // case Interval: return 'interval';
    case IntervalDayTime:
      return 'interval-daytime';
    case IntervalYearMonth:
      return 'interval-yearmonth';
    case FixedSizeList:
      return {
        type: 'fixed-size-list',
        listSize: (arrowType as FixedSizeList).listSize,
        children: [serializeArrowField((arrowType as FixedSizeList).children[0])]
      };
    // case Struct:
    //   return {type: 'struct', children: (arrowType as Struct).children};
    default:
      throw new Error('array type not supported');
  }
}

/** Converts a serializable loaders.gl data type to hydrated arrow data type */
// eslint-disable-next-line complexity
export function deserializeArrowType(dataType: DataType): ArrowDataType {
  if (typeof dataType === 'object') {
    switch (dataType.type) {
      case 'fixed-size-list':
        const child = deserializeArrowField(dataType.children[0]);
        return new FixedSizeList(dataType.listSize, child);
      case 'struct':
        const children = dataType.children.map((arrowField) => deserializeArrowField(arrowField));
        return new Struct(children);
      default:
        throw new Error('array type not supported');
    }
  }

  switch (dataType) {
    case 'null':
      return new Null();
    case 'binary':
      return new Binary();
    case 'bool':
      return new Bool();
    // case 'int': return new Int();
    case 'int8':
      return new Int8();
    case 'int16':
      return new Int16();
    case 'int32':
      return new Int32();
    case 'int64':
      return new Int64();
    case 'uint8':
      return new Uint8();
    case 'uint16':
      return new Uint16();
    case 'uint32':
      return new Uint32();
    case 'uint64':
      return new Uint64();
    // case 'float': return new Float();
    case 'float16':
      return new Float16();
    case 'float32':
      return new Float32();
    case 'float64':
      return new Float64();
    case 'utf8':
      return new Utf8();
    // case 'date': return new Date();
    case 'date-day':
      return new DateDay();
    case 'date-millisecond':
      return new DateMillisecond();
    // case 'time': return new Time();
    case 'time-millisecond':
      return new TimeMillisecond();
    case 'time-second':
      return new TimeSecond();
    // case 'timestamp': return new Timestamp();
    case 'timestamp-second':
      return new TimestampSecond();
    case 'timestamp-millisecond':
      return new TimestampMillisecond();
    case 'timestamp-microsecond':
      return new TimestampMicrosecond();
    case 'timestamp-nanosecond':
      return new TimestampNanosecond();
    // case 'interval': return new Interval();
    case 'interval-daytime':
      return new IntervalDayTime();
    case 'interval-yearmonth':
      return new IntervalYearMonth();
    default:
      throw new Error('array type not supported');
  }
}
