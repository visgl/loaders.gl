# RFC: User definable `fetch` for `load` in loaders.gl

- **Authors**: Ib Green
- **Date**:
- **Status**: Draft

## Abstract

This RFC proposes a mechanism for overriding and/or providing options to the `fetch` call that loaders.gl `load` function executes to retrieve data.

## Overview

The ability for app to control how data is loaded (or "fetched") is important.

Apps need to be control options, such

- HTTP method (`GET` or `POST` etc)
- add request headers
- set CORS flags
- etc

Most of those things can be done by providing options to fetch, however this may not be enough.

there are many different techniques and libraries (`XMLHttpRequest`, company-internal libraries etc) that help users load data into the browser, we want to enable users to use the techniques that work for them.

### `load` vs `parse`

loaders.gl already separates between `load` and `parse` (the latter allowing `fetch` to be called separately), which provides good flexibility in many situations, as it lets applications call any loading method they want.

However, problems remain:

- And if the app wants to redefine `fetch` for some loaders, it needs to start distinguishing loaders (which is hard to do with the current loaders.gl API).
- Some loaders (e.g. gltf) load additional files, currently they provide ad-hoc solutions for the "recursive" fetch operations.
- (Update: This will no longer apply in v2) Some loaders (mainly image loaders) only support `load`. They do not support separate parsing of data, but instead load and parse in a single operation.


### Future considerations:

- File system support (separate RFC) - Some loaders can generate virtual file systems (zip files, a list of dropped files in the browser, a dropbox loader) where files can be loaded with local names from a non-URL source. Overridable `fetch` in `load` and `parse` could be extended to support this.

## Proposals


## Proposal 1a: Allow fetch to be completely overridden

```js
import {load} from '@loaders.gl/core';
load(INTERNAL_DATA_URL, {
  fetch: url => fetch(url, {headers: {'Company-Access-Token': 'Secret-Value'}})
});
```

Design Notes:

- These APIs can automatically extend to deck.gl
- Do we need to allow `fetch` to be replaced (it is not sufficient to allow users to pass options to `fetch`)? Assume yes.
- The fetch option should be forwarded into loaders to that it can be recursively applied

## Proposal 1b: fetch overload - specify an options object for fetch (DECLARATIVE)

We could support a fetch overload that just takes an object with parameters to `fetch` (which would presumably be the most common use case for overriding fetch):

Allow the `fetch` called by `load` to be customized by supplying standard `fetch` options:

```js
import {load} from '@loaders.gl/core';
load(INTERNAL_DATA_URL, {
  fetch: {headers: {'Company-Access-Token': 'Secret-Value'}}
});
```

Design notes:

- This overload would support declarative usage (json/pydeck/...).

## Idea: Specifying `fetch`-type Options for load-and-parse loaders

When loading images it is useful to specify origin etc to work around CORS issues. These options should be standardized across image loaders, offered as a top-level prop to `load`, and explained in developers guide in the same section as `fetch` overrides.

```js
import {load} from '@loaders.gl/core';
load(DATA_URL, {
  image: {crossOrigin: ''}
});
```

## Alternative: Eliminating load-and-parse loaders

If we did not need to support some loaders that load and parse in a single operation, we could remove `load` from loaders.gl and apps would have good flexibility by always calling `fetch` themselves.

Using modern APIs like [`createImageBitmap`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/createImageBitmap) for image loading could let us get around this limitation but there are still browser limitations and performance would need to be investigated.

There are also subtle instances in the browser security model where images can be loaded and displayed even though the image data can not be loaded directly, so some cases would not be supported in the alternate model. Since these exceptions don't translate to WebGL they are likely not important.

There may however be other parsers (XML?, Media?) provided by the browser that follow the load-and-parse model. If we eliminate support for it now, might we regret not supporting it down the road?
