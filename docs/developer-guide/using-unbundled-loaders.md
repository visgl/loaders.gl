---
title: Using unbundled loaders
description: Keep broad format support available without putting every parser in the initial application bundle.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation} from '@site/src/components/docs/designed-doc';
import {BundleBoundaryGraphic} from '@site/src/components/docs/bundle-boundary-graphic';

<DocPageHeader
  eyebrow="Bundle boundaries"
  title="Recognize many formats. Download fewer parsers up front."
  description="Unbundled loaders keep metadata in the main application bundle and dynamically load parser implementations when an input actually needs them."
  tone="mint"
  meta={['Metadata-first imports', 'Dynamic parser chunks', 'Tree-shakeable']}
  links={[
    {label: 'Loader categories', to: '/docs/developer-guide/loader-categories'},
    {label: 'Managing dependencies', to: '/docs/developer-guide/dependencies'}
  ]}
/>

<BundleBoundaryGraphic />

<DocOrientation
  eyebrow="When to split a parser"
  title="Keep the application broad without making startup broad."
  description="Use an unbundled import when a format is supported occasionally. Keep the bundled path for formats central to the application or required by synchronous APIs."
  tone="mint"
  items={[
    {label: 'Main bundle', value: 'Loader metadata and format recognition'},
    {label: 'On demand', value: 'Parser implementation loaded at first use'},
    {label: 'Async APIs', value: 'Core preloads the parser automatically'},
    {label: 'Sync APIs', value: 'Use a parser-bearing bundled loader'}
  ]}
/>

Unbundled loaders defer parser code until a format is used. They suit import tools
that recognize many formats but parse only a few in each session. Import a
parser-bearing loader directly when you need synchronous parsing at startup.

## Importing unbundled loaders

Check each module's exports: metadata-only loaders may be available at the root
or through an explicit `/unbundled` subpath. CSV supports both; this example uses
the explicit subpath:

```typescript
import {load} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv/unbundled';

const table = await load(url, CSVLoader);
```

CSV also provides parser-bearing loaders from `@loaders.gl/csv/bundled`:

```typescript
import {CSVLoader} from '@loaders.gl/csv/bundled';
```

The unbundled loader has the same loader id, extensions, MIME types, and option shape as the bundled loader. The difference is that parser methods such as `parse`, `parseSync`, and `parseInBatches` are not present on the imported object. Instead, the loader exposes a `preload` function that core can use to dynamically import the parser-bearing implementation.

## How dynamic loading works

When an async core API such as `load`, `parse`, or `parseInBatches` receives an unbundled loader, it preloads the parser implementation before parsing. The dynamic import gives the application's bundler a natural split point, so the parser implementation can be emitted as a separate application chunk and loaded only when needed.

This is different from pre-built worker loaders. Unbundled loader implementations are not served from the loaders.gl CDN by default. They are application bundle chunks produced by the application's bundler. Pre-built workers, on the other hand, may be loaded as separate worker scripts and can use CDN URLs or explicit `workerUrl` configuration.

## Automatic preload in async APIs

Async core APIs preload unbundled loaders automatically. In most cases, applications can pass an unbundled loader to `load`, `parse`, or `parseInBatches` just like a normal loader:

```typescript
import {parse} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv/unbundled';

const table = await parse(csvText, CSVLoader);
```

The first parse call dynamically imports the parser-bearing implementation. Core caches that implementation, so later async calls with the same loader object and backend option do not repeat the dynamic import.

## `preload()`

Applications can also preload an unbundled loader before the first parse call:

```typescript
import {preload} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv/unbundled';

const parserLoader = await preload(CSVLoader);
```

`preload(loader)` returns the parser-bearing loader implementation and caches it in core. Later async parsing calls with the same unbundled loader and `options[loader.id].backend` value can reuse that implementation.

This is useful when an application can predict that a format will be needed soon, for example after a user opens an import dialog but before they select a file. It can also make error handling more explicit because preload failures happen before the parsing call.

The returned loader can be used directly:

```typescript
import {parse, preload} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv/unbundled';

const parserLoader = await preload(CSVLoader);
const table = await parse(csvText, parserLoader);
```

## `preload()` and `parseSync`

Synchronous APIs cannot start a dynamic import. Preload first, then pass the
returned parser-bearing loader to `parseSync`:

```typescript
import {parseSync, preload} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv/unbundled';

const parserLoader = await preload(CSVLoader);
const table = parseSync(arrayBuffer, parserLoader);
```

If the loader has not been preloaded, `parseSync` will throw. If the loaded implementation does not support synchronous parsing, `parseSync` will still throw and the application should use the async `parse` API instead.

Core can also resolve the original metadata loader from its preload cache.
Calling `loader.preload()` directly does not populate that cache; use the returned
implementation or call core's `preload(loader)`.

## `preloadSync()`

`preloadSync(loader)` returns the cached parser-bearing implementation if one is already available, or `null` if it has not been loaded:

```typescript
import {preloadSync} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv/unbundled';

const parserLoader = preloadSync(CSVLoader);
```

`preloadSync` does not start a dynamic import. It is only a synchronous cache lookup.

## Availability

Check each module's documentation and package exports before using `/unbundled`
or `/bundled`; these subpaths are not available in every module.
