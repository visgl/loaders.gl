# CachedUriResolver

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
