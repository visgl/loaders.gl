BSON module

![](/next/images/format-logos/bson-logo.png)

# Keep JSON-like documents in a binary form.

`@loaders.gl/tables/bson` loads and writes BSON documents as JavaScript objects. It is useful when a binary document format is required but the application wants the familiar JSON data model.

[BSON format](https://loaders.gl/next/docs/modules/tables/bson/formats/bson.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/bson/formats/bson.md)[BSON loader](https://loaders.gl/next/docs/modules/tables/bson/api-reference/bson-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/bson/api-reference/bson-loader.md)[BSON writer](https://loaders.gl/next/docs/modules/tables/bson/api-reference/bson-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/bson/api-reference/bson-writer.md)

Structured data boundaries

## Keep the source shape. Choose the application shape.

JSON, delimited text, BSON, and XML describe data differently. loaders.gl keeps those input boundaries explicit while letting applications choose documents, tables, features, or trees for the next stage.

Input families

[**JSON**nested documents↗](https://loaders.gl/next/docs/modules/tables/json/formats/json.md)[**NDJSON**one record per line↗](https://loaders.gl/next/docs/modules/tables/json/formats/json.md)[**CSV / TSV**delimited rows↗](https://loaders.gl/next/docs/modules/tables/csv/formats/csv.md)[**BSON**typed binary documents↗](https://loaders.gl/next/docs/modules/tables/bson/formats/bson.md)[**XML**namespaced trees↗](https://loaders.gl/next/docs/modules/xml/formats/xml.md)

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

The reference below covers installation, entry points, supported data representation, and the upstream js-bson implementation.

![From-v3.4](https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square)

The `@loaders.gl/tables/bson` module provides support for the [BSON](https://loaders.gl/next/docs/modules/tables/bson/formats/bson.md) format. The BSON format stores arbitrary (loosely structured) data largely equivalent to the textual JSON format.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core @loaders.gl/tables bson@4.2.0
```

`bson` is an optional dependency of `@loaders.gl/tables` and is required for BSON parsing and writing. If optional dependencies were omitted or failed to install, install it explicitly. The installation command above includes the required backend.

## Loaders and Writers[​](#loaders-and-writers "Direct link to Loaders and Writers")

| Loader / Writer                                                                                    | Description                                                    |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [`BSONLoader`](https://loaders.gl/next/docs/modules/tables/bson/api-reference/bson-loader.md) | Loads BSON binary documents into JSON-like JavaScript objects. |
| [`BSONWriter`](https://loaders.gl/next/docs/modules/tables/bson/api-reference/bson-writer.md) | Writes JSON-like JavaScript objects as BSON binary documents.  |

## Attribution[​](#attribution "Direct link to Attribution")

This module is a wrapper around MongoDB [js-bson](https://github.com/mongodb/js-bson) module, which is under Apache 2.0 license.
