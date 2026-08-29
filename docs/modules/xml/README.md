---
title: XML
description: Parse XML documents through a streaming-friendly loaders.gl module.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="XML module"
  title="Keep document parsing separate from document meaning."
  description="`@loaders.gl/xml` provides the XML parsing boundary used by format-specific loaders. It exposes XML document processing without forcing applications to depend on one particular geographic, media, or metadata vocabulary."
  tone="cyan"
  meta={['XML', 'Streaming parser', 'HTML loader']}
  links={[
    {label: 'XML loader', to: '/docs/modules/xml/api-reference/xml-loader'},
    {label: 'HTML loader', to: '/docs/modules/xml/api-reference/html-loader'},
    {label: 'XML formats', to: '/docs/modules/xml/formats/xml'}
  ]}
/>

<DocOrientation
  eyebrow="The document parsing path"
  title="Read XML tokens. Let the format loader interpret them."
  description="XML is a syntax layer shared by formats such as KML and other document types. This module handles that layer so higher-level loaders can focus on their own data models."
  tone="cyan"
  items={[
    {label: 'Input', value: 'XML or HTML text and binary resources'},
    {label: 'Parsing', value: 'Token and document structure'},
    {label: 'Consumers', value: 'KML, metadata, and application loaders'},
    {label: 'Output', value: 'Format-specific JavaScript data'}
  ]}
/>

<ReferenceBoundary
  title="Parser and format details"
  description="The reference below covers XML handling, HTML support, installation, parser behavior, and attribution."
  tone="cyan"
/>

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.3-blue.svg?style=flat-square" alt="From-v3.3" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

The `@loaders.gl/xml` module handles the [eXtensible Markup Language](https://www.w3.org/TR/xml/) format.

## XML Format Overview

### Requests

## Remarks

## Installation

```bash
npm install @loaders.gl/xml
npm install @loaders.gl/core
```

## Attribution

This module contains a fork of [sax-ts](https://github.com/Maxim-Mazurok/sax-ts),
which is in turn is a TypeScript fork of Isaac Schlueter's
[sax-js](https://github.com/isaacs/sax-js), both licensed under the MIT-compatible ISC license.

```
Copyright (c) Isaac Z. Schlueter and Contributors
Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```
