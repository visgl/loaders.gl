---
title: JSON-style category
description: Load structured text and binary records without forcing a specialized application model.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {CategoryDataConcept} from '@site/src/components/home/concepts';

<DocPageHeader
  eyebrow="Loader category"
  title="Structured data without a special application model."
  description="JSON-style loaders cover nested objects, arrays, scalar values, and related document formats. Use the same loaders.gl entry points for JSON, BSON, XML, and HTML when the application needs structured data rather than a geometry or table-specific shape."
  tone="yellow"
  links={[
    {label: 'JSON module', to: '/docs/modules/json'},
    {label: 'Using loaders', to: '/docs/developer-guide/using-loaders'}
  ]}
/>

<CategoryDataConcept initialCategoryId="json" initialRepresentationId="plain" />

<DocOrientation
  eyebrow="Flexible input, explicit output"
  title="Keep the source structure until you know what to do with it."
  description="These loaders preserve nested values and arrays as ordinary JavaScript data. Table-specific loaders and category conversion utilities are available when the next step needs columns instead."
  tone="yellow"
  items={[
    {label: 'Inputs', value: 'JSON, NDJSON, BSON, XML, and HTML'},
    {label: 'Output', value: 'Objects, arrays, scalar values, or streamed records'},
    {label: 'Streaming', value: 'Process newline-delimited records incrementally'},
    {label: 'Next step', value: 'Convert structured data into tables or application models'}
  ]}
/>

The JSON-style category is for loosely structured values that do not need a geometry- or
table-specific result shape. Its loaders can return:

- objects with name/value pairs,
- arrays with integer indexes, and
- fundamental scalar values such as strings, numbers, booleans, and `null`.

<ReferenceBoundary
  title="The structured-data details"
  description="The sections below list category loaders and describe the data structures they return."
  tone="yellow"
/>

## JSON Category Loaders

| Loader                                                       | Notes                                      |
| ------------------------------------------------------------ | ------------------------------------------ |
| [`JSONLoader`](/docs/modules/json/api-reference/json-loader) | JSON documents and nested values           |
| [`BSONLoader`](/docs/modules/bson/api-reference/bson-loader) | Binary JSON documents                       |
| [`XMLLoader`](/docs/modules/xml/api-reference/xml-loader)    | XML documents represented as JavaScript data |
| [`HTMLLoader`](/docs/modules/xml/api-reference/html-loader)  | HTML documents and fragments               |
| [`YAMLLoader`](/docs/modules/config/api-reference/yaml-loader) | Human-readable YAML documents; provided by `@loaders.gl/config`. |
| [`TOMLLoader`](/docs/modules/config/api-reference/toml-loader) | Configuration-oriented TOML documents; provided by `@loaders.gl/config`. |

## Data Structure

Objects and arrays can contain other objects, arrays, or primitive values.

YAML and TOML are not JSON syntax, but their parsers produce the same general JavaScript data
shapes and are therefore included here for discovery alongside other JSON-style loaders.
