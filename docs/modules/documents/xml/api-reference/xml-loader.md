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
  format="xml"
  eyebrow="Documents · XML · loader API"
  title="XMLLoader"
  description="Parse XML into an untyped JavaScript tree, with practical options for adapting namespaces and tag names to application code."
  tone="violet"
  meta={['From v3.3', 'XML', 'Experimental options']}
  links={[
    {label: 'XML format', to: '/docs/modules/documents/xml/formats/xml'},
    {label: 'Documents · XML', to: '/docs/modules/documents/xml'}
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
    {label: 'Parser', value: 'Native SAX parser'}
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
import {XMLLoader} from '@loaders.gl/documents';
import {load} from '@loaders.gl/core';

const data = await load(url, XMLLoader);
```

Load XML data into a javascript data structure and set options that make the returned data more "JavaScript friendly":

```typescript
import {XMLLoader} from '@loaders.gl/documents';
import {load} from '@loaders.gl/core';

const data = await load(url, XMLLoader, {xml: {uncapitalizeKeys: true, removeNSPrefix: true}});
```

## Data Format

Unstructured, untyped data in the form a tree of JavaScrip objects representing the hierarchy of tags in the XML file.

## Options

Pass these as `options.xml`; direct `parseXMLSync(text, options)` accepts the same fields.

| Option | Default | Behavior |
| --- | --- | --- |
| `removeNSPrefix` | `false` | Remove element/attribute prefixes and namespace declarations. |
| `uncapitalizeKeys` | `false` | Recursively uncapitalize output keys. |
| `textNodeName` | `'value'` | Field for text accompanying children or attributes. |
| `arrayPaths` | `[]` | Normalized element paths that always produce arrays, including roots. |
| `attributeNamePrefix` | `''` | Prefix each attribute field, e.g. `'@_'`. |
| `attributesGroupName` | unset | Put each element's attributes in this named object. |
| `ignoreAttributes` | `false` | Omit attributes. |
| `parseTagValue` | `true` | Convert finite numeric values and lowercase booleans in element text. |
| `parseAttributeValue` | `false` | Apply scalar conversion to attributes independently. |
| `trimValues` | `true` | Trim completed text and attribute values; false preserves whitespace. |
| `processEntities` | `true` | Decode entities; false validates references and preserves spelling. |
| `htmlEntities` | `false` | Recognize the built-in HTML named-entity set. |
| `strict` | `true` | Require well-formed XML. HTMLLoader defaults to false. |
| `maxDepth` | `256` | Maximum element nesting, integer 1–4096. |

XML preserves text across text/CDATA chunks. Repeated children become arrays. Prototype-shaped
names are ordinary own data fields. Strict parsing rejects malformed documents, multiple roots,
duplicate attributes, invalid XML characters, and unknown entities. Processing instructions and
DOCTYPE declarations are ignored; external documents are never fetched, and custom DTD entities
are not expanded. This is syntax parsing, not schema/DTD validation or namespace-URI validation.

`validateXML(text)` from `@loaders.gl/documents/xml-parser` returns `true` or an `Error`, using
the same strict native parser and default nesting budget.

The old `_fastXML`, `_sax`, and `_parser: 'fast-xml-parser'` options are removed. Migrate the
supported conversion settings to the native options above. The deprecated `_parser: 'internal'`
and `'sax'` names both select this same implementation.

## Attribution

The native object conversion layer is maintained by loaders.gl. Its SAX tokenizer derives from
sax-js through sax-ts and retains the ISC license in the documents package.
