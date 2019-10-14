# RFC: User definable `fetch` for `load` in loaders.gl

- **Authors**: Ib Green
- **Date**: Sep 2019
- **Status**: Draft

## Abstract

This RFC proposes `options.fetch` as a mechanism for providing options to(and/or overriding) the `fetch` call that loaders.gl `load` function executes to retrieve data.

## Overview

The ability for app to control how data is loaded (or "fetched") is important. Apps need to be able to control options, such

- HTTP method (`GET` or `POST` etc)
- add request headers
- set CORS flags
- etc

Solutions:

- Most of these things can be done by providing options to `fetch`, however this may not be enough.
- There are many different techniques and libraries (`XMLHttpRequest`, company-internal libraries etc) that help users load data into the browser, we want to enable users to use the techniques that work for them.

### `load` vs `parse`

loaders.gl already separates between `load` and `parse` (the latter allowing `fetch` to be called separately), which provides good flexibility in many situations, as it lets applications call any loading method they want.

- Some loaders (e.g. gltf) load additional files, currently they provide ad-hoc solutions for the "recursive" fetch operations.

## Design Critera

- The `fetch` options should automatically (or at least "naturally") extend to e.g. deck.gl (and luma.gl), avoiding designing a similar `fetch` override system twice.

### Future considerations:

- File system support (separate RFC) - Some loaders can generate virtual file systems (zip files, a list of dropped files in the browser, a dropbox loader) where files can be loaded with local names from a non-URL source. Overridable `fetch` in `load` and `parse` could be extended to support this.

## Proposals

### Proposal: Add `options.fetch`

- The fetch option must be forwarded into sub loaders to that it can be recursively applied

### Proposal: `options.fetch` object (DECLARATIVE SUPPORT)

We could support a fetch overload that just takes an object with parameters that are passed to `fetch` (or `fetchFile` if `load` is called).

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
  fetch: url => fetch(url, {headers: {'Company-Access-Token': 'Secret-Value'}})
});
```

TBD - what parameters should the overridden fetch function receive?

If the app wants to redefine `fetch` for some loaders only, it needs to start distinguishing loaders (which is hard to do with the current loaders.gl API).

