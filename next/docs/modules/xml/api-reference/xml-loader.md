XML module · loader API

XML

# XMLLoader

Parse XML into an untyped JavaScript tree, with practical options for adapting namespaces and tag names to application code.

[XML format](https://loaders.gl/next/docs/modules/xml/formats/xml.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/xml/formats/xml.md)[XML module](https://loaders.gl/next/docs/modules/xml.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/xml.md)

XML[Try It](https://loaders.gl/next/examples/table/xml)[Overview](https://loaders.gl/next/docs/modules/xml/formats/xml.md)[Format](https://loaders.gl/next/docs/modules/xml/format.md)[XMLLoader](https://loaders.gl/next/docs/modules/xml/api-reference/xml-loader.md)[HTML](https://loaders.gl/next/docs/modules/xml/formats/html.md)[HTMLLoader](https://loaders.gl/next/docs/modules/xml/api-reference/html-loader.md)

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

fast-xml-parser by default

Detailed guide

## XMLLoader reference

The sections below cover usage, returned data, options, and parser attribution.

The `XMLLoader` parses XML-encoded data.

The goal of the `XMLLoader` is to make it easy for JavaScript applications to access XML formatted data. It is not intended to be a tool for advanced manipulation of XML data, and options provided are focused on making the returned data easier to use in JavaScript applications.

## Usage[​](#usage "Direct link to Usage")

Load XML data into a javascript data structure and preserve the original structure

```
import {XMLLoader} from '@loaders.gl/xml';

import {load} from '@loaders.gl/core';



const data = await load(url, XMLLoader);
```

Load XML data into a javascript data structure and set options that make the returned data more "JavaScript friendly":

```
import {XMLLoader} from '@loaders.gl/xml';

import {load} from '@loaders.gl/core';



const data = await load(url, XMLLoader, {xml: {uncapitalizeKeys: true, removeNSPrefix: true}});
```

## Data Format[​](#data-format "Direct link to Data Format")

Unstructured, untyped data in the form a tree of JavaScrip objects representing the hierarchy of tags in the XML file.

## Options[​](#options "Direct link to Options")

| Option             | Type      | Default             | Description                                                                                                                                                                           |
| ------------------ | --------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uncapitalizeKeys` | `boolean` | `false`             | XML tags are typically "PascalCase", JavaScript and JSON prefers "camelCase" fields. This setting uncapitalizes all keys in the parsed data (e.g. `ValueList` => `valueList`).        |
| `removeNSPrefix`   | `boolean` | `false`             | XML tags sometimes have namespace prefixes. These namespaces are inconvenient in JavaScript field names and can be stripped by setting this option (e.g. `ogc:Feature` -> `Feature`). |
| `_parser`          | `string`  | `'fast-xml-parser'` | Experimental. Selects the XML parser implementation. Use `'internal'` to test the loaders.gl internal parser.                                                                         |

Remarks:

* It is possible to pass options to the underlying parser, currently `fast-xml-parser`, however there are no guarantees that loaders.gl will continue to use this underlying parser or continue to support those options.
* The internal parser is experimental and opt-in. It is intended to eventually replace the default parser, but the default parser remains `fast-xml-parser` until compatibility has been validated.

## Attributions[​](#attributions "Direct link to Attributions")

The `XMLLoader` is a wrapper around [`fast-xml-parser`](https://github.com/NaturalIntelligence/fast-xml-parser).
