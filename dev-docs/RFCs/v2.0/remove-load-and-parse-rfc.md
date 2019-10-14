
# RFC: Convert load-and-parse loaders to `parse` loaders

- **Authors**: Ib Green
- **Date**: Sep 2019
- **Status**: Implemented

## Abstract

This RFC proposes removing support for `loadAndParse` loaders.

## Background

By not providing loaders that have to load and parse in a single operation, `load` will always call `fetch` (or any application-provided override).

## Proposal: Convert load-and-parse loaders to `parse` loaders

Remove `loadAndParse` support in core and loaders. Replace with `parse`.

### Impact analysis: Image Loading

The only v1.0 loader that uses `loadAndParse` is the `ImageLoader`. This is to allow `Image.src` to be set directly to a URL.

However, `Image.src` can also be set to an ObjectURL created from an in-memory `Blob`, which can be created from an `ArrayBuffer` returned by fetch.

**Performance** - It is possible that there is a slight performance difference between doing a direct load from file and creating the `Blob` manually, but between network access and image decoding that perf difference would likely not be significant.

More importantly, given that evergreen browsers support modern APIs like [`createImageBitmap`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/createImageBitmap) for image loading (that do require separate `fetch` calls), the older `Image` API will mainly be used on old browsers (IE11, Edge), consisting of single-digit percentage of users, which does not justify a more complicated architecture to secure a small perf gain.

**Security** There are some subtle instances related to browser security model where images can be loaded and displayed even though the image data can not be loaded directly, so some cross-origin images that can be loaded by `Image.src` to URLs would not be supported in the alternate model.

Now, even though such cross-origin images can be loaded for "opaque" access (display in DOM), it is not possible to access their data (e.g. to initialize WebGL textures). Because of the restricted use case and these limitations, it is not considered worthwhile to maintain a special loading API just to support this case.

## Future Concerns

There may however be other parsers (Scripts, Media?) provided by the browser that can only be done with (or benefit from) the load-and-parse model (or lose security checks if it is not followed).

If we eliminate support for it now, might we regret not supporting it down the road?
