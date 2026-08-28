# Coordinate Reference Systems

Coordinate reference system (CRS) metadata tells an application how coordinates relate to the
earth. Preserving that metadata is different from transforming coordinates. loaders.gl aims to
make both explicit: loaders should first discover and retain the source CRS; reprojection only
happens when a loader documents an opt-in transformation path.

## CRS representations

- A **CRS identifier** names a registered definition, for example `EPSG:4326`, `OGC:CRS84`, an
  OGC URN, or an OGC definition URL. Identifiers do not embed the definition and loaders.gl does
  not resolve them over the network.
- **WKT1, WKT2:2015, and WKT2:2019** serialize CRS definitions as text. WKT can also serialize
  coordinate operations and coordinate metadata. `@math.gl/crs` parses WKT into a
  value-preserving syntax tree and encodes it again without inventing semantic equivalence.
- A **PROJ string** is an ordered parameter serialization. It may describe a CRS or a pipeline.
  `@math.gl/crs` preserves flags, repeated parameters, pipeline steps, and parameter order.
- **PROJJSON v0.7** is the canonical semantic object model exported by `@math.gl/crs`. A WKT or
  PROJ syntax tree is not automatically convertible to PROJJSON.
- A **coordinate epoch** identifies when coordinates in a dynamic CRS apply. GeoParquet stores it
  separately as `epoch`; it must not be confused with the CRS frame epoch.

Axis order belongs to the CRS definition. `EPSG:4326` is latitude/longitude in authoritative axis
order while `OGC:CRS84` is longitude/latitude. Code should not assume those identifiers are
interchangeable. Existing loaders.gl reprojection paths normally use proj4's conventional
`[longitude, latitude]` array order rather than enforcing authority axis order; this behavior must
be made explicit by any future shared reprojection contract. A CRS may also be horizontal,
vertical, or compound. Preserving only the horizontal component loses height datum information
even when all coordinate values are retained.

## Shared types and syntax codecs

Install `@math.gl/crs` when a public application type needs to describe CRS values:

```ts
import type {
  CRSDefinition,
  CRSIdentifier,
  PROJJSONCRS,
  PROJStringDefinition,
  WKTCRSDefinition
} from '@math.gl/crs';
import {encodePROJString, encodeWKTCRS, parsePROJString, parseWKTCRS} from '@math.gl/crs';
```

`CRSIdentifier` is appropriate for service capabilities and request parameters. Embedded dataset
metadata should use `CRSDefinition`, `PROJJSONCRS`, `WKTCRSDefinition`, or
`PROJStringDefinition`, according to what the format actually stores.

The `WKTCRSLoader` and `WKTCRSWriter` remain loaders.gl adapters, but their v5 data shape is the
`WKTCRSAst` exported by `@math.gl/crs`. The old hybrid array/object result and the `raw`, `sort`,
and `debug` options have been removed.

## 3D spatial API

I3S and 3D Tiles share a normalized spatial descriptor in `@loaders.gl/tiles`. Normal loading does
not require an application to populate source CRS, axis, epoch, or height-model fields. The format
adapter discovers them and exposes the result on `Tileset3D.spatialReference`:

```ts
const tileset = new Tileset3D(source);
await tileset.tilesetInitializationPromise;

console.log(tileset.spatialReference);
// sourceCrs, coordinateFrame, heightReference, axisOrder,
// provenance, status, and warnings
```

`provenance` distinguishes explicit metadata from a format default, caller recovery override,
legacy assumption, or unknown value. `warnings` reports qualifications such as an unresolved
external metadata schema or an I3S ground-relative mode that needs an elevation provider. These
fields are diagnostic output, not configuration.

The application-facing target contract is intentionally small:

