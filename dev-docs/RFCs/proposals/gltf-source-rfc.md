# RFC: GLTFSource — persistent, incremental glTF scene access

Status: Proposal

## Motivation

`GLTFLoader` provides one-shot loading, while `GLTFScenegraph` and `GLTFIterator` already expose useful schema-preserving access and traversal. A composed scene can reference resources across documents, requiring persistent resolution, deduplication, cancellation and explicit lifetimes. Those concerns should not be pushed into rendering frameworks or require eagerly materializing all assets.

This proposal is motivated by glTF 2.1 scene-composition use cases; exact normative composition semantics and test assets must be validated against the final Khronos specification before claiming compliance.

## Goals

- Preserve native glTF document objects and index-based references.
- Resolve document-relative URIs safely, including nested external references.
- Expose scene/node traversal without forcing geometry or images to be fetched.
- Deduplicate in-flight and completed resource fetches by canonical resource identity.
- Support per-request cancellation, bounded concurrency and deterministic disposal.
- Keep `GLTFLoader` and existing one-shot behavior unchanged.
- Remain renderer-agnostic: no GPU buffers, textures or pipelines.

## Non-goals

- A new scenegraph object model replacing glTF JSON.
- GPU upload, visibility-driven streaming, LOD scheduling or rendering.
- Implementing speculative glTF 2.1 composition extensions before their normative schemas are confirmed.

## Proposed API (illustrative; not yet implemented)

```ts
const source = await GLTFSource.open(url, {fetch, load: 'lazy'});
const document = await source.getDocument();
const scene = source.getScene(document.scene ?? 0);
for (const node of source.traverse(scene)) {
  // Structural traversal should not fetch mesh buffers or textures.
}
const mesh = await source.resolveMesh(meshIndex, {signal});
await source.close();
```

Methods should return glTF schema objects or explicit resource handles, rather than silently post-processing them into renderer-specific structures. `open` loads only the root JSON/GLB header and structural metadata required to inspect the scene. Resource methods may return decoded CPU-side data through existing loader utilities.

## Design considerations

### Identity and caching

Cache keys must incorporate canonical absolute URL, resource kind and decode options; fragment identifiers and document-local indices must not collide. Deduplicate concurrent requests, and define whether cancellation of one consumer aborts a shared fetch only after all consumers release it. Avoid leaking mutable cached objects across callers.

### Composition and cycles

Maintain a document graph with explicit edges and an active traversal stack. Reject or report recursive composition cycles with actionable paths. Define traversal order and limits on depth, documents, bytes and concurrent requests to protect against malicious assets.

### Lifecycle

Specify ownership for decoded buffers, image data, object URLs and fetch tasks. `close()` must cancel pending work and release source-owned resources. Expose resource-level eviction only after defining reference semantics; don't promise unloading a node automatically frees shared resources.

### Backward compatibility

Keep `GLTFLoader` as the eager, convenient entry point. Share parsers, buffer/image resolution and extension decoding rather than fork their implementations. Reuse `GLTFScenegraph` and `GLTFIterator` where appropriate.

## Implementation plan

1. Audit current `GLTFLoader`, `GLTFScenegraph`, `GLTFIterator`, URI resolution and the glTF 2.1 schemas. Confirm composition semantics and identify reusable internals.
2. Add `GLTFSource` with root-document opening, structural inspection, lazy buffer/image fetches, shared request cache and cancellation.
3. Add nested-document composition and cycle detection based on normative glTF 2.1 references, once validated.
4. Add deterministic cleanup and configurable limits.
5. Add fixture-based tests: GLB, external buffers/images, shared resources, nested references, cycles, errors, cancellation and concurrent requests.
6. Document integration with `@luma.gl/gltf` without adding a rendering dependency.

## Open questions

- Should the public abstraction implement the existing loaders.gl Source interface, or be a dedicated class with a thin adapter?
- Should `getDocument()` expose immutable raw JSON or mutable native glTF objects?
- Which operations should expose resolved resources versus handles with explicit `release()`?
- How should sources expose partial progress and failures across a composed scene?
- Which glTF 2.1 constructs require a source rather than eager `GLTFLoader` resolution?
