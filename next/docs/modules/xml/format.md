Markup format

XML

# Keep verbose service documents navigable.

The XML module turns XML and supported HTML input into object trees that protocol-specific loaders can validate and normalize. It stays intentionally general so WMS, KML, GPX, and other consumers can define their own schemas.

[XML module](https://loaders.gl/next/docs/modules/xml.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/xml.md)[XMLLoader](https://loaders.gl/next/docs/modules/xml/api-reference/xml-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/xml/api-reference/xml-loader.md)[KML and GPX](https://loaders.gl/next/docs/modules/geospatial/kml.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/kml.md)

XML[Try It](https://loaders.gl/next/examples/table/xml)[Overview](https://loaders.gl/next/docs/modules/xml/formats/xml.md)[Format](https://loaders.gl/next/docs/modules/xml/format.md)[XMLLoader](https://loaders.gl/next/docs/modules/xml/api-reference/xml-loader.md)[HTML](https://loaders.gl/next/docs/modules/xml/formats/html.md)[HTMLLoader](https://loaders.gl/next/docs/modules/xml/api-reference/html-loader.md)

Markup data path

## Parse the tree here. Interpret the protocol next.

XMLLoader handles syntax and tree construction; higher-level modules decide what the elements mean. That separation keeps the general parser small and lets service loaders expose typed contracts.

01

Input

XML documents and supported HTML markup.

02

Parse

Construct a free-form JavaScript object tree.

03

Normalize

Let KML, WMS, GPX, or other modules apply protocol semantics.

04

Use

Inspect metadata or pass a typed result to application code.

Detailed guide

## XML format and API details

The reference below covers accepted markup, object-tree conventions, HTML compatibility, and the parser entry points.

| Characteristic       | Value                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| File Format          | [XML](https://loaders.gl/next/docs/modules/xml/formats/xml.md), [HTML](https://loaders.gl/next/docs/modules/xml/formats/html.md) |
| Data Format          | Free-form JavaScript object tree                                                                                                           |
| File Extensions      | `.xml`, `.html`, `.htm`                                                                                                                    |
| MIME Types           | `application/xml`, `text/xml`, `text/html`                                                                                                 |
| File Type            | Text                                                                                                                                       |
| Loader APIs          | `load`, `parse`, `parseTextSync`                                                                                                           |
| Loader Worker Thread | ❌ No                                                                                                                                      |
| Loader Streaming     | ❌ No                                                                                                                                      |

## Loaders[​](#loaders "Direct link to Loaders")

[Loader**XMLLoader**Parses XML text into JavaScript object trees.Output: object treeAPIs: load, parse, parseTextSync](https://loaders.gl/next/docs/modules/xml/api-reference/xml-loader)[Loader**HTMLLoader**Parses simple HTML text through the XML parsing path.Output: object treeAPIs: load, parse, parseTextSync](https://loaders.gl/next/docs/modules/xml/api-reference/html-loader)

## Markup[​](#markup "Direct link to Markup")

XML and HTML are text markup formats. loaders.gl converts elements, attributes, and text content into JavaScript object structures for application-level processing.

## HTML[​](#html "Direct link to HTML")

`HTMLLoader` is intentionally limited. It is useful for extracting small pieces of information from simple HTML responses, not for browser-grade HTML parsing or rendering.
