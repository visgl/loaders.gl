---
title: Writer object format
description: The encoding contract that lets a writer produce compatible files, streams, or batches.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Writer contract"
  title="Make the output boundary as clear as the input."
  description="A writer object identifies its output format and exposes synchronous, asynchronous, or batched encoding functions. Applications can choose the writer without learning its internal codec."
  tone="orange"
  meta={['Output metadata', 'Async encoding', 'Batch writing']}
  links={[
    {label: 'Creating writers', to: '/docs/developer-guide/creating-loaders-and-writers'},
    {label: 'Using writers', to: '/docs/developer-guide/using-writers'}
  ]}
/>

<DocOrientation
  eyebrow="The writer boundary"
  title="Declare the output. Encode the compatible shape."
  description="Writer metadata describes the physical encoding and logical format. The encoder then accepts the category data defined by that format and returns bytes or batches for storage."
  tone="orange"
  items={[
    {label: 'Identify', value: 'Name, extension, category, and format'},
    {label: 'Encode', value: 'Synchronous or asynchronous output'},
    {label: 'Stream', value: 'Release encoded batches incrementally'},
    {label: 'Compose', value: 'Share category data with compatible writers'}
  ]}
/>

To be compatible with `@loaders.gl/core` functions such as `encode`, writer objects need to conform to the following specification:

<ReferenceBoundary
  title="Writer fields and encoder functions"
  description="The sections below define common metadata, synchronous and asynchronous encoders, batched output, and category-data compatibility."
  tone="orange"
/>

### Common fields

| Field | Type | Purpose |
| --- | --- | --- |
| `id` | `string` | Writer identifier and option namespace. |
| `name` | `string` | Human-readable writer name. |
| `module` | `string` | Owning loaders.gl module. |
| `version` | `string` | Version used for runtime assets. |
| `extensions` | `string[]` | Output extensions without leading dots. |
| `options` | `object` | Default writer options. |
| `mimeTypes` | `string[]` | Optional output MIME types. |
| `category` | `string` | Optional accepted data category. |
| `encoding` | `string` | Optional physical serialization. |
| `format` | `string` | Optional logical format. |
| `worker` | `boolean \| string` | Optional worker descriptor. |

`text` and `binary` remain compatibility hints used by encoding helpers. Check the
writer reference for accepted input shapes and supported output methods.

### Encoder Function

| Field                            | Type       | Default | Description                                            |
| -------------------------------- | ---------- | ------- | ------------------------------------------------------ |
| `encodeSync`                     | `Function` | `null`  | Encodes synchronously                                  |
| `encode`                         | `Function` | `null`  | Encodes asynchronously                                 |
| `encodeInBatches` (Experimental) | `Function` | `null`  | Encodes and releases batches through an async iterator |

Note: The format of the input data to the encoders depends on the writer. Category contracts provide shared data shapes, but each writer defines which representations it accepts.
