---
title: selectSource
description: Choose the best source loader from a supplied list using URLs, MIME types, and format signatures.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Core API / source selection"
  title="Choose a source without hard-coding every URL."
  description="selectSource() makes a best-effort choice from the source loaders an application provides. It combines URL hints, MIME types, and format signatures while keeping the candidate list under application control."
  tone="cyan"
  meta={['URL and MIME hints', 'Magic-byte detection', 'Explicit candidates']}
  links={[
    {label: 'Core module', to: '/docs/modules/core'},
    {label: 'Using sources', to: '/docs/developer-guide/using-sources'},
    {label: 'Source manager', to: '/docs/modules/loader-utils/api-reference/data-source-manager'}
  ]}
/>

<DocOrientation
  eyebrow="Source detection"
  title="Automatic selection, explicit scope."
  description="Selection is useful when a URL may point to several supported formats, but the application still decides which source loaders are allowed and whether failure should be reported."
  tone="cyan"
  items={[
    {label: 'Candidates', value: 'Pass one source loader or a deliberately scoped list.'},
    {label: 'Hints', value: 'Use extensions, MIME types, and initial bytes when available.'},
    {label: 'Override', value: 'Force a type only when that source is in the candidate list.'},
    {label: 'Failure', value: 'Return null with nothrow or raise a useful selection error.'}
  ]}
/>

<ReferenceBoundary
  title="selectSource reference"
  description="The detailed reference covers synchronous and asynchronous selection, detection order, candidate lists, overrides, and failure behavior."
  tone="cyan"
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square" alt="From v4.2" />
</p>

The `selectSource()` function will make a "best effort" to select an appropriate source for a specific url or Blob. `selectSource()` is called internally by the
`createDataSource()` and `createDataSourceSync()` functions, but can also be called directly from applications.

Source selection heuristics are based on:

- Filename (or url) extensions
- MIME types (from `Response` `content-type` headers or `Blob.type`/`File.type` fields)
- Initial bytes - for certain inputs, the initial bytes in the supplied data can be compared against known "magic bytes" for various file formats.

## Usage

Select a source from a list of provided sources (best effort):

```typescript
import {selectSourceSync} from '@loaders.gl/core';
import {PMTilesSourceLoader} from '@loaders.gl/pmtiles';
import {MVTSourceLoader} from '@loaders.gl/csv';

selectSourceSync('filename.pmtiles', [PMTilesSourceLoader, MVTSourceLoader]); // => PMTilesSourceLoader
```

## Functions

### selectSource()

```ts
selectSource(data: String | Blob, ..., sources?: Source[], options?): Promise<Source | null>`
```

Selects an appropriate source for a file from a list of candidate sources by examining the `data` parameter, looking at URL extension, mimeType ('Content-Type') and/or an initial data chunk.

Parameters:

- `data` - data to perform autodetection against
- `sources` - can be a single source or an array of sources, or null.
- `options.type` - Force selection to a specific type of source (must still be provided in the source list).
- `options.nothrow`=`false` - Return null instead of throwing exception if no source can be found

Returns:

- A single source (or `null` if `options.nothrow` was set and no matching source was found).

Throws:

- If no matching source was found, and `options.nothrow` was not set.

Regarding the `sources` parameter:

- A single source object will be returned without matching.
- a `null` source list will use the pre-registered list of sources.
- A supplied list of sources will be searched for a matching source.

## Supported Data Formats

The acceptable types for `data` are inferred from the supplied loaders and may include:

- strings / data urls
- `File` and `Blob` objects:

## MIME types

If the standard MIME types for each format are not precise enough, sources.gl also supports [unregistered](https://en.wikipedia.org/wiki/Media_type#Unregistered_tree) MIME types. Each source will match the `application/x.<id>` where the `<id>` is the documented `id` of the source, e.g. `application/x.ply`/`application/x.draco`/etc ...

## Remarks

- File extensions - An attempt will be made to extract a file extension by stripping away query parameters and base path before matching against known source extensions.
