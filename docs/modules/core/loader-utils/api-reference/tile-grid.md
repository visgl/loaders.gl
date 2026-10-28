# Tile grid validation and addressing

These helpers are available from `@loaders.gl/core/loader-utils` and the focused
`@loaders.gl/core/loader-utils/tile-grid` subpath. Geometry algorithms are supplied
by `@math.gl/geospatial`; source-level partial metadata and coverage are handled here.

```typescript
import {getTileGridValidation, resolveTileGridTile} from '@loaders.gl/core/loader-utils';

const metadata = await source.getMetadata();
if (!metadata.tileGrid) throw new Error('This source does not advertise a tile grid');
const validation = getTileGridValidation(metadata.tileGrid);
if (validation.status !== 'complete') console.log(validation.issues);
const request = resolveTileGridTile(metadata.tileGrid, {x: 1, y: 0, z: 0, tileMatrix: 'detail'});
if (request) await source.getTile(request);
```

## `getTileGridValidation(grid)`

Returns `{status, issues}` without changing the input. Status is `complete` for valid authoritative
`tileMatrixSet` geometry and coverage, `partial` when required geometry/CRS is absent, or `invalid`
for malformed/ambiguous metadata. Each issue includes `code`, `message` and, when applicable,
`tileMatrix`. Codes are `missing-crs`, `missing-geometry`, `invalid-matrix`, `duplicate-matrix-id`
and `invalid-limits`. Messages are diagnostic text, not stable identifiers.

Complete geometry is authoritative when both complete and partial fields exist. Advertised partial
fields are retained by `createTileGrid`, including invalid values, so callers can inspect them.
Invalid or duplicate levels never become complete geometry. Complete empty matrix sets are valid
empty selections; absence of a matrix set is partial metadata. This result describes geometry and
coverage, not projection-engine support, renderer compatibility or actual sparse tile presence.

## `validateTileGrid(grid)` and `validateTileGridLimits(grid)`

`validateTileGrid` throws `RangeError` for invalid identity, geometry or coverage. Partial metadata
is allowed, but an explicitly supplied complete set must have a CRS. Callers that require complete
geometry must also check the validation status or require `tileMatrixSet`.

`validateTileGridLimits` checks safe integer inclusive rectangles, unique known matrix IDs and
advertised dimensions independently of resolution/CRS. An omitted limits list is unrestricted;
an empty list allows no tiles. A matrix omitted from a present list is unavailable.

## `resolveTileGridTile(grid, parameters)`

Validates nonnegative safe integer `x`, `y`, `z`; preserves an explicit native `tileMatrix`; and
returns resolved parameters or `null` outside geometry/coverage. Unknown explicit IDs reject.
Without an explicit ID, an ID equal to numeric `z` wins over the array-index fallback. Other
request fields, including cancellation, survive. No grid preserves the legacy request unchanged.

For coalesced rows, all base-column aliases resolve to one canonical column. Coverage is satisfied
when any alias is inside the limits: the canonical result may precede `minTileColumn`. math.gl
computes the footprint and canonical range. Complete geometry is required for coalesced requests;
ordinary partial grids support dimension/limit-only checks. This helper does not cache requests,
fetch content, infer a CRS or transform coordinates. Callers own source/dimension cache scoping.

## Normalization

`createTileGridMatrix` and `createTileGrid` preserve `variableMatrixWidths`. Bands refer to native
rows and are not swapped with coordinate axes. Omitted rows remain regular. Full geometry uses
math.gl validation, including divisibility, disjoint bands and representable extents.

Current thinking is to keep these source checks small and use upstream geometry APIs. A prepared
query/cache abstraction should follow workload measurements and explicit metadata invalidation
semantics; these helpers validate the supplied data on each call.


## `getXYZTileGridOptions(metadata?)`

Assesses metadata for a default Web Mercator XYZ selector and returns `{status, options}`. A
`compatible` result means complete geometry matches the supported canonical XYZ contract;
`unknown` means complete geometry was not advertised and preserves legacy zoom/tile-size defaults.
Invalid metadata, coalesced partial rows and incompatible complete geometry throw rather than
silently treating them as XYZ. Unknown metadata is not proof of compatibility. This shared helper
is available from `@loaders.gl/core/loader-utils/tile-grid`; it does not enable projected rendering.
