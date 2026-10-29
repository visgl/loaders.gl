HyperText Markup Language

HTML

# Read just enough markup to handle a response.

HTMLLoader provides a lightweight XML-style view of HTML when a service returns an error page or a small piece of useful metadata. It is deliberately not a browser, sanitizer, or full-fidelity HTML parser.

[XML module](https://loaders.gl/next/docs/modules/xml.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/xml.md)[HTMLLoader](https://loaders.gl/next/docs/modules/xml/api-reference/html-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/xml/api-reference/html-loader.md)

XML[Try It](https://loaders.gl/next/examples/table/xml)[Overview](https://loaders.gl/next/docs/modules/xml/formats/xml.md)[Format](https://loaders.gl/next/docs/modules/xml/format.md)[XMLLoader](https://loaders.gl/next/docs/modules/xml/api-reference/xml-loader.md)[HTML](https://loaders.gl/next/docs/modules/xml/formats/html.md)[HTMLLoader](https://loaders.gl/next/docs/modules/xml/api-reference/html-loader.md)

The HTML boundary

## Useful structure, without pretending to render a page.

HTMLLoader is intended for small ad-hoc tasks: extracting an error message, finding a URL, or inspecting a response that should have been XML or JSON.

01

Input

HTML-encoded response data

02

Output

An untyped tree of tags and values

03

Good fit

Errors, metadata, and simple extraction

04

Not a fit

Rendering or standards-complete HTML parsing

* *[`@loaders.gl/xml`](https://loaders.gl/next/docs/modules/xml.md)*

Detailed guide

## HTMLLoader details

The sections below document the supported extraction-oriented behavior and its limitations.

HTML (Hyper Text Markup Language) is a (slightly incompatible) profile of XML.

The goals of the `HTMLLoader` in loaders.gl are quite limited.

It is designed for minimal ad-hoc use cases such as

* the extraction of an error string from an HTML formatted error response from a server
* or possibly to extract some valuable information (perhaps the URL to a geospatial service) from a server that doesn't provide more structured return formats (such as JSON or XML).

The `HTMLLoader` is not intended for full fidelity parsing or display of HTML files.
