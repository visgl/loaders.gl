# Documents

`@loaders.gl/documents` loads XML, HTML, JSON, YAML, TOML, BSON, and a simple Markdown subset. All document parsers are maintained in this repository. XML uses the native SAX implementation; no third-party XML or JSON parser is installed by this package.

```
npm install @loaders.gl/core @loaders.gl/documents
```

The root exports metadata loaders, format descriptors, and shared types. It does not eagerly load parsers, XML dependencies, BSON codecs, or writers. Async core APIs preload implementations:

```
import {load} from '@loaders.gl/core';

import {MarkdownLoader} from '@loaders.gl/documents';



const document = await load('README.md', MarkdownLoader);
```

| Logo                                                                                                            | Format                                                                         | Metadata loader  | Parser import                    | Output                                   |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------- | -------------------------------- | ---------------------------------------- |
| —                                                                                                               | [XML](https://loaders.gl/docs/modules/documents/xml/formats/xml.md)            | `XMLLoader`      | `@loaders.gl/documents/xml`      | JavaScript object                        |
| —                                                                                                               | [HTML](https://loaders.gl/docs/modules/documents/xml/formats/html.md)          | `HTMLLoader`     | `@loaders.gl/documents/html`     | XML-style object                         |
| [![](/images/format-logos/json-logo.gif)JSON](https://loaders.gl/docs/modules/tables/json/formats/json.md)      | [JSON](https://loaders.gl/docs/modules/documents/api-reference/json-loader.md) | `JSONLoader`     | `@loaders.gl/documents/json`     | Any JSON value, without table extraction |
| [![](/images/format-logos/yaml-logo.svg)](https://loaders.gl/docs/modules/documents/config/formats/yaml.md)     | [YAML](https://loaders.gl/docs/modules/documents/config/formats/yaml.md)       | `YAMLLoader`     | `@loaders.gl/documents/yaml`     | Objects, arrays, scalars                 |
| [![](/images/format-logos/toml-logo.svg)TOML](https://loaders.gl/docs/modules/documents/config/formats/toml.md) | [TOML](https://loaders.gl/docs/modules/documents/config/formats/toml.md)       | `TOMLLoader`     | `@loaders.gl/documents/toml`     | JavaScript object                        |
| [![](/images/format-logos/bson-logo.png)](https://loaders.gl/docs/modules/documents/bson/formats/bson.md)       | [BSON](https://loaders.gl/docs/modules/documents/bson/formats/bson.md)         | `BSONLoader`     | `@loaders.gl/documents/bson`     | JavaScript object                        |
| —                                                                                                               | [Markdown](https://loaders.gl/docs/modules/documents/formats/markdown.md)      | `MarkdownLoader` | `@loaders.gl/documents/markdown` | `MarkdownDocument` syntax tree           |

Each parser subpath exports the corresponding `*LoaderWithParser`. Use it for sync parsing:

```
import {parseSync} from '@loaders.gl/core';

import {MarkdownLoaderWithParser} from '@loaders.gl/documents/markdown';



const document = parseSync('# Hello', MarkdownLoaderWithParser);
```

## BSON and Parquet[​](#bson-and-parquet "Direct link to BSON and Parquet")

`@loaders.gl/documents/bson-codec` exports `encodeBSONSync`, `parseBSONSync`, `BSONObjectId`, and `createBSONValue`. Import `BSONWriter` from `@loaders.gl/documents/bson`. The codec preserves the existing BSON wire behavior and Parquet BSON logical-type read/write support. It does not install the MongoDB `bson` package. See the [BSON reference](https://loaders.gl/docs/modules/documents/bson.md).

## XML utilities[​](#xml-utilities "Direct link to XML utilities")

Use `/xml-parser` for `parseXMLSync` and `validateXML`, `/sax-parser` for `SAXParser`, and `/xml-utils` for `convertXMLFieldToArrayInPlace`, `convertXMLValueToArray`, and the existing experimental uncapitalization helpers. Parser and utility entry points are direct subpaths, without format groups.

## Migration and credits[​](#migration-and-credits "Direct link to Migration and credits")

This package replaces `@loaders.gl/xml`, `@loaders.gl/config`, and the tables BSON exports. See the [upgrade guide](https://loaders.gl/docs/upgrade-guide.md) for import replacements and the [source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/documents/THIRD-PARTY-NOTICES.md).

## Native XML policies[​](#native-xml-policies "Direct link to Native XML policies")

XML is strict by default, with one root element, bounded nesting (default 256), safe own-property construction, predefined/numeric entity decoding, and no DTD or external-entity resolution. Options control attribute prefixes/grouping, namespace removal, text keys, scalar coercion, whitespace, and singleton arrays. See [XMLLoader](https://loaders.gl/docs/modules/documents/xml/api-reference/xml-loader.md). HTMLLoader uses the same implementation in a tolerant mode with built-in HTML entities; it remains an XML-style object reader, not an HTML5 DOM parser.

## Package exports[​](#package-exports "Direct link to Package exports")

All exported subpaths (<!-- -->18<!-- -->)

These are the package's public exports, including format entry points, parsers, writers, sources, and worker assets.

| Format                                                                                                          | Import subpath                           |
| --------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| [![](/images/format-logos/bson-logo.png)](https://loaders.gl/docs/modules/documents/bson/formats/bson.md)       | `@loaders.gl/documents/bson`             |
| [![](/images/format-logos/bson-logo.png)](https://loaders.gl/docs/modules/documents/bson/formats/bson.md)       | `@loaders.gl/documents/bson-codec`       |
| [![](/images/format-logos/bson-logo.png)](https://loaders.gl/docs/modules/documents/bson/formats/bson.md)       | `@loaders.gl/documents/bson/bundled`     |
|                                                                                                                 | `@loaders.gl/documents/html`             |
|                                                                                                                 | `@loaders.gl/documents/html/bundled`     |
| [![](/images/format-logos/json-logo.gif)JSON](https://loaders.gl/docs/modules/tables/json/formats/json.md)      | `@loaders.gl/documents/json`             |
| [![](/images/format-logos/json-logo.gif)JSON](https://loaders.gl/docs/modules/tables/json/formats/json.md)      | `@loaders.gl/documents/json/bundled`     |
|                                                                                                                 | `@loaders.gl/documents/markdown`         |
|                                                                                                                 | `@loaders.gl/documents/markdown/bundled` |
|                                                                                                                 | `@loaders.gl/documents/sax-parser`       |
| [![](/images/format-logos/toml-logo.svg)TOML](https://loaders.gl/docs/modules/documents/config/formats/toml.md) | `@loaders.gl/documents/toml`             |
| [![](/images/format-logos/toml-logo.svg)TOML](https://loaders.gl/docs/modules/documents/config/formats/toml.md) | `@loaders.gl/documents/toml/bundled`     |
|                                                                                                                 | `@loaders.gl/documents/xml`              |
|                                                                                                                 | `@loaders.gl/documents/xml-parser`       |
|                                                                                                                 | `@loaders.gl/documents/xml-utils`        |
|                                                                                                                 | `@loaders.gl/documents/xml/bundled`      |
| [![](/images/format-logos/yaml-logo.svg)](https://loaders.gl/docs/modules/documents/config/formats/yaml.md)     | `@loaders.gl/documents/yaml`             |
| [![](/images/format-logos/yaml-logo.svg)](https://loaders.gl/docs/modules/documents/config/formats/yaml.md)     | `@loaders.gl/documents/yaml/bundled`     |
