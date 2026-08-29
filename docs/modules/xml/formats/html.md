---
title: HTML format
description: A practical, limited XML-style view of HTML responses.
hide_title: true
page_style: designed
---

import {XmlDocsTabs} from '@site/src/components/docs/xml-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="HyperText Markup Language"
  title="Read just enough markup to handle a response."
  description="HTMLLoader provides a lightweight XML-style view of HTML when a service returns an error page or a small piece of useful metadata. It is deliberately not a browser, sanitizer, or full-fidelity HTML parser."
  tone="yellow"
  meta={['HTML', 'XML-style parsing', 'Limited scope']}
  links={[
    {label: 'XML module', to: '/docs/modules/xml'},
    {label: 'HTMLLoader', to: '/docs/modules/xml/api-reference/html-loader'}
  ]}
/>

<XmlDocsTabs active="html" />

<DocOrientation
  eyebrow="The HTML boundary"
  title="Useful structure, without pretending to render a page."
  description="HTMLLoader is intended for small ad-hoc tasks: extracting an error message, finding a URL, or inspecting a response that should have been XML or JSON."
  tone="yellow"
  items={[
    {label: 'Input', value: 'HTML-encoded response data'},
    {label: 'Output', value: 'An untyped tree of tags and values'},
    {label: 'Good fit', value: 'Errors, metadata, and simple extraction'},
    {label: 'Not a fit', value: 'Rendering or standards-complete HTML parsing'}
  ]}
/>

- _[`@loaders.gl/xml`](/docs/modules/xml)_

<ReferenceBoundary
  title="HTMLLoader details"
  description="The sections below document the supported extraction-oriented behavior and its limitations."
  tone="yellow"
/>

HTML (Hyper Text Markup Language) is a (slightly incompatible) profile of XML.

The goals of the `HTMLLoader` in loaders.gl are quite limited.

It is designed for minimal ad-hoc use cases such as

- the extraction of an error string from an HTML formatted error response from a server
- or possibly to extract some valuable information (perhaps the URL to a geospatial service) from a server that doesn't provide more structured return formats (such as JSON or XML).

The `HTMLLoader` is not intended for full fidelity parsing or display of HTML files.
