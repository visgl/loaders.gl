# @loaders.gl/parquet

Experimental loader for Apache Parquet

## Compression Type

|Type|Read(decompress)|Write(compress) |
|-|-|
| `UNCOMPRESSED`  | YES| YES|
| `SNAPPY` |YES| YES|
| `GZIP` |YES| YES|
| `LZO` |NO| NO|
| `BROTLI` |NO| YES|
| `LZ4`  |YES| YES|
| `ZSTD` |YES| YES|
| `LZ4_RAW` |YES| YES|
## Encoding

| Encoding | Supported | Comment |
| --- | --- | --- |
| `PLAIN` | Y | All types
| `PLAIN_DICTIONARY` | Y | All types
| `RLE_DICTIONARY` | Y | All types
| `DELTA_BINARY_PACKED` | Y | INT32, INT64, INT_8, INT_16, INT_32, INT_64, UINT_8, UINT_16, UINT_32, UINT_64, TIME_MILLIS, TIME_MICROS, TIMESTAMP_MILLIS, TIMESTAMP_MICROS
| `DELTA_BYTE_ARRAY` | Y | BYTE_ARRAY, UTF8
| `DELTA_LENGTH_BYTE_ARRAY` | Y | BYTE_ARRAY, UTF8

Remarks:

* Some platforms don't support all encodings. PLAIN and PLAIN_DICTIONARY.
* PLAIN_DICTIONARY encoding is not recommended for fields have many different values.
* Large array values may be duplicated as min and max values in page stats, significantly increasing file size. If stats are not useful for such a field, they can be omitted from written files by adding `omitstats=true` to a field tag.

## Repetition Type

There are three repetition types in Parquet: REQUIRED, OPTIONAL, REPEATED.

|Repetition Type|Example|Description|
|-|-|-|
|REQUIRED|```V1 int32 `parquet:"name=v1, type=INT32"` ```|No extra description|
|OPTIONAL|```V1 *int32 `parquet:"name=v1, type=INT32"` ```|Declare as pointer|
|REPEATED|```V1 []int32 `parquet:"name=v1, type=INT32, repetitiontype=REPEATED"` ```|Add 'repetitiontype=REPEATED' in tags|

Remarks

