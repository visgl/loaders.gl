# RFC: loader option system

- **Authors**: Ib Green
- **Date**: Jun 2019
- **Status**: Draft

## Summary

This RFC proposes a system for organizing loader options into subobjects, providing a structured way to pass options to multiple loaders, particularly in situations where it is not known in advance which loader will be selected, or when a loaders invokes other sub loaders.

## Motivation

When asking loaders.gl to load or parse a file using a list of loaders, and it is not clear in advance which loader will be picked, being able to do something like the following would look very pretty:

```js
load(url, {
  json: {...},
  csv: {...},
  '3d-tiles': {...},
  gltf: {...}
});
```

## Problems

### Use-Case:

But how are these names resolved? The loaders objects have different names, different capitalizations etc.

A bunch of loaders will use the `json` extension (this particular issue is also discussed in a separate RFC).

Since loaders can be pre-registered by other parts of the code, there may not be access to them when we want to use them.



## Proposals

### Loader Options Object

loaders.gl uses a nested options object. Each loader type and category has a defined sub-field.

Loader options are merged using a two-level merge. Any object-valued key on the top level will be merged with the corresponding key value in the other object.

### Allowing Loaders to be named

Using the loader name.

- 'draco' - would resolve to the "preferred" loader supporting Draco.
- 'las' - would resolve to the "preferred" loader supporting LAZ.

```js
parse(arrayBuffer, 'draco', ...); // throws if draco loader not available...
```

```js
import {isLoaderAvailable} from `@loaders.gl/core`;
```

## The JSON problem

`json` could cover a lot of formats. Should we define `json` to mean the JSON "streaming table" loader specifically, since we'll be doubling down on that loader as one of the primary loaders.gl loaders?

## Proposals

### Proposal: selectLoader (Implemented)

Add a `selectLoader` API to give the application access to the loader selection algorithm.

### Proposal: Loader naming conventions

It is convenient if the names are valid JS strings, so that they can used as object keys without quoting. Lower case, removing spaces, hyphens and underscores:

- `draco`
- `tileset3d`
- `tile3d`

All loaders for the same format (WorkerLoader, StreamingLoader) would be referenced by the same name.

The user would need to decide the names for custom loaders.


### Use-Case Specifying Options to Individual Loaders with having access to the loaders


### Proposal: Resolution Rules

But how are these names resolved? The loaders objects have different names, different capitalizations etc.

A bunch of loaders will use the `json` extension (this particular issue is also discussed in a separate RFC).

