# RFC: User definable `fetch` for loaders.gl

- **Authors**: Ib Green
- **Date**: Jun 2020
- **Status**: Draft

> This RFC supersedes the older fetch-option-rfc.md from Sep 2019

## Abstract

This RFC proposes `options.fetch` as a mechanism for providing options to(and/or overriding) the `fetch` call that loaders.gl `load` function executes to retrieve data.

## Requirements

### Provide options to fetch

The ability for app to control how data is loaded (or "fetched") is important. Apps need to be able to control options, such

- HTTP method (`GET` or `POST` etc)
- add request headers
- set CORS flags
- etc

### Use alternative fetch function

- Most of these things can be done by providing options to `fetch`, however this may not be enough.
- There are many different techniques and libraries (`XMLHttpRequest`, company-internal libraries etc) that help users load data into the browser, we want to enable users to use the techniques that work for them.

### Provide a "virtual" fetch

Overridable fetch function also enables a way to supply virtual file systems for ZIP files or Browser `FileList` objects to multi-file loaders (e.g. `ShapefileLoader` and `GLTFLoader`).

Detail: File system support (separate RFC) - Some loaders can load additional files (Shapefile "sidecar" files, or glTF assets etc). Sometimes these files are provided together with the main file, and a way to handle this is to bundle them as a virtual file system (zip files, a list of dropped files in the browser, a dropbox loader) where files can be loaded with local names from a non-URL source.

### `load` vs `parse`

loaders.gl already separates between `load` and `parse` (the latter allowing `fetch` to be called separately), which provides good flexibility in many situations, as using `parse` lets applications call any loading method they want.

However, some loaders (e.g. gltf) load additional files, and currently glTF implementes an ad-hoc solutions for the "recursive" fetch operations.

## Sub-loader support

The user supplied fetch function/fetch options should be passed through the loader context to sub-loaders.

## Design Critera

- deck.gl integration: The `fetch` options should automatically (or at least "naturally") extend to e.g. deck.gl (and luma.gl), avoiding designing a similar `fetch` override system twice. deck.gl already has `loadOptions` and a separate `fetch` prop. Can `loadOptions.fetch` replace the latter?

## Proposals

### Proposal: Add `options.fetch` to loaders.gl loader object

- The fetch option must be forwarded into sub loaders to that it can be recursively applied.

### Proposal: `options.fetch` can be an object (DECLARATIVE SUPPORT)

We could support a fetch overload that just takes an object with parameters that are passed to `fetch` (or `fetchFile`, if `load` is called).

Allow the `fetch` called by `load` to be customized by supplying standard `fetch` options:

```js
import {load} from '@loaders.gl/core';
load(INTERNAL_DATA_URL, {
  fetch: {headers: {'Company-Access-Token': 'Secret-Value'}}
});
```

Design notes:

- This which would presumably be the most common use case for supplying fetch options
- This overload would support declarative usage (json/pydeck/...).

### Proposal: Allow fetch to be set to a function

```js
import {load} from '@loaders.gl/core';
load(INTERNAL_DATA_URL, {
  fetch: (url) => fetch(url, {headers: {'Company-Access-Token': 'Secret-Value'}})
});
```

TBD - what parameters should the overridden fetch function receive?

If the app wants to redefine `fetch` for some loaders only, it needs to start distinguishing loaders (which is hard to do with the current loaders.gl API).
