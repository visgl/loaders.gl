XML module

XML

# Keep document parsing separate from document meaning.

`@loaders.gl/xml` provides the XML parsing boundary used by format-specific loaders. It exposes XML document processing without forcing applications to depend on one particular geographic, media, or metadata vocabulary.

[XML loader](https://loaders.gl/next/docs/modules/xml/api-reference/xml-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/xml/api-reference/xml-loader.md)[HTML loader](https://loaders.gl/next/docs/modules/xml/api-reference/html-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/xml/api-reference/html-loader.md)[XML formats](https://loaders.gl/next/docs/modules/xml/formats/xml.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/xml/formats/xml.md)

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

The document parsing path

## Read XML tokens. Let the format loader interpret them.

XML is a syntax layer shared by formats such as KML and other document types. This module handles that layer so higher-level loaders can focus on their own data models.

01

Input

XML or HTML text and binary resources

02

Parsing

Token and document structure

03

Consumers

KML, metadata, and application loaders

04

Output

Format-specific JavaScript data

Detailed guide

## Parser and format details

The reference below covers XML handling, HTML support, installation, parser behavior, and attribution.

![From-v3.3](https://img.shields.io/badge/From-v3.3-blue.svg?style=flat-square)![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

The `@loaders.gl/xml` module handles the [eXtensible Markup Language](https://www.w3.org/TR/xml/) format.

## APIs[​](#apis "Direct link to APIs")

* [`XMLLoader`](https://loaders.gl/next/docs/modules/xml/api-reference/xml-loader.md) parses XML into JavaScript values.
* [`HTMLLoader`](https://loaders.gl/next/docs/modules/xml/api-reference/html-loader.md) handles HTML input.
* `parseXMLSync` provides direct synchronous XML parsing.
* `SAXParser` exposes the underlying event-based parser.

The module parses document structure. Protocol-specific interpretation belongs to loaders such as KML and WMS. See the [XML format page](https://loaders.gl/next/docs/modules/xml/formats/xml.md).

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/xml

npm install @loaders.gl/core
```

## Attribution[​](#attribution "Direct link to Attribution")

This module contains a fork of [sax-ts](https://github.com/Maxim-Mazurok/sax-ts), which is in turn is a TypeScript fork of Isaac Schlueter's [sax-js](https://github.com/isaacs/sax-js), both licensed under the MIT-compatible ISC license.

```
Copyright (c) Isaac Z. Schlueter and Contributors

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/xml/THIRD-PARTY-NOTICES.md) and the project-wide [References and credits](https://loaders.gl/next/docs/references-and-credits.md).
