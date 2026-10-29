Core API / source selection

# Choose a source without hard-coding every URL.

selectSource() makes a best-effort choice from the source loaders an application provides. It combines URL hints, MIME types, and format signatures while keeping the candidate list under application control.

[Core module](https://loaders.gl/next/docs/modules/core.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core.md)[Using sources](https://loaders.gl/next/docs/developer-guide/using-sources.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-sources.md)[Source manager](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/data-source-manager.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/data-source-manager.md)

Source detection

## Automatic selection, explicit scope.

Selection is useful when a URL may point to several supported formats, but the application still decides which source loaders are allowed and whether failure should be reported.

01

Candidates

Pass one source loader or a deliberately scoped list.

02

Hints

Use extensions, MIME types, and initial bytes when available.

03

Override

Force a type only when that source is in the candidate list.

04

Failure

Return null with nothrow or raise a useful selection error.

Detailed guide

## selectSource reference

The detailed reference covers synchronous and asynchronous selection, detection order, candidate lists, overrides, and failure behavior.

![From v4.2](https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square)

`_selectSource` is an experimental synchronous source-loader selector exported from `@loaders.gl/core`. Most applications should use [`createDataSource`](https://loaders.gl/next/docs/modules/core/api-reference/create-data-source.md), which selects and constructs the runtime source. There is no public `selectSourceSync` or `createDataSourceSync` export.

## Usage[​](#usage "Direct link to Usage")

```
import {_selectSource} from '@loaders.gl/core';

import {PMTilesSourceLoader} from '@loaders.gl/tiles/pmtiles';

import {MVTSourceLoader} from '@loaders.gl/tiles/mvt';



const sourceLoader = _selectSource('filename.pmtiles', [PMTilesSourceLoader, MVTSourceLoader]);
```

## Signature[​](#signature "Direct link to Signature")

```
_selectSource(data: string | Blob, sources: SourceLoader[], options?): SourceLoader | null
```

* `data`: a URL or blob used for best-effort format matching.
* `sources`: the candidate source loaders. This API does not maintain a source registry.
* `options.type`: selects a supplied source by its `type`; the default `'auto'` uses loader selection heuristics.
* `options.nothrow`: returns `null` when selection fails if set to `true`; otherwise selection failure throws.

Selection returns a loader, not a runtime source, and does not fetch remote data. `createDataSource` accepts the corresponding selection override in `core.type`.