```ts
type TilesetSpatialOptions = {
  targetCrs?: CRSDefinition;
  targetHeightReference?: 'native' | 'ellipsoidal' | 'orthometric';
  outputCoordinates?: 'auto' | 'ecef' | 'local-enu' | 'target-crs';

  // Expert recovery for missing or incorrect source metadata
  sourceCrs?: CRSDefinition;
  coordinateEpoch?: number;
  geoidModel?: string | Geoid;

  // Only needed when I3S metadata requests surface-relative placement
  terrainElevationProvider?: TilesetElevationProvider;
  sceneElevationProvider?: TilesetElevationProvider;
};
```

Source vertical units, height references, and I3S placement modes are discovered automatically.
See [Vertical Coordinate Systems and Elevation Placement](./vertical-coordinate-systems) for the
operation order, provider contract, formulas, and failure behavior.

The v5 foundation normalizes these options and provides `SpatialCoordinateTransformer` for
format-owned transformation paths. A descriptor with status `transformable` says that the
requested operation can be constructed; only `transformed` can claim returned positions, bounds,
normals, and origins have all moved into the target frame. During staged I3S/3D Tiles integration,
applications should check the status instead of assuming a target rewrites every tile payload.

### Registering non-bundled resources

Common EPSG definitions supported by Proj4 require no setup. Custom definitions, datum grids, and
geoid models are application resources registered once during startup:

```ts
import {
  registerGeoidModelFromPgm,
  registerSpatialCrs,
  registerSpatialDatumGrid
} from '@loaders.gl/tiles';

registerSpatialCrs('LOCAL:SURVEY_GRID', '+proj=tmerc +lat_0=... +lon_0=...');
registerSpatialDatumGrid('regional.gsb', datumGridArrayBuffer);
registerGeoidModelFromPgm('egm96-5', geoidPgmBytes, {cubic: true});
```

Registration is explicit. Loading a tileset never downloads an EPSG definition, NTv2 grid, or
geoid model in the background. This keeps offline applications deterministic, avoids surprising
network and licensing behavior, and lets each application choose its accuracy/resource tradeoff.

### Division of responsibility

| Module | Responsibility | Deliberate boundary |
| --- | --- | --- |
| `@math.gl/crs` | Typed identifiers, WKT/PROJ syntax, and PROJJSON definitions | Does not look up definitions or transform coordinates |
| `@math.gl/proj4` | Horizontal/projected/geocentric transformations and NTv2 grid registration | Not assumed to perform vertical datum or epoch operations |
| `@math.gl/geoid` | GeographicLib-compatible interpolation from application-supplied PGM data | Is not terrain and does not load a model automatically |
| `@math.gl/geospatial` | Ellipsoid, cartographic/ECEF, and local-frame mathematics | Does not interpret format metadata |
| loaders.gl adapters | Axis normalization, profile semantics, bounds, origins, normals, elevation placement, and diagnostics | Never silently invent missing metadata |

### Vertical height conversion

A geoid model returns undulation `N`, the signed separation between the ellipsoid and
gravity-related height surface. loaders.gl follows the GeographicLib convention:

```text
ellipsoidal height h = orthometric height H + geoid undulation N
orthometric height H = ellipsoidal height h - geoid undulation N
```

The geoid is sampled at longitude/latitude derived from the source horizontal CRS before the target
horizontal projection. Conversion therefore needs a usable source CRS, known source height
reference, finite Z value, and compatible registered model. Missing input is an error, not a reason
to leave Z unchanged.

A geoid is not terrain. I3S `onTheGround`, `relativeToGround`, and `relativeToScene` modes need a
terrain or scene elevation provider in addition to vertical datum conversion.

### Axis order, precision, and bounds

Format wire order is normalized before Proj4. Authoritative `EPSG:4326` order is
latitude/longitude, while I3S geometry and rendering arrays use longitude/latitude.
`SpatialCoordinateTransformer` deliberately accepts conventional `[x, y, z]` arrays with Proj4
authority-axis enforcement disabled; the descriptor records the adapter's normalized order.

Positions remain `Float64` through reconstruction and transformation. Rendering paths may downcast
only after subtracting a nearby origin. Bounds are sampled or rebuilt in the target frame; an
arbitrary projection must not be approximated by transforming two corners or attaching one affine
matrix to a large tile.

