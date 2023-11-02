// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import type {DataType, Field, Schema, SchemaMetadata} from '@loaders.gl/schema';
import * as arrow from 'apache-arrow';

/** Convert Apache Arrow Schema (class instance) to a serialized Schema (plain data) */
export function serializeArrowSchema(arrowSchema: arrow.Schema): Schema {
  return {
    fields: arrowSchema.fields.map((arrowField) => serializeArrowField(arrowField)),
    metadata: serializeArrowMetadata(arrowSchema.metadata)
  };
}

/** Convert a serialized Schema (plain data) to an Apache Arrow Schema (class instance) */
export function deserializeArrowSchema(schema: Schema): arrow.Schema {
  return new arrow.Schema(
    schema.fields.map((field) => deserializeArrowField(field)),
    deserializeArrowMetadata(schema.metadata)
  );
}

/** Convert Apache Arrow Schema metadata (Map<string, string>) to serialized metadata (Record<string, string> */
export function serializeArrowMetadata(arrowMetadata: Map<string, string>): SchemaMetadata {
  return Object.fromEntries(arrowMetadata);
}

/** Convert serialized metadata (Record<string, string> to Apache Arrow Schema metadata (Map<string, string>) to */
export function deserializeArrowMetadata(metadata?: SchemaMetadata): Map<string, string> {
  return metadata ? new Map(Object.entries(metadata)) : new Map<string, string>();
}

/** Convert Apache Arrow Field (class instance) to serialized Field (plain data) */
export function serializeArrowField(field: arrow.Field): Field {
  return {
    name: field.name,
    type: serializeArrowType(field.type),
    nullable: field.nullable,
    metadata: serializeArrowMetadata(field.metadata)
  };
}

/** Convert a serialized Field (plain data) to an Apache Arrow Field (class instance)*/
export function deserializeArrowField(field: Field): arrow.Field {
  return new arrow.Field(
    field.name,
    deserializeArrowType(field.type),
    field.nullable,
    deserializeArrowMetadata(field.metadata)
  );
}

/** Converts a serializable loaders.gl data type to hydrated arrow data type */
// eslint-disable-next-line complexity
export function serializeArrowType(arrowType: arrow.DataType): DataType {
  switch (arrowType.constructor) {
    case arrow.Null:
      return 'null';
    case arrow.Binary:
      return 'binary';
    case arrow.Bool:
      return 'bool';
    case arrow.Int:
      const intType = arrowType as arrow.Int;
      return `${intType.isSigned ? 'u' : ''}int${intType.bitWidth}`;
    case arrow.Int8:
      return 'int8';
    case arrow.Int16:
      return 'int16';
    case arrow.Int32:
      return 'int32';
    case arrow.Int64:
      return 'int64';
    case arrow.Uint8:
      return 'uint8';
    case arrow.Uint16:
      return 'uint16';
    case arrow.Uint32:
      return 'uint32';
    case arrow.Uint64:
      return 'uint64';
    case arrow.Float:
      const precision = (arrowType as arrow.Float).precision;
      // return `float(precision + 1) * 16`;
      switch (precision) {
        case arrow.Precision.HALF:
          return 'float16';
        case arrow.Precision.SINGLE:
          return 'float32';
        case arrow.Precision.DOUBLE:
          return 'float64';
        default:
          return 'float16';
      }
    case arrow.Float16:
      return 'float16';
    case arrow.Float32:
      return 'float32';
    case arrow.Float64:
      return 'float64';
    case arrow.Utf8:
      return 'utf8';
    case Date:
      const dateUnit = (arrowType as arrow.Date_).unit;
      return dateUnit === arrow.DateUnit.DAY ? 'date-day' : 'date-millisecond';
    case arrow.DateDay:
      return 'date-day';
    case arrow.DateMillisecond:
      return 'date-millisecond';
    case arrow.Time:
      const timeUnit = (arrowType as arrow.Time).unit;
      switch (timeUnit) {
        case arrow.TimeUnit.SECOND:
          return 'time-second';
        case arrow.TimeUnit.MILLISECOND:
          return 'time-millisecond';
        case arrow.TimeUnit.MICROSECOND:
          return 'time-microsecond';
        case arrow.TimeUnit.NANOSECOND:
          return 'time-nanosecond';
        default:
          return 'time-second';
      }
    case arrow.TimeMillisecond:
      return 'time-millisecond';
    case arrow.TimeSecond:
      return 'time-second';
    case arrow.TimeMicrosecond:
      return 'time-microsecond';
    case arrow.TimeNanosecond:
      return 'time-nanosecond';
    case arrow.Timestamp:
      const timeStampUnit = (arrowType as arrow.Timestamp).unit;
      switch (timeStampUnit) {
        case arrow.TimeUnit.SECOND:
          return 'timestamp-second';
        case arrow.TimeUnit.MILLISECOND:
          return 'timestamp-millisecond';
        case arrow.TimeUnit.MICROSECOND:
          return 'timestamp-microsecond';
        case arrow.TimeUnit.NANOSECOND:
          return 'timestamp-nanosecond';
        default:
          return 'timestamp-second';
      }
    case arrow.TimestampSecond:
      return 'timestamp-second';
    case arrow.TimestampMillisecond:
      return 'timestamp-millisecond';
    case arrow.TimestampMicrosecond:
      return 'timestamp-microsecond';
    case arrow.TimestampNanosecond:
      return 'timestamp-nanosecond';
    case arrow.Interval:
      const intervalUnit = (arrowType as arrow.Interval).unit;
      switch (intervalUnit) {
        case arrow.IntervalUnit.DAY_TIME:
          return 'interval-daytime';
        case arrow.IntervalUnit.YEAR_MONTH:
          return 'interval-yearmonth';
        default:
          return 'interval-daytime';
      }
    case arrow.IntervalDayTime:
      return 'interval-daytime';
    case arrow.IntervalYearMonth:
      return 'interval-yearmonth';
    case arrow.List:
      const listType = arrowType as arrow.List;
      const listField = listType.valueField;
      return {
        type: 'list',
        children: [serializeArrowField(listField)]
      };
    case arrow.FixedSizeList:
      return {
        type: 'fixed-size-list',
        listSize: (arrowType as arrow.FixedSizeList).listSize,
        children: [serializeArrowField((arrowType as arrow.FixedSizeList).children[0])]
      };
    // case arrow.Struct:
    //   return {type: 'struct', children: (arrowType as arrow.Struct).children};
    default:
      throw new Error('array type not supported');
  }
}

