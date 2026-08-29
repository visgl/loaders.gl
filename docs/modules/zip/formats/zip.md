---
title: Zip Archive
description: Read ZIP containers and their random-access entries as a virtual file system.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Archive format"
  title="Open a bundle without unpacking the whole bundle first."
  description="ZIP packages related files behind one container. loaders.gl’s random-access support validates local headers and central-directory metadata so applications can fetch or read individual entries when appropriate."
  tone="blue"
  meta={['ZIP archives', 'ZIP64', 'Random-access entries']}
  links={[
    {label: 'ZIP module', to: '/docs/modules/zip'},
    {label: 'ZipLoader', to: '/docs/modules/zip/api-reference/zip-loader'},
    {label: 'Using loaders', to: '/docs/developer-guide/using-loaders'}
  ]}
/>

<DocOrientation
  eyebrow="The archive path"
  title="Inspect the directory. Select an entry. Read only what the pipeline needs."
  description="The archive boundary separates container validation and entry lookup from the format-specific loader that decodes each selected member."
  tone="blue"
  items={[
    {label: 'Container', value: 'Local headers, central directory, and ZIP64 metadata'},
    {label: 'Lookup', value: 'Entry names, offsets, compressed and uncompressed sizes'},
    {label: 'Read', value: 'Individual members through a virtual file system'},
    {label: 'Decode', value: 'Pass selected entries to their format loaders'}
  ]}
/>

> The [`loaders.gl/zip`](/docs/modules/zip) module provides support for working with Zip Archives.

<ReferenceBoundary
  title="ZIP container and validation details"
  description="The reference below covers local header layouts, data descriptors, ZIP64 validation, random access, and member loading."
  tone="blue"
/>

[ZIP Archive](<https://en.wikipedia.org/wiki/Zip_(file_format)>)

## Supported local header layouts

`ZipFileSystem.fetch()` supports entries whose local headers contain ordinary 32-bit sizes, ZIP64
sizes, or zero sizes followed by a data descriptor. When general-purpose bit 3 indicates a data
descriptor, the central-directory sizes are authoritative; both signed and unsigned descriptors are
supported.

ZIP64 local headers store the uncompressed and compressed sizes as a required pair in the ZIP64
extended information record when either 32-bit local size is the ZIP64 sentinel. A non-sentinel
compressed size remains authoritative for legacy layouts.

## ZIP64 validation

The random-access ZIP header parsers validate required ZIP64 extended information records before
using 64-bit sizes and offsets. Missing, truncated, or incorrectly sized ZIP64 records are rejected
with an `Invalid ZIP archive` error instead of exposing low-level `DataView` range errors.
