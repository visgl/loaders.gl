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

`_selectSource` is an experimental synchronous source-loader selector exported
from `@loaders.gl/core`. Most applications should use
[`createDataSource`](./create-data-source), which selects and constructs the runtime
source. There is no public `selectSourceSync` or `createDataSourceSync` export.

## Usage

```typescript
import {_selectSource} from '@loaders.gl/core';
import {PMTilesSourceLoader} from '@loaders.gl/pmtiles';
import {MVTSourceLoader} from '@loaders.gl/mvt';

const sourceLoader = _selectSource('filename.pmtiles', [PMTilesSourceLoader, MVTSourceLoader]);
```

## Signature

```typescript
_selectSource(data: string | Blob, sources: SourceLoader[], options?): SourceLoader | null
```

- `data`: a URL or blob used for best-effort format matching.
- `sources`: the candidate source loaders. This API does not maintain a source registry.
- `options.type`: selects a supplied source by its `type`; the default `'auto'`
  uses loader selection heuristics.
- `options.nothrow`: returns `null` when selection fails if set to `true`;
  otherwise selection failure throws.

Selection returns a loader, not a runtime source, and does not fetch remote data.
`createDataSource` accepts the corresponding selection override in `core.type`.
