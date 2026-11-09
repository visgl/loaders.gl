# HTTP range transport consolidation

Reviewed November 9, 2026. Source inspection identifies these follow-ups; it does not
claim every reader has equivalent semantics or that each observation is a reproduced bug.

Core's `HttpFile` should own exact HTTP range transport, CORS-visible metadata validation,
object identity, size discovery and scheduling. Formats should supply offsets and decoding.
Parquet now uses it, retaining its cache and mapping Core counters to source telemetry.

| Reader | Current behavior | Follow-up |
| --- | --- | --- |
| HDF5 `scientific/src/hdf5/http-range-reader.ts` | Standalone exact-range reader; accepts hidden Content-Range with exact-length 206. Does not require total size. | Share Core's exact-range validation without forcing HEAD/size discovery on callers that only know chunk addresses. |
| Potree2 `tiles-3d/src/potree/potree2-source.ts` | Strict visible Content-Range, bigint offsets, bounded stream collection and cancellation. | Consolidate only after preserving bigint bounds and response-size limits; hidden headers currently fail. |
| GeoTIFF `raster/src/geotiff/geotiff-source-loader.ts` | Own range transport, revision invalidation, bounded reads and optional strict Content-Range exposure. | Preserve explicit strict mode, short EOF reads and cache invalidation when adopting Core primitives. |
| Lance `tables/src/lance/lance-arrow.ts` | Requires successful HTTP status and exact body length, but does not insist on 206 or validate visible Content-Range. | Use Core with its already-known file size; test 200 rejection and offset/version validation. |
| NetCDF `scientific/src/netcdf/netcdf-source-loader.ts` | Grows prefix reads; size helper falls back from Content-Range total to Content-Length. | Do not interpret partial-response Content-Length as total object size; retain deliberate short-EOF/full-response semantics. |
| RAD `splats/src/rad-source-loader.ts` | Accepts full-object responses and slices them, or truncates oversized partial responses. | Make full-download fallback explicit and bounded before consolidating. |
| Core `loader-utils/lib/files/sources.ts` and range scheduler | Older range paths have their own 200/416 handling and missing-header behavior. | Consolidate internally while retaining PMTiles and short-EOF compatibility. |

No reader should add implicit precondition headers merely because a response exposes
Last-Modified or ETag: that can turn a safelisted single Range request into a preflight.
Core currently compares exposed response validators; explicit caller headers are preserved.
CORS hides response headers from JavaScript, not the outgoing single Range header. Hidden
Content-Range does not mean the server ignored the request; 206 plus exact body length can
be used when offset verification cannot be performed. Visible malformed headers must fail.
