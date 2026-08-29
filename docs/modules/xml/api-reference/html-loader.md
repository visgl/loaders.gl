---
title: HTMLLoader
description: Extract useful structure from simple HTML responses.
hide_title: true
page_style: designed
---

import {XmlDocsTabs} from '@site/src/components/docs/xml-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="XML module · loader API"
  title="HTMLLoader"
  description="Parse a limited XML-style view of HTML when a service returns a small error page or useful metadata instead of structured JSON or XML."
  tone="yellow"
  meta={['From v3.4', 'HTML', 'Experimental']}
  links={[
    {label: 'HTML format', to: '/docs/modules/xml/formats/html'},
    {label: 'XML module', to: '/docs/modules/xml'}
  ]}
/>

<XmlDocsTabs active="htmlloader" />

<DocOrientation
  eyebrow="What it is for"
  title="A small extraction tool at an unreliable boundary."
  description="HTMLLoader is useful when an endpoint sends back markup unexpectedly. It exposes enough structure to find an error string or URL, while keeping the scope clear."
  tone="yellow"
  items={[
    {label: 'Good fit', value: 'Error messages and simple extraction'},
    {label: 'Output', value: 'An untyped tree of tags and values'},
    {label: 'Implementation', value: 'XML-style parsing via fast-xml-parser'},
    {label: 'Boundary', value: 'Not a browser or full HTML parser'}
  ]}
/>

<ReferenceBoundary
  title="HTMLLoader reference"
  description="The sections below document usage, returned data, options, and the intentional limitations of this loader."
  tone="yellow"
/>

The `HTMLLoader` parses HTML-encoded data.

> The `HTMLoader` attempts to parse an HTML file as an XML file. It does not have any understanding of the structure of HTML or the document.

> The `HTMLLoader` is only expected to be fit-for-purpose for a few limited use cases.
> It is not intended for full fidelity parsing or display of HTML files. It is designed for minimal ad-hoc use cases such as
>
> - the extraction of an error string from an HTML formatted error response from a server
> - or possibly to extract some valuable information (perhaps the URL to a geospatial service) from a server that doesn't provide more structured return formats (such as JSON or XML).

## Usage

```typescript
import {HTMLLoader} from '@loaders.gl/xml';
import {load} from '@loaders.gl/core';

const data = await load(url, HTMLLoader, options);
```

## Data Format

Unstructured, untyped data in the form a tree of JavaScrip objects representing the hierarchy of tags in the HTML file.

## Options

For options, see the [`XMLLoader`](./xml-loader).

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |

## Attributions

The `HTMLLoader` is a wrapper around [`fast-xml-parser`](https://github.com/NaturalIntelligence/fast-xml-parser).
