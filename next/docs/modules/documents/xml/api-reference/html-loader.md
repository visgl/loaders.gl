Documents · XML · loader API

[XML](https://loaders.gl/next/docs/modules/documents/xml/formats/xml.md)

# HTMLLoader

Parse a limited XML-style view of HTML when a service returns a small error page or useful metadata instead of structured JSON or XML.

[HTML format](https://loaders.gl/next/docs/modules/documents/xml/formats/html.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/documents/xml/formats/html.md)[Documents · XML](https://loaders.gl/next/docs/modules/documents/xml.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/documents/xml.md)

[XML](https://loaders.gl/next/docs/modules/documents/xml/formats/xml.md)[Try It](https://loaders.gl/next/examples/table/xml)[Overview](https://loaders.gl/next/docs/modules/documents/xml/formats/xml.md)[Format](https://loaders.gl/next/docs/modules/documents/xml/format.md)[XMLLoader](https://loaders.gl/next/docs/modules/documents/xml/api-reference/xml-loader.md)[HTML](https://loaders.gl/next/docs/modules/documents/xml/formats/html.md)[HTMLLoader](https://loaders.gl/next/docs/modules/documents/xml/api-reference/html-loader.md)

What it is for

## A small extraction tool at an unreliable boundary.

HTMLLoader is useful when an endpoint sends back markup unexpectedly. It exposes enough structure to find an error string or URL, while keeping the scope clear.

01

Good fit

Error messages and simple extraction

02

Output

An untyped tree of tags and values

03

Implementation

Native tolerant SAX parsing

04

Boundary

Not a browser or full HTML parser

Detailed guide

## HTMLLoader reference

The sections below document usage, returned data, options, and the intentional limitations of this loader.

The `HTMLLoader` parses HTML-encoded data.

> The `HTMLoader` attempts to parse an HTML file as an XML file. It does not have any understanding of the structure of HTML or the document.

> The `HTMLLoader` is only expected to be fit-for-purpose for a few limited use cases. It is not intended for full fidelity parsing or display of HTML files. It is designed for minimal ad-hoc use cases such as
>
> * the extraction of an error string from an HTML formatted error response from a server
> * or possibly to extract some valuable information (perhaps the URL to a geospatial service) from a server that doesn't provide more structured return formats (such as JSON or XML).

In tolerant mode, tag matching is case-insensitive and still preserves the authored case in the result keys. Open elements are closed at end-of-input, so truncated HTML can still produce a partial object tree.

## Usage[​](#usage "Direct link to Usage")

```
import {HTMLLoader} from '@loaders.gl/documents';

import {load} from '@loaders.gl/core';



const data = await load(url, HTMLLoader, options);
```

## Data Format[​](#data-format "Direct link to Data Format")

Unstructured, untyped data in the form a tree of JavaScrip objects representing the hierarchy of tags in the HTML file.

## Options[​](#options "Direct link to Options")

For options, see the [`XMLLoader`](https://loaders.gl/next/docs/modules/documents/xml/api-reference/xml-loader.md).

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |

## Attributions[​](#attributions "Direct link to Attributions")

HTMLLoader uses the native documents SAX parser with `strict: false` and `htmlEntities: true`. It preserves authored tag/attribute case, matches tag names without case sensitivity, and closes open elements at end-of-input. It does not implement the HTML5 tree-construction algorithm. Use a DOM parser for browser-equivalent HTML semantics.
