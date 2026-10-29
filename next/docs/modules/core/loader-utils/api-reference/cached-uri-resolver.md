Loader utilities / resource paths

# Resolve related resources from one stable base.

CachedUriResolver handles URL and filesystem-like references for a metadata parse or source. It memoizes derived strings, but deliberately does not fetch or cache resource bodies.

[Loader utilities](https://loaders.gl/next/docs/modules/core/loader-utils.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/loader-utils.md)[3D Tiles resources](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/resource-resolution-and-content-detection.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/resource-resolution-and-content-detection.md)[Path prefixes](https://loaders.gl/next/docs/modules/core/api-reference/set-path-prefix.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/api-reference/set-path-prefix.md)

URI resolution

## Keep references portable and the cache narrow.

A format can store relative paths while the source supplies the actual base URL. Scope the resolver to one dataset so URLs from unrelated origins or authentication contexts do not mix.

01

Base

Parse a URL or filesystem-like base once.

02

Resolve

Handle relative, absolute, data, and protocol URLs.

03

Reuse

Memoize repeated source strings as derived paths.

04

Clear

Discard derivations while retaining the parsed base.

Detailed guide

## CachedUriResolver reference

The detailed reference covers base-path rules, resolve(), clear(), absolute references, and cache scope.

`CachedUriResolver` resolves relative resource references against one stable URL or filesystem-like base. It parses a URL base once and memoizes resolved strings by their exact input spelling.

```
import {CachedUriResolver} from '@loaders.gl/core/loader-utils';



const resolver = new CachedUriResolver('https://example.com/tiles/root');



resolver.resolve('../content/tile.glb');

// https://example.com/tiles/content/tile.glb
```

## Constructor[​](#constructor "Direct link to Constructor")

### `new CachedUriResolver(basePath)`[​](#new-cacheduriresolverbasepath "Direct link to new-cacheduriresolverbasepath")

* `basePath: string` — directory path or absolute base URI used for relative references.

URL bases use the platform `URL` implementation. Filesystem-like bases use loaders.gl path semantics. Absolute paths and absolute URIs remain absolute.

## Methods[​](#methods "Direct link to Methods")

### `resolve(uri): string`[​](#resolveuri-string "Direct link to resolveuri-string")

Resolves a relative path, absolute path, data URL, or absolute URI. Repeated calls with the same source string return the cached derivation.

The cache contains strings only; it does not fetch or retain resource bodies. Scope the resolver to one metadata parse or data source so unrelated datasets and authentication contexts do not share derived URLs.

### `clear(): void`[​](#clear-void "Direct link to clear-void")

Clears derived strings while retaining the parsed base URL. Call this when state outside the URI spelling changes how a caller interprets the result.

The [3D Tiles resource guide](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/resource-resolution-and-content-detection.md) describes how this helper is scoped during tileset-header normalization and how the separate source query cache is invalidated.
