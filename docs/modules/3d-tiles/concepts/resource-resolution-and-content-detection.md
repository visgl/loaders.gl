---
title: 3D Tiles resource resolution and content detection
description: Resolve tile references and identify nested tilesets, binary tile content, and extensionless resources safely.
hide_title: true
page_style: designed
---

import {Tiles3DDocsTabs} from '@site/src/components/docs/tiles-3d-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="3D Tiles runtime / resources"
  title="Resolve the resource before interpreting it."
  description="Tiles can point to signed URLs, extensionless responses, nested tilesets, binary content, or archive entries. loaders.gl resolves the reference and classifies the bytes without relying on a filename."
  tone="blue"
  meta={['Relative and signed URLs', 'Magic-byte detection', 'Nested tilesets']}
/>

<Tiles3DDocsTabs active="resources" />

<DocOrientation
  eyebrow="Resource boundary"
  title="Address first. Parse second."
  description="Keeping URL resolution, response classification, and content parsing separate makes the loader predictable when servers omit extensions or when a tileset contains several resource layers."
  tone="blue"
  items={[
    {label: 'Resolve', value: 'Apply base URLs and inherited query parameters.'},
    {label: 'Inspect', value: 'Use binary magic before making a JSON assumption.'},
    {label: 'Classify', value: 'Distinguish tilesets, glTF, subtrees, and tile payloads.'},
    {label: 'Cache', value: 'Reuse normalized resource addresses without caching bodies.'}
  ]}
/>

<ReferenceBoundary
  title="Resolution and detection details"
  description="The sections below describe the exact order of resolution, classification, caching, and failure handling."
  tone="blue"
/>

A 3D Tiles runtime repeatedly turns references in tileset metadata into fetchable resources. The reference may be relative, signed, extensionless, or stored inside a 3TZ archive. After fetching it, loaders.gl must distinguish another tileset from renderable content without trusting a filename. This page describes that resource boundary and the caches used to keep it inexpensive.

## Resource-intake pipeline

For an explicit tileset, the pipeline is:

1. Resolve each relative `content.uri` against the tileset base URI.
2. Inherit source query parameters that are not already present on the content URI.
3. Fetch the resource through the configured source resolver.
4. Inspect its first four bytes for supported binary magic.
5. If no supported magic is present, decode and parse JSON once.
6. Classify JSON from its top-level structure, then normalize a nested tileset or parse render content.

Detection happens after fetching. It removes naming assumptions from parsing; it does not discover a resource URL before the tileset supplies one.

Implicit subtree availability uses the same source boundary but a different lifecycle. Initial tileset parsing resolves and records the subtree template without fetching it. Visibility and SSE later select a concrete coordinate URL, apply inherited queries, and request it through the source's normal resolver. See [Implicit tiling and lazy subtrees](./implicit-tiling-and-subtrees).

## Structure-first content detection

`Tiles3DLoader` uses the resource itself as the authority:

| Detected data | Classification | Downstream behavior |
| --- | --- | --- |
| `b3dm`, `i3dm`, `cmpt`, or `pnts` four-byte magic | Legacy 3D Tiles binary content | Uses the matching tile parser. Composite children inspect their own embedded magic. |
| `glTF` four-byte magic | Binary glTF (`glb`) | Uses the glTF tile-content path. |
| `subt` four-byte magic requested by an implicit reference | Parsed subtree availability | Materializes one hierarchy chunk and leaves child subtrees lazy. |
| JSON with object-valued `asset` and `root` properties | External tileset | Validates required extensions, normalizes headers, and attaches the nested hierarchy. |
| JSON with an object-valued `asset` property and no tileset `root` | JSON glTF (`gltf`) | Uses the glTF tile-content path. |

This makes signed URLs such as `content/42?token=...`, extensionless endpoints, and misleading filename extensions behave consistently. The server MIME type is not used to choose between tileset and tile parsing.

Unsupported binary magic, malformed JSON, non-object JSON, and JSON without a supported structure fail at the resource boundary. External tileset JSON is reused after classification rather than parsed a second time.

### The `isTileset` option

The default `options['3d-tiles'].isTileset` value is `auto`:

```typescript
const resource = await load(url, Tiles3DLoader, {
  '3d-tiles': {isTileset: 'auto'}
});
```

`auto` follows the classification table above. An explicit boolean is an assertion, not a filename hint:

- `true` accepts an external tileset and rejects render content.
- `false` accepts render content and rejects an external tileset.

Assertions are useful when an application-level protocol promises one category and a mismatch should be reported immediately. They are not required for extensionless tilesets.

