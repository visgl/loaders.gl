Binary document format

![](/next/images/format-logos/bson-logo.png)

# Keep document semantics in a binary envelope.

BSON stores JSON-like documents with binary encodings for values such as dates, integers, and byte arrays. The module exposes a focused load/write path while keeping the result familiar to JavaScript applications.

[BSON module](https://loaders.gl/next/docs/modules/tables/bson.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/bson.md)[BSONLoader](https://loaders.gl/next/docs/modules/tables/bson/api-reference/bson-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/bson/api-reference/bson-loader.md)[BSONWriter](https://loaders.gl/next/docs/modules/tables/bson/api-reference/bson-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/bson/api-reference/bson-writer.md)

![](/next/images/format-logos/bson-logo.png)[Try It](https://loaders.gl/next/examples/table/bson)[Overview](https://loaders.gl/next/docs/modules/tables/bson/formats/bson.md)[Format](https://loaders.gl/next/docs/modules/tables/bson/format.md)[BSONLoader](https://loaders.gl/next/docs/modules/tables/bson/api-reference/bson-loader.md)[BSONWriter](https://loaders.gl/next/docs/modules/tables/bson/api-reference/bson-writer.md)

Document data path

## Use a binary document without changing the application model.

BSON is useful when a document needs typed binary values or compact transport. loaders.gl decodes it into JSON-like objects and writes compatible objects back to the binary format.

01

Read

Decode BSON elements into JSON-like JavaScript values.

02

Types

Preserve format-specific binary, numeric, and date values.

03

Use

Pass the document to ordinary application logic.

04

Write

Encode JSON-like values as BSON binary documents.

Detailed guide

## BSON format and API details

The reference below lists the document shape, supported value types, loader options, and writer behavior.

## Loaders and Writers[​](#loaders-and-writers "Direct link to Loaders and Writers")

[Loader**BSONLoader**Loads BSON binary documents into JSON-like JavaScript objects.Output: Record\<string, unknown>APIs: load, parse, parseSync](https://loaders.gl/next/docs/modules/tables/bson/api-reference/bson-loader)[Writer**BSONWriter**Writes JSON-like JavaScript objects as BSON binary documents.Input: Record\<string, unknown>APIs: encode, encodeSync](https://loaders.gl/next/docs/modules/tables/bson/api-reference/bson-writer)

| Characteristic | Value                                                                                  |
| -------------- | -------------------------------------------------------------------------------------- |
| File Format    | [BSON](https://bsonspec.org/)                                                          |
| Data Format    | [Unstructured/JSON](https://loaders.gl/next/docs/specifications/category-json.md) |
| File Type      | Binary                                                                                 |
| File Extension | `.bson`                                                                                |
| MIME Types     | `application/bson`                                                                     |
