---
title: XML and HTML format
description: Parse XML and simple HTML markup into JavaScript object trees for protocol and document loaders.
hide_title: true
page_style: designed
---

import {XmlDocsTabs} from '@site/src/components/docs/xml-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Markup format"
  title="Keep verbose service documents navigable."
  description="The XML module turns XML and supported HTML input into object trees that protocol-specific loaders can validate and normalize. It stays intentionally general so WMS, KML, GPX, and other consumers can define their own schemas."
  tone="violet"
  meta={['XML and HTML', 'Object-tree output', 'Protocol-loader foundation']}
  links={[
    {label: 'XML module', to: '/docs/modules/xml'},
    {label: 'XMLLoader', to: '/docs/modules/xml/api-reference/xml-loader'},
    {label: 'KML and GPX', to: '/docs/modules/kml'}
  ]}
/>

<XmlDocsTabs active="format" />

<DocOrientation
  eyebrow="Markup data path"
  title="Parse the tree here. Interpret the protocol next."
  description="XMLLoader handles syntax and tree construction; higher-level modules decide what the elements mean. That separation keeps the general parser small and lets service loaders expose typed contracts."
  tone="violet"
  items={[
    {label: 'Input', value: 'XML documents and supported HTML markup.'},
    {label: 'Parse', value: 'Construct a free-form JavaScript object tree.'},
    {label: 'Normalize', value: 'Let KML, WMS, GPX, or other modules apply protocol semantics.'},
    {label: 'Use', value: 'Inspect metadata or pass a typed result to application code.'}
  ]}
/>

<ReferenceBoundary
  title="XML format and API details"
  description="The reference below covers accepted markup, object-tree conventions, HTML compatibility, and the parser entry points."
  tone="violet"
/>

| Characteristic       | Value                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------ |
| File Format          | [XML](/docs/modules/xml/formats/xml), [HTML](/docs/modules/xml/formats/html)                |
| Data Format          | Free-form JavaScript object tree                                                           |
| File Extensions      | `.xml`, `.html`, `.htm`                                                                    |
| MIME Types           | `application/xml`, `text/xml`, `text/html`                                                  |
| File Type            | Text                                                                                       |
| Loader APIs          | `load`, `parse`, `parseTextSync`                                                           |
| Loader Worker Thread | No                                                                                         |
| Loader Streaming     | No                                                                                         |

## Loaders

<div className="docs-api-card-grid">
  <a className="docs-api-card" href="/docs/modules/xml/api-reference/xml-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>XMLLoader</strong>
    <span>Parses XML text into JavaScript object trees.</span>
    <span className="docs-api-card__meta">Output: object tree</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseTextSync</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/xml/api-reference/html-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>HTMLLoader</strong>
    <span>Parses simple HTML text through the XML parsing path.</span>
    <span className="docs-api-card__meta">Output: object tree</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseTextSync</span>
  </a>
</div>

## Markup

XML and HTML are text markup formats. loaders.gl converts elements, attributes, and text content into JavaScript object structures for application-level processing.

## HTML

`HTMLLoader` is intentionally limited. It is useful for extracting small pieces of information from simple HTML responses, not for browser-grade HTML parsing or rendering.