## Relative URI resolution

Relative tile and subtree references are resolved against the directory containing their tileset. HTTP(S) bases use standard URL resolution, including `..` path segments. Filesystem-like bases keep loaders.gl path semantics. Absolute paths, absolute URLs, and `data:` URLs remain independent resources.

One metadata parse shares a `CachedUriResolver`. It parses a URL base once and memoizes derived strings by the exact source spelling. The cache is deliberately scoped to the parse: it avoids repeated URL work in a large hierarchy without retaining resources from unrelated tilesets or users.

This cache stores strings only. It does not cache response bodies, decoded content, authorization results, or failed network requests. Tile-content residency is governed separately by the [3D Tiles cache](/docs/modules/3d-tiles/concepts/caching-and-memory).

## Query-parameter inheritance

`Tiles3DSource` can inherit query state from the root tileset, including a tileset version and server-provided session parameter. For each content URL:

- Parameters already present on the content URL win.
- Missing inherited parameters are appended.
- `data:` URLs are returned unchanged.
- The completed URL is cached by its source tile path.
- Changing inherited query state clears that completed-URL cache before the next lookup.

The invalidation rule is important for rotating tokens and session changes: a derived URL must never survive after its source query value changes. Applications should still avoid embedding long-lived secrets in logs or diagnostics.

For Google Photorealistic 3D Tiles, configure the API `key` with
`createGoogleMapsCredential`. The credential pipeline scopes it to `tile.googleapis.com`, while
the resource resolver independently preserves the server-issued `session` parameter on child
tiles. See [authentication](/docs/developer-guide/authentication#google-3d-tiles).

## Nested and archived tilesets

A loaded resource is considered a nested tileset when its parsed result has the normalized `tileset3d` shape. The URL no longer needs to contain `.json`. Nested roots therefore work through signed endpoints and content-addressed storage.

3TZ and other archive-backed sources inject a resolver that reads resources from the archive. They use the same `isTileset: 'auto'` classification and parsed-shape check, so archive member names do not become a second format-detection rule.

## Capability and validation boundaries

Structure detection answers “what category is this payload?” It does not imply support for every feature inside that category. For an external tileset, unsupported names in `extensionsRequired` fail before header normalization or dependent subtree requests. Unknown `extensionsUsed` names remain forward-compatible because they are not declared necessary to interpret the tileset.

Implicit subtree payloads have their own `Tile3DSubtreeLoader` and availability model. Lazy subtree materialization is a runtime concern rather than a content-filename heuristic.

## Troubleshooting

| Symptom | Likely cause | What to inspect |
| --- | --- | --- |
| “Expected supported binary magic or JSON object” | Truncated response, HTML error page, unsupported binary type, or malformed JSON | Response status, byte length, first bytes, authentication redirects |
| “JSON must describe a tileset … or a glTF asset” | Valid JSON with no supported 3D Tiles or glTF structure | Top-level `asset` and `root` objects; endpoint response contract |
| Explicit mode mismatch | `isTileset: true` received render content, or `false` received a tileset | Remove the assertion or correct the application protocol |
| Relative content resolves under the wrong directory | Incorrect loader context URL or tileset base path | Root URL, redirects, archive resolver base |
| Authentication query disappears | The content URI already supplies that key, or the source was created without root query state | Root query string and the final URL returned by `getTileUrl()` |
| Old token appears after rotation | Query state was mutated outside the source API | Recreate/update the source through supported options so derived URLs are invalidated |
| Nested hierarchy is treated as render content | Custom resolver returned unnormalized JSON instead of a `Tiles3DLoader` result | Resolver loader argument and returned `shape` |

## Runtime inspection

When diagnosing resource loading, record the original content URI, resolved URL, detected content type, normalized result shape, and whether the source is archive-backed. Keep credentials redacted. Follow the resource into [hierarchy refinement](/docs/modules/3d-tiles/concepts/tile-hierarchy-and-refinement), [request scheduling](/docs/modules/3d-tiles/concepts/request-scheduling-and-priorities), and [runtime diagnostics](/docs/modules/3d-tiles/concepts/runtime-tuning-and-diagnostics) to distinguish address/classification failures from traversal or cache behavior.

See the [`Tiles3DLoader` API](/docs/modules/3d-tiles/api-reference/tiles-3d-loader), [`Tileset3D` API](/docs/modules/tiles/api-reference/tileset-3d), and [3D Tiles specification](https://docs.ogc.org/cs/22-025r4/22-025r4.html) for the surrounding data model.
