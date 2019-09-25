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

### Use-Case: Specifying Options to Individual Loaders without knowing which loader will be picked

### Use-Case: Specifying Options to Sub Loaders

## Proposals

### Deep Merge of Nested Loader Options (Implemented)

Support nested options objects. Each loader type and category has a defined sub-field.

Loader options are merged using a two-level merge. Any object-valued key on the top level will be merged with the corresponding key value in the other object.

### Proposal: Loader subobject naming conventions

It is convenient if the names are valid JS strings, so that they can used as object keys without quoting. Lower case, removing spaces, hyphens and underscores:

- `draco`
- `tileset3d`
- `tile3d`

All loaders for the same format (WorkerLoader, StreamingLoader) would be referenced by the same name.

The user would need to decide the names for custom loaders.

## Problems

But how are these sub field names chosen? The loaders objects have different names, different capitalizations etc.

A bunch of loaders will use the `json` extension (this particular issue is also discussed in a separate RFC).

Since loaders can be pre-registered by other parts of the code, there may not be access to them when we want to use them.

## The JSON problem

The `json` subfield could cover a lot of formats. Should we define `json` to mean the JSON "streaming table" loader specifically, since we'll be doubling down on that loader as one of the primary loaders.gl loaders?
