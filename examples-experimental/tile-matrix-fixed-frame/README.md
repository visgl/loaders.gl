# Fixed-frame TileMatrix requests

From the repository root, after `yarn` and `yarn build`:

```sh
node examples-experimental/tile-matrix-fixed-frame/run.mjs
```

This small offline walkthrough uses the real `OGCAPITilesSource` and TileMatrix selector.
A caller-supplied frame in EPSG:32631 selects the `survey:detail` matrix independently of its
array index. Detail rows 1–2 coalesce two base columns into one tile. Coverage advertises only
base column 1, so selection returns canonical column 0 while retaining the covered footprint.
Its rectangular 256 × 128 pixel tiles and advertised limits yield only these requests:

```text
/ogc/tiles/survey%3Adetail/1/0
/ogc/tiles/survey%3Adetail/2/0
```

The transport returns a landing document and tiny placeholder encoded payloads. It does not decode
or display imagery, and does not contact a service. `runFixedFrameExample(fetcher, signal)` accepts
an injected transport and forwards the signal to each selected tile request.

Our current thinking is that an explicit native-CRS frame is a useful boundary between selection
and a renderer. This example is intended to make that boundary easier to discuss; it does not
choose a canonical `Tileset2D` implementation or settle a deck.gl layer API. A viewport adapter
would still need to compute an extent and resolution in the grid CRS, with appropriate culling.

| Capability | This example |
| --- | --- |
| Complete grid metadata | Yes |
| Fixed native-frame selection and limits | Yes |
| Native matrix IDs through source requests | Yes |
| Viewport conversion, arbitrary-CRS rendering | Not supplied |
| Coalesced rows | Canonical columns and full native footprints |

The frame uses the exact CRS identifier from metadata. Equivalent-looking URI/URN forms are not
silently substituted. Native bounds and logical tile dimensions are returned without reprojection.
