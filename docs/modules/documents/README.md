---
title: Documents
description: Basic document loaders with a lightweight package root and flat parser imports.
---

# Documents

`@loaders.gl/documents` loads XML, HTML, JSON, YAML, TOML, BSON, and a simple Markdown subset.
All document parsers are maintained in this repository. XML uses the native SAX implementation;
no third-party XML or JSON parser is installed by this package.

```bash
npm install @loaders.gl/core @loaders.gl/documents
```

The root exports metadata loaders, format descriptors, and shared types. It does not eagerly
load parsers, XML dependencies, BSON codecs, or writers. Async core APIs preload implementations:

```typescript
import {load} from '@loaders.gl/core';
import {MarkdownLoader} from '@loaders.gl/documents';

const document = await load('README.md', MarkdownLoader);
```

| Format | Metadata loader | Parser import | Output |
| --- | --- | --- | --- |
| [XML](/docs/modules/xml/formats/xml) | `XMLLoader` | `@loaders.gl/documents/xml-loader` | JavaScript object |
| [HTML](/docs/modules/xml/formats/html) | `HTMLLoader` | `@loaders.gl/documents/html-loader` | XML-style object |
| [JSON](/docs/modules/documents/api-reference/json-loader) | `JSONLoader` | `@loaders.gl/documents/json-loader` | Any JSON value, without table extraction |
| [YAML](/docs/modules/config/formats/yaml) | `YAMLLoader` | `@loaders.gl/documents/yaml-loader` | Objects, arrays, scalars |
| [TOML](/docs/modules/config/formats/toml) | `TOMLLoader` | `@loaders.gl/documents/toml-loader` | JavaScript object |
| [BSON](/docs/modules/tables/bson/formats/bson) | `BSONLoader` | `@loaders.gl/documents/bson-loader` | JavaScript object |
| [Markdown](/docs/modules/documents/formats/markdown) | `MarkdownLoader` | `@loaders.gl/documents/markdown-loader` | `MarkdownDocument` syntax tree |

Each parser subpath exports the corresponding `*LoaderWithParser`. Use it for sync parsing:

```typescript
import {parseSync} from '@loaders.gl/core';
import {MarkdownLoaderWithParser} from '@loaders.gl/documents/markdown-loader';

const document = parseSync('# Hello', MarkdownLoaderWithParser);
```

## BSON and Parquet

`@loaders.gl/documents/bson-codec` exports `encodeBSONSync`, `parseBSONSync`, `BSONObjectId`,
and `createBSONValue`. Import `BSONWriter` from `@loaders.gl/documents/bson-writer`.
The codec preserves the existing BSON wire behavior and Parquet BSON logical-type read/write
support. It does not install the MongoDB `bson` package. See the [BSON reference](/docs/modules/tables/bson).

## XML utilities

Use `/xml-parser` for `parseXMLSync` and `validateXML`, `/sax-parser` for `SAXParser`, and `/xml-utils` for
`convertXMLFieldToArrayInPlace`, `convertXMLValueToArray`, and the existing experimental
uncapitalization helpers. Parser and utility entry points are direct subpaths, without format groups.

## Migration and credits

This package replaces `@loaders.gl/xml`, `@loaders.gl/config`, and the tables BSON exports.
See the [upgrade guide](/docs/upgrade-guide) for import replacements and the
[source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/documents/THIRD-PARTY-NOTICES.md).

## Native XML policies

XML is strict by default, with one root element, bounded nesting (default 256), safe own-property
construction, predefined/numeric entity decoding, and no DTD or external-entity resolution.
Options control attribute prefixes/grouping, namespace removal, text keys, scalar coercion,
whitespace, and singleton arrays. See [XMLLoader](/docs/modules/xml/api-reference/xml-loader).
HTMLLoader uses the same implementation in a tolerant mode with built-in HTML entities; it
remains an XML-style object reader, not an HTML5 DOM parser.