* The difference between a List and a REPEATED variable is the 'repetitiontype' in tags. Although both of them are stored as slice in go, they are different in parquet. You can find the detail of List in parquet at [here](https://github.com/apache/parquet-format/blob/master/LogicalTypes.md). I suggest just use a List.
* For LIST and MAP, some existed parquet files use some nonstandard formats(see [here](https://github.com/apache/parquet-format/blob/master/LogicalTypes.md)). For standard format, parquet-go will convert them to go slice and go map. For nonstandard formats, parquet-go will convert them to corresponding structs.


## Type

There are two types in Parquet: Primitive Type and Logical Type. Logical types are stored as primitive types.

### Primitive Type
|Primitive Type|Go Type|
|-|-|
|BOOLEAN|bool|
|INT32|int32|
|INT64|int64|
|INT96|string|
|FLOAT|float32|
|DOUBLE|float64|
|BYTE_ARRAY|string|
|FIXED_LEN_BYTE_ARRAY|string|


### Logical Type
|Logical Type|Primitive Type|Go Type|
|-|-|-|
|UTF8|BYTE_ARRAY|string|
|INT_8|INT32|int32|
|INT_16|INT32|int32|
|INT_32|INT32|int32|
|INT_64|INT64|int64|
|UINT_8|INT32|int32|
|UINT_16|INT32|int32|
|UINT_32|INT32|int32|
|UINT_64|INT64|int64|
|DATE|INT32|int32|
|TIME_MILLIS|INT32|int32|
|TIME_MICROS|INT64|int64|
|TIMESTAMP_MILLIS|INT64|int64|
|TIMESTAMP_MICROS|INT64|int64|
|INTERVAL|FIXED_LEN_BYTE_ARRAY|string|
|DECIMAL|INT32,INT64,FIXED_LEN_BYTE_ARRAY,BYTE_ARRAY|int32,int64,string,string|
|LIST|-|slice||
|MAP|-|map||


Examples of types

```golang
	Bool              bool    `parquet:"name=bool, type=BOOLEAN"`
	Int32             int32   `parquet:"name=int32, type=INT32"`
	Int64             int64   `parquet:"name=int64, type=INT64"`
	Int96             string  `parquet:"name=int96, type=INT96"`
	Float             float32 `parquet:"name=float, type=FLOAT"`
	Double            float64 `parquet:"name=double, type=DOUBLE"`
	ByteArray         string  `parquet:"name=bytearray, type=BYTE_ARRAY"`
	FixedLenByteArray string  `parquet:"name=FixedLenByteArray, type=FIXED_LEN_BYTE_ARRAY, length=10"`

	Utf8             string `parquet:"name=utf8, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	Int_8            int32   `parquet:"name=int_8, type=INT32, convertedtype=INT32, convertedtype=INT_8"`
	Int_16           int32  `parquet:"name=int_16, type=INT32, convertedtype=INT_16"`
	Int_32           int32  `parquet:"name=int_32, type=INT32, convertedtype=INT_32"`
	Int_64           int64  `parquet:"name=int_64, type=INT64, convertedtype=INT_64"`
	Uint_8           int32  `parquet:"name=uint_8, type=INT32, convertedtype=UINT_8"`
	Uint_16          int32 `parquet:"name=uint_16, type=INT32, convertedtype=UINT_16"`
	Uint_32          int32 `parquet:"name=uint_32, type=INT32, convertedtype=UINT_32"`
	Uint_64          int64 `parquet:"name=uint_64, type=INT64, convertedtype=UINT_64"`
	Date             int32  `parquet:"name=date, type=INT32, convertedtype=DATE"`
	Date2            int32  `parquet:"name=date2, type=INT32, convertedtype=DATE, logicaltype=DATE"`
	TimeMillis       int32  `parquet:"name=timemillis, type=INT32, convertedtype=TIME_MILLIS"`
	TimeMillis2      int32  `parquet:"name=timemillis2, type=INT32, logicaltype=TIME, logicaltype.isadjustedtoutc=true, logicaltype.unit=MILLIS"`
	TimeMicros       int64  `parquet:"name=timemicros, type=INT64, convertedtype=TIME_MICROS"`
	TimeMicros2      int64  `parquet:"name=timemicros2, type=INT64, logicaltype=TIME, logicaltype.isadjustedtoutc=false, logicaltype.unit=MICROS"`
	TimestampMillis  int64  `parquet:"name=timestampmillis, type=INT64, convertedtype=TIMESTAMP_MILLIS"`
	TimestampMillis2 int64  `parquet:"name=timestampmillis2, type=INT64, logicaltype=TIMESTAMP, logicaltype.isadjustedtoutc=true, logicaltype.unit=MILLIS"`
	TimestampMicros  int64  `parquet:"name=timestampmicros, type=INT64, convertedtype=TIMESTAMP_MICROS"`
	TimestampMicros2 int64  `parquet:"name=timestampmicros2, type=INT64, logicaltype=TIMESTAMP, logicaltype.isadjustedtoutc=false, logicaltype.unit=MICROS"`
	Interval         string `parquet:"name=interval, type=BYTE_ARRAY, convertedtype=INTERVAL"`

	Decimal1 int32  `parquet:"name=decimal1, type=INT32, convertedtype=DECIMAL, scale=2, precision=9"`
	Decimal2 int64  `parquet:"name=decimal2, type=INT64, convertedtype=DECIMAL, scale=2, precision=18"`
	Decimal3 string `parquet:"name=decimal3, type=FIXED_LEN_BYTE_ARRAY, convertedtype=DECIMAL, scale=2, precision=10, length=12"`
	Decimal4 string `parquet:"name=decimal4, type=BYTE_ARRAY, convertedtype=DECIMAL, scale=2, precision=20"`

	Decimal5 int32 `parquet:"name=decimal5, type=INT32, logicaltype=DECIMAL, logicaltype.precision=10, logicaltype.scale=2"`

	Map      map[string]int32 `parquet:"name=map, type=MAP, convertedtype=MAP, keytype=BYTE_ARRAY, keyconvertedtype=UTF8, valuetype=INT32"`
	List     []string         `parquet:"name=list, type=MAP, convertedtype=LIST, valuetype=BYTE_ARRAY, valueconvertedtype=UTF8"`
	Repeated []int32          `parquet:"name=repeated, type=INT32, repetitiontype=REPEATED"`
```
# Attribution

Based on a fork of https://github.com/ironSource/parquetjs and  https://github.com/kbajalc/parquets under MIT license (Copyright (c) 2017 ironSource Ltd.).

Documentaion inspired by [parquet-go](https://github.com/xitongsys/parquet-go/blob/master/LICENSE) under Apache 2 license.


# License

`@loaders.gl/parquet` module is based on Apache 2.0 licensed code.