/** Converts a serializable loaders.gl data type to hydrated arrow data type */
// eslint-disable-next-line complexity
export function deserializeArrowType(dataType: DataType): arrow.DataType {
  if (typeof dataType === 'object') {
    switch (dataType.type) {
      case 'list':
        const field = deserializeArrowField(dataType.children[0]);
        return new arrow.List(field);
      case 'fixed-size-list':
        const child = deserializeArrowField(dataType.children[0]);
        return new arrow.FixedSizeList(dataType.listSize, child);
      case 'struct':
        const children = dataType.children.map((arrowField) => deserializeArrowField(arrowField));
        return new arrow.Struct(children);
      default:
        throw new Error('array type not supported');
    }
  }

  switch (dataType) {
    case 'null':
      return new arrow.Null();
    case 'binary':
      return new arrow.Binary();
    case 'bool':
      return new arrow.Bool();
    case 'int8':
      return new arrow.Int8();
    case 'int16':
      return new arrow.Int16();
    case 'int32':
      return new arrow.Int32();
    case 'int64':
      return new arrow.Int64();
    case 'uint8':
      return new arrow.Uint8();
    case 'uint16':
      return new arrow.Uint16();
    case 'uint32':
      return new arrow.Uint32();
    case 'uint64':
      return new arrow.Uint64();
    case 'float16':
      return new arrow.Float16();
    case 'float32':
      return new arrow.Float32();
    case 'float64':
      return new arrow.Float64();
    case 'utf8':
      return new arrow.Utf8();
    case 'date-day':
      return new arrow.DateDay();
    case 'date-millisecond':
      return new arrow.DateMillisecond();
    case 'time-second':
      return new arrow.TimeSecond();
    case 'time-millisecond':
      return new arrow.TimeMillisecond();
    case 'time-microsecond':
      return new arrow.TimeMicrosecond();
    case 'time-nanosecond':
      return new arrow.TimeNanosecond();
    case 'timestamp-second':
      return new arrow.TimestampSecond();
    case 'timestamp-millisecond':
      return new arrow.TimestampMillisecond();
    case 'timestamp-microsecond':
      return new arrow.TimestampMicrosecond();
    case 'timestamp-nanosecond':
      return new arrow.TimestampNanosecond();
    case 'interval-daytime':
      return new arrow.IntervalDayTime();
    case 'interval-yearmonth':
      return new arrow.IntervalYearMonth();
    default:
      throw new Error('array type not supported');
  }
}
