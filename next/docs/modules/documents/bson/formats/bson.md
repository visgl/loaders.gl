Document binary format

[![](/next/images/format-logos/bson-logo.png)](https://loaders.gl/next/docs/modules/documents/bson/formats/bson.md)

# Keep JSON-like documents typed on the wire.

BSON is a binary document format with explicit scalar types such as dates, 64-bit integers, decimals, byte arrays, and regular expressions. loaders.gl exposes it through the same loader and writer boundaries used by other formats.

[Documents · BSON](https://loaders.gl/next/docs/modules/documents/bson.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/documents/bson.md)[BSONLoader](https://loaders.gl/next/docs/modules/documents/bson/api-reference/bson-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/documents/bson/api-reference/bson-loader.md)[BSONWriter](https://loaders.gl/next/docs/modules/documents/bson/api-reference/bson-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/documents/bson/api-reference/bson-writer.md)

## loaders.gl support[​](#loadersgl-support "Direct link to loaders.gl support")

| Type   | API                                                                                                   |
| ------ | ----------------------------------------------------------------------------------------------------- |
| Loader | [`BSONLoader`](https://loaders.gl/next/docs/modules/documents/bson/api-reference/bson-loader.md) |
| Writer | [`BSONWriter`](https://loaders.gl/next/docs/modules/documents/bson/api-reference/bson-writer.md) |

[![](/next/images/format-logos/bson-logo.png)](https://loaders.gl/next/docs/modules/documents/bson/formats/bson.md)[Try It](https://loaders.gl/next/examples/table/bson)[Overview](https://loaders.gl/next/docs/modules/documents/bson/formats/bson.md)[Format](https://loaders.gl/next/docs/modules/documents/bson/format.md)[BSONLoader](https://loaders.gl/next/docs/modules/documents/bson/api-reference/bson-loader.md)[BSONWriter](https://loaders.gl/next/docs/modules/documents/bson/api-reference/bson-writer.md)

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

BSON feature card

## Read and write BSON with a native codec.

The loaders.gl codec runs in browsers and Node.js without the bson package. It supports every BSON element type, with explicit representations for values that JavaScript cannot express directly.

01

Runtime

Native browser and Node.js codec; no BSON package

02

Types

All element types, including lossless special scalars

03

Parquet

Document read/write; Arrow Binary byte output

04

Validation

Checked lengths, UTF-8, depth, cycles; code stays data

Detailed guide

## BSON structure and compatibility

The reference below covers BSON data types, Extended JSON, binary layout, efficiency trade-offs, and the loaders.gl entry points.

The BSON ("Binary JSON") specification defines a binary format for storing JSON-like data with additional scalar types and explicit type information.

* *[`@loaders.gl/documents`](https://loaders.gl/next/docs/modules/documents/bson.md)*
* *[BSON specification](https://bsonspec.org/)*
* *[Wikipedia article](https://en.wikipedia.org/wiki/BSON)*

## Data Types and Syntax[​](#data-types-and-syntax "Direct link to Data Types and Syntax")

The topmost element in a BSON structure must be a BSON object. Each object contains zero or more elements, where each element has a field name, a type, and a value. Field names are strings.

BSON types include Unicode strings, 32-bit integers, 64-bit integers, doubles, decimal128 values, datetimes, byte arrays, booleans, nulls, nested BSON objects, BSON arrays, JavaScript code, MD5 binary data, and regular expressions.

## EJSON (Extended JSON)[​](#ejson-extended-json "Direct link to EJSON (Extended JSON)")

BSON contains types not present in JSON, such as datetimes, byte arrays, and type-specific numeric values. MongoDB's Extended JSON format can represent those BSON values in textual JSON-compatible form. The native loaders.gl codec reads and writes binary BSON; it does not parse or generate EJSON. See the [native value representations](https://loaders.gl/next/docs/modules/documents/bson.md#native-value-representations) for explicit scalar construction and numeric promotion options.

## loaders.gl support[​](#loadersgl-support-1 "Direct link to loaders.gl support")

Use `BSONLoader` from `@loaders.gl/documents` and `BSONWriter` from `@loaders.gl/documents/bson-writer`, or call `parseBSONSync()` and `encodeBSONSync()` directly. BSON-specific scalars use `BSONObjectId` or values constructed with `createBSONValue()`. Code and regular expressions are preserved as data and are never evaluated while decoding.

All binary subtypes are preserved, including opaque compressed, encrypted, and vector payloads; preserving their bytes does not decode the subtype-specific content. Parquet's BSON columns use the same codec for document materialization. Arrow output retains the BSON bytes for explicit decoding. See the [Documents · BSON](https://loaders.gl/next/docs/modules/documents/bson.md) and [migration guide](https://loaders.gl/next/docs/upgrade-guide.md#native-bson-value-contract).

## Efficiency[​](#efficiency "Direct link to Efficiency")

Compared to JSON, BSON is designed for efficient storage and scanning. Large elements in a BSON document are prefixed with a length field to support fast traversal. In some cases, BSON uses more space than JSON due to length prefixes and explicit array indices.

## History[​](#history "Direct link to History")

BSON originated in 2009 at MongoDB. It is used as a data storage and network transfer format for MongoDB, but it can also be used independently outside MongoDB.

## Example[​](#example "Direct link to Example")

A JSON document such as:

```
{"hello": "world"}
```

is stored as BSON bytes equivalent to:

```
\x16\x00\x00\x00          // total document size

\x02                      // 0x02 = type String

hello\x00                 // field name

\x06\x00\x00\x00world\x00 // field value size, value, null terminator

\x00                      // 0x00 = EOO, end of object
```
