---
title: XMLLoader
description: Parse XML into JavaScript data while preserving its document structure.
hide_title: true
page_style: designed
---

import {XmlDocsTabs} from '@site/src/components/docs/xml-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="XML module · loader API"
  title="XMLLoader"
  description="Parse XML into an untyped JavaScript tree, with practical options for adapting namespaces and tag names to application code."
  tone="violet"
  meta={['From v3.3', 'XML', 'Experimental options']}
  links={[
    {label: 'XML format', to: '/docs/modules/xml/formats/xml'},
    {label: 'XML module', to: '/docs/modules/xml'}
  ]}
/>

<XmlDocsTabs active="xmlloader" />

<DocOrientation
  eyebrow="What it returns"
  title="A document tree you can adapt at the boundary."
  description="XMLLoader does not impose a domain schema. It gives application code the XML hierarchy, then lets options handle common JavaScript ergonomics such as camelCase-like keys and namespace prefixes."
  tone="violet"
  items={[
    {label: 'Structure', value: 'Nested tags and values'},
    {label: 'Keys', value: 'Optionally uncapitalize tag names'},
    {label: 'Namespaces', value: 'Optionally remove prefixes'},
    {label: 'Parser', value: 'fast-xml-parser by default'}
  ]}
/>

<ReferenceBoundary
  title="XMLLoader reference"
  description="The sections below cover usage, returned data, options, and parser attribution."
  tone="violet"
/>

The `XMLLoader` parses XML-encoded data.

The goal of the `XMLLoader` is to make it easy for JavaScript applications to access XML formatted data.
It is not intended to be a tool for advanced manipulation of XML data, and options provided are focused
on making the returned data easier to use in JavaScript applications.

## Usage

Load XML data into a javascript data structure and preserve the original structure

```typescript
import {XMLLoader} from '@loaders.gl/xml';
import {load} from '@loaders.gl/core';

const data = await load(url, XMLLoader);
```

Load XML data into a javascript data structure and set options that make the returned data more "JavaScript friendly":

```typescript
import {XMLLoader} from '@loaders.gl/xml';
import {load} from '@loaders.gl/core';

const data = await load(url, XMLLoader, {xml: {uncapitalizeKeys: true, removeNSPrefix: true}});
```

## Data Format

Unstructured, untyped data in the form a tree of JavaScrip objects representing the hierarchy of tags in the XML file.

## Options

| Option             | Type      | Default | Description                                                                                                                                                                           |
| ------------------ | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uncapitalizeKeys` | `boolean` | `false` | XML tags are typically "PascalCase", JavaScript and JSON prefers "camelCase" fields. This setting uncapitalizes all keys in the parsed data (e.g. `ValueList` => `valueList`).        |
| `removeNSPrefix`   | `boolean` | `false` | XML tags sometimes have namespace prefixes. These namespaces are inconvenient in JavaScript field names and can be stripped by setting this option (e.g. `ogc:Feature` -> `Feature`). |
| `_parser`          | `string`  | `'fast-xml-parser'` | Experimental. Selects the XML parser implementation. Use `'internal'` to test the loaders.gl internal parser. |

Remarks:

- It is possible to pass options to the underlying parser, currently `fast-xml-parser`, however there are no guarantees that loaders.gl will continue to use this underlying parser or continue to support those options.
- The internal parser is experimental and opt-in. It is intended to eventually replace the default parser, but the default parser remains `fast-xml-parser` until compatibility has been validated.

## Attributions

The `XMLLoader` is a wrapper around [`fast-xml-parser`](https://github.com/NaturalIntelligence/fast-xml-parser).