### Failure model

Requested transformations reject when the source CRS is unknown, a preserved definition is not
executable by Proj4, a custom definition/grid is unregistered, vertical conversion lacks a height
model or geoid, an epoch operation is unsupported, local ENU has no derived origin, or relative
placement lacks an elevation provider. The error names the missing resource or operation. A loader
must not catch it and continue in source coordinates after a different target was requested.

## Current support

The table describes loaders.gl v5 behavior. “Partial” means some variants, output shapes, or
metadata records are not yet normalized. “Implicit” means the format fixes or conventionally
implies a coordinate system rather than carrying a general CRS definition. Preservation does not
mean coordinate transformation.

| Format or service | Discovery | Preservation / output metadata | Reprojection |
| --- | --- | --- | --- |
| GeoArrow | Field `crs` plus `crs_type`: PROJJSON, WKT2:2019, authority code, opaque-string SRID, or another opaque string | Typed field metadata; partial across converters that rebuild Arrow schemas | None |
| GeoParquet 1.1 / 2.0 | Per-column PROJJSON, `null`, omitted default, and coordinate `epoch` | Original `geo` JSON is retained; compatible GeoArrow field metadata is added | None |
| Shapefile | `.prj` WKT sidecar | `.prj` is returned by legacy output; Arrow metadata is partial | Opt-in through `gis.reproject` and `_targetCrs` |
| FlatGeobuf | Header authority code and WKT | Header metadata is retained; Arrow CRS metadata is partial | Opt-in through `gis.reproject` and `_targetCrs` |
| GeoPackage | Spatial reference system tables, preferring extension WKT2 over fallback WKT1 | Source and scan metadata retain the table CRS; Arrow geometry fields report the native or transformed output CRS | Opt-in through `gis.reproject` and `_targetCrs` |
| GeoJSON | Deprecated GeoJSON `crs` member when present; otherwise WGS84 semantics | Original legacy value is retained; recognized CRS84/EPSG:4326 values map to GeoArrow/GeoParquet metadata | None in the GeoJSON loader |
| CSV WKT / WKB | Geometry values can contain EWKT/EWKB SRIDs, but CSV has no dataset CRS convention | Geometry-level SRID support is partial; no common table CRS descriptor | None |
| GML | `srsName` on geometry/envelope elements | Parsed format data retains identifiers inconsistently across output shapes | Service/server dependent; no general client transform |
| GeoTIFF / COG | GeoKeys and projected EPSG codes | Raster source metadata exposes the detected native CRS | Native CRS only; raster warping is not implemented |
| GeoZarr | `proj:wkt2`, `proj:code`, `grid_mapping`, and CF WKT attributes | Raster source metadata exposes the detected native CRS | Native CRS only; mismatched viewport CRS is rejected |
| LAS / LAZ | WKT and GeoTIFF projection VLR/EVLR records | Raw typed records are exposed in loader metadata; normalization is incomplete | None |
| COPC | LAS CRS records plus COPC hierarchy metadata | Same CRS limitations as LAS/LAZ | Source-specific normalization to WGS84 when a supported source definition is available; no general target-CRS contract |
| Potree | Dataset projection metadata when supplied | Source metadata retains the projection string | Existing source-specific transform support only |
| WMS | Layer CRS lists and CRS-tagged bounds | Normalized capability and request identifiers | Server-side `CRS`/`SRS` negotiation; no client raster warp |
| WFS | Capability/request identifiers and GML `srsName` | Identifier preservation is partial | Server-side output CRS request where supported |
| WMTS | Tile-matrix-set supported CRS | Capability metadata | Server-selected tile matrix set; no client tile reprojection |
| ArcGIS services | Spatial reference WKID/latestWKID fields | Service metadata and request fields are retained | Server-side `outSR`/image request behavior where implemented |
| I3S | WKID/latestWKID, WKT, VCS WKIDs, `heightModelInfo`, `ZFactor`, `elevationInfo`, and extent CRS | Raw fields plus normalized `spatialMetadata`; longitude/latitude wire order, vertical units, height references, and placement are explicit | Mesh and Point Cloud vertices, origins, normals, and bounds support requested geographic/projected output, geoid conversion, and all elevation placement modes with application providers |
| 3D Tiles | CRS/epoch metadata semantics and region-established global frames | Raw schema/entity metadata plus normalized `spatialMetadata`; local/unknown tilesets stay unknown | Shared transformer available; nonlinear content/bounds and nested-tileset integration is in progress |
| MVT / TileJSON | Implicit tile coordinates; TileJSON bounds are longitude/latitude | Tile transform and metadata retained | Implicit Web Mercator tiling; no arbitrary CRS |
| KML | Implicit WGS84 longitude/latitude/altitude | Coordinate values retained | None |
| GPX / TCX | Implicit WGS84 latitude/longitude | Coordinate values retained | None |

