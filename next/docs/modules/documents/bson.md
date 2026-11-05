Documents · BSON

[![](/next/images/format-logos/bson-logo.png)](https://loaders.gl/next/docs/modules/documents/bson/formats/bson.md)

# Keep JSON-like documents in a binary form.

`@loaders.gl/documents` loads and writes BSON documents as JavaScript objects. It is useful when a binary document format is required but the application wants the familiar JSON data model.

[BSON format](https://loaders.gl/next/docs/modules/documents/bson/formats/bson.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/documents/bson/formats/bson.md)[BSON loader](https://loaders.gl/next/docs/modules/documents/bson/api-reference/bson-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/documents/bson/api-reference/bson-loader.md)[BSON writer](https://loaders.gl/next/docs/modules/documents/bson/api-reference/bson-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/documents/bson/api-reference/bson-writer.md)

Structured data boundaries

## Keep the source shape. Choose the application shape.

JSON, delimited text, BSON, and XML describe data differently. loaders.gl keeps those input boundaries explicit while letting applications choose documents, tables, features, or trees for the next stage.

Input families

[**JSON**nested documents↗](https://loaders.gl/next/docs/modules/tables/json/formats/json.md)[**NDJSON**one record per line↗](https://loaders.gl/next/docs/modules/tables/json/formats/json.md)[**CSV / TSV**delimited rows↗](https://loaders.gl/next/docs/modules/tables/csv/formats/csv.md)[**BSON**typed binary documents↗](https://loaders.gl/next/docs/modules/documents/bson/formats/bson.md)[**XML**namespaced trees↗](https://loaders.gl/next/docs/modules/documents/xml/formats/xml.md)

pars&#x65;**→**

load()

Common API boundary

documentbatchstream

load · parse · write

shap&#x65;**→**

Application results

**Document**nested objects and arrays

**Table**rows, columns, or Arrow batches

**Features**geometry plus properties

**Tree**format-specific document structure

A readable interchange format can stay readable at the edge, or become a typed table when that is what the application needs.

The BSON path

## Decode binary documents. Work with objects. Encode them again.

The module keeps the representation boundary simple: BSON bytes at the edge, ordinary JavaScript values in the application, and BSON bytes when writing.

01

Input

BSON binary documents

02

Decode

MongoDB-compatible JavaScript objects

03

Application

JSON-like values and nested documents

04

Output

BSON binary documents

Detailed guide

## Loader and writer details

The reference below covers installation, entry points, supported data representation, and the native BSON codec.

![From-v3.4](https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square)

The `@loaders.gl/documents` module provides support for the [BSON](https://loaders.gl/next/docs/modules/documents/bson/formats/bson.md) format. The BSON format stores arbitrary (loosely structured) data largely equivalent to the textual JSON format.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core @loaders.gl/documents
```

The native codec runs in browsers and Node.js without an external BSON dependency.

## Loaders and Writers[​](#loaders-and-writers "Direct link to Loaders and Writers")

| Loader / Writer                                                                                       | Description                                                    |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [`BSONLoader`](https://loaders.gl/next/docs/modules/documents/bson/api-reference/bson-loader.md) | Loads BSON binary documents into JSON-like JavaScript objects. |
| [`BSONWriter`](https://loaders.gl/next/docs/modules/documents/bson/api-reference/bson-writer.md) | Writes JSON-like JavaScript objects as BSON binary documents.  |

## Attribution[​](#attribution "Direct link to Attribution")

The codec is an original loaders.gl implementation of the [BSON specification](https://bsonspec.org/spec.html). Historical test fixtures retain their upstream notices.

## Native value representations[​](#native-value-representations "Direct link to Native value representations")

The codec supports all BSON element types, including deprecated types. It does not provide MongoDB driver classes, Extended JSON parsing, or Decimal128 arithmetic.

| BSON type                            | Decoded JavaScript value                                                            |
| ------------------------------------ | ----------------------------------------------------------------------------------- |
| Document / array                     | Plain object / array                                                                |
| String, boolean, null, double, int32 | Corresponding JavaScript value                                                      |
| Int64                                | Number when safe; otherwise bigint. Options can request bigint or a typed scalar.   |
| ObjectId                             | `BSONObjectId`; `toString()` returns 24 lowercase hexadecimal characters.           |
| Date                                 | `Date` when representable; otherwise a `date` scalar containing int64 milliseconds. |
| Binary subtype 0                     | Copied `Uint8Array`                                                                 |
| Other binary subtypes                | `binary` scalar with `subtype` and `data`; payloads remain opaque.                  |
| Decimal128                           | `decimal128` scalar with the exact 16 wire bytes.                                   |
| Timestamp                            | `timestamp` scalar containing the unsigned 64-bit bit pattern.                      |
| Regular expression                   | `regexp` scalar with `pattern` and sorted BSON `options`.                           |
| Code / code with scope               | `code` scalar with source text and optional `scope` document.                       |
| Symbol / DBPointer                   | `symbol` or `dbPointer` scalar preserving its payload.                              |
| Undefined / MinKey / MaxKey          | `undefined`, `minKey`, or `maxKey` scalar.                                          |

Create explicit scalars with `createBSONValue()`. Decoded scalars already carry a private, non-enumerable symbol brand, so a normal document containing a `$bsonType` key is never mistaken for a scalar. JSON serialization and structured cloning lose this brand; recreate the scalar explicitly afterward. MongoDB class instances are not accepted.

```
import {BSONObjectId, createBSONValue, encodeBSONSync, parseBSONSync} from '@loaders.gl/documents/bson-codec';



const bytes = encodeBSONSync({

  id: new BSONObjectId('0123456789abcdef01234567'),

  count: 9007199254740993n,

  timestamp: createBSONValue({$bsonType: 'timestamp', value: 42n})

});

const document = parseBSONSync(bytes);
```

Plain numbers encode as int32 when integral and in range, otherwise as double (including negative zero, infinities, and NaN). Bigints encode as signed int64. Use `preserveTypes: true` when decoding to retain numeric wire types for re-encoding; without it, a safe int64 or an integral double may later encode as int32. Native regular expressions are accepted for writing but decode into unevaluated scalars.

## Embedded BSON in Parquet[​](#embedded-bson-in-parquet "Direct link to Embedded BSON in Parquet")

Parquet BSON columns use this same synchronous codec for document encoding and row materialization. Arrow output preserves the encoded bytes in Binary columns; use `parseBSONSync()` for explicit document decoding. No optional BSON backend is required.
