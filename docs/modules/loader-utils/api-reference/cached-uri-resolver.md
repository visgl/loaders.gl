---
title: CachedUriResolver
description: Resolve repeated relative resource references against one dataset base without fetching or retaining resource bodies.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Loader utilities / resource paths"
  title="Resolve related resources from one stable base."
  description="CachedUriResolver handles URL and filesystem-like references for a metadata parse or source. It memoizes derived strings, but deliberately does not fetch or cache resource bodies."
  tone="blue"
  meta={['Relative references', 'String-only cache', 'Dataset-scoped']}
  links={[
    {label: 'Loader utilities', to: '/docs/modules/loader-utils'},
    {label: '3D Tiles resources', to: '/docs/modules/3d-tiles/concepts/resource-resolution-and-content-detection'},
    {label: 'Path prefixes', to: '/docs/modules/core/api-reference/set-path-prefix'}
  ]}
/>

<DocOrientation
  eyebrow="URI resolution"
  title="Keep references portable and the cache narrow."
  description="A format can store relative paths while the source supplies the actual base URL. Scope the resolver to one dataset so URLs from unrelated origins or authentication contexts do not mix."
  tone="blue"
  items={[
    {label: 'Base', value: 'Parse a URL or filesystem-like base once.'},
    {label: 'Resolve', value: 'Handle relative, absolute, data, and protocol URLs.'},
    {label: 'Reuse', value: 'Memoize repeated source strings as derived paths.'},
    {label: 'Clear', value: 'Discard derivations while retaining the parsed base.'}
  ]}
/>

<ReferenceBoundary
  title="CachedUriResolver reference"
  description="The detailed reference covers base-path rules, resolve(), clear(), absolute references, and cache scope."
  tone="blue"
/>

`CachedUriResolver` resolves relative resource references against one stable URL or filesystem-like base. It parses a URL base once and memoizes resolved strings by their exact input spelling.

```typescript
import {CachedUriResolver} from '@loaders.gl/loader-utils';

const resolver = new CachedUriResolver('https://example.com/tiles/root');

resolver.resolve('../content/tile.glb');
// https://example.com/tiles/content/tile.glb
```

## Constructor

### `new CachedUriResolver(basePath)`

- `basePath: string` — directory path or absolute base URI used for relative references.

URL bases use the platform `URL` implementation. Filesystem-like bases use loaders.gl path semantics. Absolute paths and absolute URIs remain absolute.

## Methods

### `resolve(uri): string`

Resolves a relative path, absolute path, data URL, or absolute URI. Repeated calls with the same source string return the cached derivation.

The cache contains strings only; it does not fetch or retain resource bodies. Scope the resolver to one metadata parse or data source so unrelated datasets and authentication contexts do not share derived URLs.

### `clear(): void`

Clears derived strings while retaining the parsed base URL. Call this when state outside the URI spelling changes how a caller interprets the result.

The [3D Tiles resource guide](/docs/modules/3d-tiles/concepts/resource-resolution-and-content-detection) describes how this helper is scoped during tileset-header normalization and how the separate source query cache is invalidated.
