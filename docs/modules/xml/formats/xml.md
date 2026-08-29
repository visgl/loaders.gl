---
title: XML format
description: A flexible markup foundation used by many established data formats.
hide_title: true
page_style: designed
---

import {XmlDocsTabs} from '@site/src/components/docs/xml-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Extensible Markup Language"
  title="Parse the structure without hiding the details."
  description="XML supplies a portable tree of elements, attributes, namespaces, and text. loaders.gl exposes that structure as JavaScript data so applications can work with XML-based formats without committing to a single schema."
  tone="violet"
  meta={['XML 1.0', 'Tree-shaped', 'Schema-neutral']}
  links={[
    {label: 'XML module', to: '/docs/modules/xml'},
    {label: 'XMLLoader', to: '/docs/modules/xml/api-reference/xml-loader'}
  ]}
/>

<XmlDocsTabs active="overview" />

<DocOrientation
  eyebrow="The XML model"
  title="A tree first. Meaning comes from the schema."
  description="XML defines the syntax for nested data, but not the domain meaning. Individual standards add that meaning through their own element names, namespaces, and schemas."
  tone="violet"
  items={[
    {label: 'Elements', value: 'Nested nodes with names and content'},
    {label: 'Attributes', value: 'Compact metadata attached to nodes'},
    {label: 'Namespaces', value: 'Names that remain distinct across vocabularies'},
    {label: 'Schemas', value: 'Domain rules supplied by each XML format'}
  ]}
/>

- _[`@loaders.gl/xml`](/docs/modules/xml)_
- _[Wikipedia article](https://en.wikipedia.org/wiki/XML)_

<ReferenceBoundary
  title="XML and JavaScript data"
  description="The sections below cover the practical conversion choices made when XML is represented as JavaScript objects."
  tone="violet"
/>

XML (eXtensible Markup Language) is a markup language and file format for storing, transmitting, and reconstructing arbitrary data.

Just like JSON, XML is not quite a format in itself, in that it doesn't define a schema. Rather other formats are defined as XML-based formats.

The "schema" of specific XML based formats are typically described in the documentation of that format or standard. However a format specific schema can also be formally described using _XML Schemas_. This article does not go deeply into these, but here are some notes on XML Schemas below.

XML was very successful and experienced a huge wave of adoption in the late 1990s and early 2000s, and it sometimes feels like most things were XML encoded one way or another at that time.

However, XML is not a client friendly format, and it has largely fallen out of favor, being replaced (often by JSON) as the base syntax for new formats. While it is rare to see a new format today being based on XML, we still have a large number of XML-based data formats that remain in use, meaning that we still need to parse (and in some, more rare cases, generate) XML for a long time to come.

## Converting between XML and JavaScript / JSON data structures

### Arrays

Structurally, XML does not have a formal array type.
A repetition of XML elements with the same tag name is typically converted into a JS array with that name, however when only a single element or no element with that tag is provided in an XML file, it is not possible for an XML parser to conclude that this is intended to be an array.

### Tag Names

- JavaScript prefers camelCase where XML favors PascalCase, so a simple conversion step can make the parsed data more natural to use in JS.
- Namespaced tags complicate things in JavaScripts and it is often simplest to just strip XML namespaces from tags.

## Converting between JavaScript / JSON and XML

### Arrays

XML has no standalone array type. A sequence of sibling elements with the same name is commonly
represented as a JavaScript array, while a single occurrence is represented as one value. This
means a consumer that needs a stable array shape should normalize both cases at its application
boundary, and should keep XML schema knowledge outside the generic XML parser.

## XML schemas

As XML is really just a lexical format without semantics, actual XML-based formats define the "schema" of the XML file. These schemas can optionally be formally defined by so called XML schemas (which are of course are also defined in XML).

Although it would seem to be appealing to be able to automatically generate parsers, typescript types and even JSON schema from XML schemas, this is not trivial.

In fact, XML schemas are not always practical to work with in JavaScript.

- The XML schema definition is sophisticated and takes time to learn.
- Schemas tend to get very verbose and can be in the megabytes.
- Creating an XML schema from scratch is usually out of the question unless you have time to devote to this.
- Even if you find high-quality XML schemas for the formats you are interested in, using them in order to implement small specific parsers quickly becomes overkill.

(Naturally, it could be a different story in server languages like Java, with extensive mature framework support for XML).