When `gis.reproject` is enabled, Shapefile, FlatGeobuf, and GeoPackage require usable source CRS
metadata. A Shapefile therefore needs its `.prj` sidecar, while FlatGeobuf and GeoPackage need a
source definition in their format metadata. Missing or invalid definitions reject the request;
loaders.gl does not assume that unlabelled coordinates are WGS84.

## GeoArrow and GeoParquet details

GeoParquet distinguishes three states:

- omitted `crs`: the GeoParquet default, `OGC:CRS84`
- `crs: null`: an explicitly unknown CRS
- `crs: {…}`: an explicit PROJJSON CRS

loaders.gl preserves that distinction in schema-level GeoParquet metadata. When mapping to
GeoArrow field metadata, omitted CRS becomes the `OGC:CRS84` authority identifier, explicit
`null` emits no CRS field, and PROJJSON remains an object. A column `epoch` is preserved separately.
GeoParquet has no `crs_type` member; unknown metadata members are nevertheless retained.

GeoArrow metadata is column-specific. Different geometry columns may have different CRSs, so a
future normalized table descriptor must not collapse them into one table-wide value.

## Known gaps

- Several Arrow output paths rebuild schemas without carrying all source CRS metadata.
- LAS/LAZ/COPC expose projection records but do not yet assemble complete horizontal, vertical,
  dynamic, and compound CRS definitions.
- GeoTIFF and GeoZarr return native-CRS raster data and do not warp or resample into a target CRS.
- Existing vector reprojection options use the inconsistent, experimental `_targetCrs` name.
- Some point-cloud-specific transforms still treat an unsupported or unparsable source definition
  as an unavailable transform and continue with source coordinates instead of rejecting the
  request.
- Some service parsers and format-specific structures still expose unclassified strings.
- GeoParquet CRS metadata is preserved, but GeoParquet coordinates are not reprojected.
- The unified 3D descriptor covers I3S and 3D Tiles; table, raster, and service APIs do not yet all
  expose the same result shape.

Applications should not infer transformation from metadata presence or compare serialized
definitions for semantic equality. They should also account for each loader's documented axis
convention and failure behavior until the shared reprojection contract makes both explicit.

## Roadmap

1. Normalize discovery into a descriptor containing definition, representation, coordinate epoch,
   provenance, and explicit unknown/default state.
2. Introduce one public reprojection contract; update output CRS and bounds after transformation,
   and reject unsupported transformations explicitly.
3. Complete vector and table formats, including column-specific GeoArrow and GeoParquet CRS.
4. Add complete LAS/COPC vertical, dynamic, and compound CRS handling.
5. Add raster warping and resampling for GeoTIFF/COG and GeoZarr.
6. Separate server-side CRS negotiation from client-side reprojection for service sources.
7. Add datum-grid registration, transformation accuracy reporting, antimeridian handling, Z/M
   preservation, and deck.gl integration.

This roadmap deliberately does not make registry lookup or datum-grid downloads implicit. Those
resources must be registered by the application so loading remains deterministic and browser-safe.
