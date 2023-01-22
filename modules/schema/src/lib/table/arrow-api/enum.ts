// This code is adapted from ArrowJS https://github.com/apache/arrow
// under Apache license http://www.apache.org/licenses/LICENSE-2.0

/**
 * Main data type enumeration.
 *
 * Data types in this library are all *logical*. They can be expressed as
 * either a primitive physical type (bytes or bits of some fixed size), a
 * nested type consisting of other data types, or another data type (e.g. a
 * timestamp encoded as an int64).
 *
 * **Note**: Only enum values 0-17 (NONE through Map) are written to an Arrow
 * IPC payload.
 *
 * The rest of the values are specified here so TypeScript can narrow the type
 * signatures further beyond the base Arrow Types. The Arrow DataTypes include
 * metadata like `bitWidth` that impact the type signatures of the values we
 * accept and return.
 *
 * For example, the `Int8Vector` reads 1-byte numbers from an `Int8Array`, an
 * `Int32Vector` reads a 4-byte number from an `Int32Array`, and an `Int64Vector`
 * reads a pair of 4-byte lo, hi 32-bit integers as a zero-copy slice from the
 * underlying `Int32Array`.
 *
 * Library consumers benefit by knowing the narrowest type, since we can ensure
 * the types across all public methods are propagated, and never bail to `any`.
 * These values are _never_ used at runtime, and they will _never_ be written
 * to the flatbuffers metadata of serialized Arrow IPC payloads.
 */
export enum Type {
  /** The default placeholder type */
  NONE = 0,
  /** A NULL type having no physical storage */
  Null = 1,
  /** Signed or unsigned 8, 16, 32, or 64-bit little-endian integer */
  Int = 2,
  /** 2, 4, or 8-byte floating point value */
  Float = 3,
  /** Variable-length bytes (no guarantee of UTF8-ness) */
  Binary = 4,
  /** UTF8 variable-length string as List<Char> */
  Utf8 = 5,
  /** Boolean as 1 bit, LSB bit-packed ordering */
  Bool = 6,
  /** Precision-and-scale-based decimal type. Storage type depends on the parameters. */
  Decimal = 7,
  /** int32_t days or int64_t milliseconds since the UNIX epoch */
  Date = 8,
  /** Time as signed 32 or 64-bit integer, representing either seconds, milliseconds, microseconds, or nanoseconds since midnight since midnight */
  Time = 9,
  /** Exact timestamp encoded with int64 since UNIX epoch (Default unit millisecond) */
  Timestamp = 10,
  /** YEAR_MONTH or DAY_TIME interval in SQL style */
  Interval = 11,
  /** A list of some logical data type */
  List = 12,
  /** Struct of logical types */
  Struct = 13,
  /** Union of logical types */
  Union = 14,
  /** Fixed-size binary. Each value occupies the same number of bytes */
  FixedSizeBinary = 15,
  /** Fixed-size list. Each value occupies the same number of bytes */
  FixedSizeList = 16,
  /** Map of named logical types */
  Map = 17,

  /** Dictionary aka Category type */
  Dictionary = -1,
  Int8 = -2,
  Int16 = -3,
  Int32 = -4,
  Int64 = -5,
  Uint8 = -6,
  Uint16 = -7,
  Uint32 = -8,
  Uint64 = -9,
  Float16 = -10,
  Float32 = -11,
  Float64 = -12,
  DateDay = -13,
  DateMillisecond = -14,
  TimestampSecond = -15,
  TimestampMillisecond = -16,
  TimestampMicrosecond = -17,
  TimestampNanosecond = -18,
  TimeSecond = -19,
  TimeMillisecond = -20,
  TimeMicrosecond = -21,
  TimeNanosecond = -22,
  DenseUnion = -23,
  SparseUnion = -24,
  IntervalDayTime = -25,
  IntervalYearMonth = -26
}
