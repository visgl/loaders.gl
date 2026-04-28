import {BsonDocsTabs} from '@site/src/components/docs/bson-docs-tabs';

# BSON - Binary JSON

<BsonDocsTabs active="overview" />

The BSON ("Binary JSON") specification defines a binary format for storing JSON-like data with additional scalar types and explicit type information.

- _[`@loaders.gl/bson`](/docs/modules/bson)_
- _[BSON specification](https://bsonspec.org/)_
- _[Wikipedia article](https://en.wikipedia.org/wiki/BSON)_

## Data Types and Syntax

The topmost element in a BSON structure must be a BSON object. Each object contains one or more elements, where each element has a field name, a type, and a value. Field names are strings.

BSON types include Unicode strings, 32-bit integers, 64-bit integers, doubles, decimal128 values, datetimes, byte arrays, booleans, nulls, nested BSON objects, BSON arrays, JavaScript code, MD5 binary data, and regular expressions.

## EJSON (Extended JSON)

BSON contains types not present in JSON, such as datetimes, byte arrays, and type-specific numeric values. MongoDB's Extended JSON format can represent those BSON values in textual JSON-compatible form.

## Efficiency

Compared to JSON, BSON is designed for efficient storage and scanning. Large elements in a BSON document are prefixed with a length field to support fast traversal. In some cases, BSON uses more space than JSON due to length prefixes and explicit array indices.

## History

BSON originated in 2009 at MongoDB. It is used as a data storage and network transfer format for MongoDB, but it can also be used independently outside MongoDB.

## Example

A JSON document such as:

```typescript
{"hello": "world"}
```

is stored as BSON bytes equivalent to:

```typescript
\x16\x00\x00\x00          // total document size
\x02                      // 0x02 = type String
hello\x00                 // field name
\x06\x00\x00\x00world\x00 // field value size, value, null terminator
\x00                      // 0x00 = EOO, end of object
```
