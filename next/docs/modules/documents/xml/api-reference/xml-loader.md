Documents · XML · loader API

[XML](https://loaders.gl/next/docs/modules/documents/xml/formats/xml.md)

# XMLLoader

Parse XML into an untyped JavaScript tree, with practical options for adapting namespaces and tag names to application code.

[XML format](https://loaders.gl/next/docs/modules/documents/xml/formats/xml.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/documents/xml/formats/xml.md)[Documents · XML](https://loaders.gl/next/docs/modules/documents/xml.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/documents/xml.md)

[XML](https://loaders.gl/next/docs/modules/documents/xml/formats/xml.md)[Try It](https://loaders.gl/next/examples/table/xml)[Overview](https://loaders.gl/next/docs/modules/documents/xml/formats/xml.md)[Format](https://loaders.gl/next/docs/modules/documents/xml/format.md)[XMLLoader](https://loaders.gl/next/docs/modules/documents/xml/api-reference/xml-loader.md)[HTML](https://loaders.gl/next/docs/modules/documents/xml/formats/html.md)[HTMLLoader](https://loaders.gl/next/docs/modules/documents/xml/api-reference/html-loader.md)

What it returns

## A document tree you can adapt at the boundary.

XMLLoader does not impose a domain schema. It gives application code the XML hierarchy, then lets options handle common JavaScript ergonomics such as camelCase-like keys and namespace prefixes.

01

Structure

Nested tags and values

02

Keys

Optionally uncapitalize tag names

03

Namespaces

Optionally remove prefixes

04

Parser

Native SAX parser

Detailed guide

## XMLLoader reference

The sections below cover usage, returned data, options, and parser attribution.

The `XMLLoader` parses XML-encoded data.

The goal of the `XMLLoader` is to make it easy for JavaScript applications to access XML formatted data. It is not intended to be a tool for advanced manipulation of XML data, and options provided are focused on making the returned data easier to use in JavaScript applications.

## Usage[​](#usage "Direct link to Usage")

Load XML data into a javascript data structure and preserve the original structure

```
import {XMLLoader} from '@loaders.gl/documents';

import {load} from '@loaders.gl/core';



const data = await load(url, XMLLoader);
```

Load XML data into a javascript data structure and set options that make the returned data more "JavaScript friendly":

```
import {XMLLoader} from '@loaders.gl/documents';

import {load} from '@loaders.gl/core';



const data = await load(url, XMLLoader, {xml: {uncapitalizeKeys: true, removeNSPrefix: true}});
```

## Data Format[​](#data-format "Direct link to Data Format")

Unstructured, untyped data in the form a tree of JavaScrip objects representing the hierarchy of tags in the XML file.

## Options[​](#options "Direct link to Options")

Pass these as `options.xml`; direct `parseXMLSync(text, options)` accepts the same fields.

| Option                | Default   | Behavior                                                              |
| --------------------- | --------- | --------------------------------------------------------------------- |
| `removeNSPrefix`      | `false`   | Remove element/attribute prefixes and namespace declarations.         |
| `uncapitalizeKeys`    | `false`   | Recursively uncapitalize output keys.                                 |
| `textNodeName`        | `'value'` | Field for text accompanying children or attributes.                   |
| `arrayPaths`          | `[]`      | Normalized element paths that always produce arrays, including roots. |
| `attributeNamePrefix` | `''`      | Prefix each attribute field, e.g. `'@_'`.                             |
| `attributesGroupName` | unset     | Put each element's attributes in this named object.                   |
| `ignoreAttributes`    | `false`   | Omit attributes.                                                      |
| `parseTagValue`       | `true`    | Convert finite numeric values and lowercase booleans in element text. |
| `parseAttributeValue` | `false`   | Apply scalar conversion to attributes independently.                  |
| `trimValues`          | `true`    | Trim completed text and attribute values; false preserves whitespace. |
| `processEntities`     | `true`    | Decode entities; false validates references and preserves spelling.   |
| `htmlEntities`        | `false`   | Recognize the built-in HTML named-entity set.                         |
| `strict`              | `true`    | Require well-formed XML. HTMLLoader defaults to false.                |
| `maxDepth`            | `256`     | Maximum element nesting, integer 1–4096.                              |

XML preserves text across text/CDATA chunks. Repeated children become arrays. Prototype-shaped names are ordinary own data fields. Strict parsing rejects malformed documents, multiple roots, duplicate attributes, invalid XML characters, and unknown entities. Processing instructions and DOCTYPE declarations are ignored; external documents are never fetched, and custom DTD entities are not expanded. This is syntax parsing, not schema/DTD validation or namespace-URI validation.

`validateXML(text)` from `@loaders.gl/documents/xml-parser` returns `true` or an `Error`, using the same strict native parser and default nesting budget.

The old `_fastXML`, `_sax`, and `_parser: 'fast-xml-parser'` options are removed. Migrate the supported conversion settings to the native options above. The deprecated `_parser: 'internal'` and `'sax'` names both select this same implementation.

## Attribution[​](#attribution "Direct link to Attribution")

The native object conversion layer is maintained by loaders.gl. Its SAX tokenizer derives from sax-js through sax-ts and retains the ISC license in the documents package.
