Indexed feature format

![](/next/images/format-logos/flatgeobuf-logo.png)

# Find the features before decoding the file.

FlatGeobuf stores OGC geometries in a compact FlatBuffers layout and can include a spatial index. That makes it useful for streaming and bounded reads without the weight of a database.

[FlatGeobuf module](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf.md)[FlatGeobuf source](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/api-reference/flatgeobuf-source-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/api-reference/flatgeobuf-source-loader.md)

![](/next/images/format-logos/flatgeobuf-logo.png)[Try It](https://loaders.gl/next/examples/geospatial/flatgeobuf)[Overview](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)[Format](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/format.md)[FlatGeobufLoader](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/api-reference/flatgeobuf-loader.md)[FlatGeobufSourceLoader](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/api-reference/flatgeobuf-source-loader.md)

Cloud-native reads

## Ask for the data. Fetch only the bytes behind it.

Range-aware sources translate a logical request into scheduled byte ranges. Metadata, caching, and cancellation stay in the transport layer while the application works with a normal decoded result.

Logical request

[**A tile**visible scene content↗](https://loaders.gl/next/docs/modules/tiles.md)[**A column**selected table data↗](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)[**A window**selected raster pixels↗](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md)[**A point region**bounded cloud data↗](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md)

locat&#x65;**→**

\[ ]

Range scheduler

mergecacheabort

offsets · limits · HTTP Range

rea&#x64;**→**

Useful bytes

**Header bytes**discover the layout

**Selected intervals**fetch only what is needed

**Decoded result**table, tile, or raster data

The same access pattern powers tiled scenes, columnar files, point clouds, and windowed rasters without making the whole object a prerequisite.

The useful trade-off

## A row format with a spatial shortcut.

FlatGeobuf keeps complete features together while its index lets a reader skip records outside a requested bounding box. It complements columnar formats rather than replacing them.

01

Layout

FlatBuffers-encoded feature records

02

Selection

R-tree bounding-box pruning when present

03

Geometry

OGC Simple Features geometry types

04

Output

GeoJSON-like features or Arrow batches

[![Scan supported](https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square)](https://loaders.gl/next/docs/developer-guide/common-scan-architecture)

* *[`@loaders.gl/geospatial/flatgeobuf`](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf.md)*
* *[FlatGeobuf](http://flatgeobuf.org/)*

FlatGeobuf is a binary (FlatBuffers-encoded) format that defines geospatial geometries. It is row-oriented rather than columnar like GeoParquet and GeoArrow and offers a different set of trade-offs. FlatGeobuf was inspired by [geobuf](https://github.com/mapbox/geobuf) and [flatbush](https://github.com/mourner/flatbush).

Detailed guide

## FlatGeobuf structure and support

The sections below describe layout, geometry types, indexing, scan behavior, and the format features supported by loaders.gl.

## Characteristics[​](#characteristics "Direct link to Characteristics")

* Binary
* Row oriented
* Supports appends, but not random writes
* Optionally supports a spatial index

Goals are to be suitable for large volumes of static data, significantly faster than legacy formats without size limitations for contents or meta information and to be suitable for streaming/random access.

## Geometries[​](#geometries "Direct link to Geometries")

FlatGeobuf supports vector geometry types defined in the OGC Simple Features specification (the same feature types supported by the WKB 2D geometry type enumeration).

caution

FlatGeobuf geometries include the standard building blocks of `Point`, `LineString`, `Polygon`, `MultiPoint`, `MultiLineString`, `MultiPolygon`, and `GeometryCollection`, but also include less frequently used types such as `CircularString`, `Surface`, and `TIN` (triangulated irregular network). These additional types are not supported by loaders.gl.

| Type               | Value | loaders.gl | Comment |
| ------------------ | ----- | ---------- | ------- |
| Unknown            | 0     | ✕          |         |
| Point              | 1     | ✅         |         |
| LineString         | 2     | ✅         |         |
| Polygon            | 3     | ✅         |         |
| MultiPoint         | 4     | ✅         |         |
| MultiLineString    | 5     | ✅         |         |
| MultiPolygon       | 6     | ✅         |         |
| GeometryCollection | 7     | ✅         |         |
| CircularString     | 8     | ✕          |         |
| CompoundCurve      | 9     | ✕          |         |
| CurvePolygon       | 10    | ✕          |         |
| MultiCurve         | 11    | ✕          |         |
| MultiSurface       | 12    | ✕          |         |
| Curve              | 13    | ✕          |         |
| Surface            | 14    | ✕          |         |
| PolyhedralSurface  | 15    | ✕          |         |
| TIN                | 16    | ✕          |         |
| Triangle           | 1     | ✕          |         |

Note: Storing only geometries with the same type allows readers to know which geometry type is stored without scanning the entire file.

## Schema[​](#schema "Direct link to Schema")

Apart from geometry, FlatGeobuf supports columns with a range of types:

| Type       | Description                                             |
| ---------- | ------------------------------------------------------- |
| `Byte`     | Signed 8-bit integer                                    |
| `UByte`    | Unsigned 8-bit integer                                  |
| `Bool`     | Boolean                                                 |
| `Short`    | Signed 16-bit integer                                   |
| `UShort`   | Unsigned 16-bit integer                                 |
| `Int`      | Signed 32-bit integer                                   |
| `UInt`     | Unsigned 32-bit integer                                 |
| `Long`     | Signed 64-bit integer                                   |
| `ULong`    | Unsigned 64-bit integer                                 |
| `Float`    | Single precision floating point number                  |
| `Double`   | Double precision floating point number                  |
| `String`   | UTF8 string                                             |
| `Json`     | General JSON type intended to be application specific   |
| `DateTime` | ISO 8601 date time                                      |
| `Binary`   | General binary type intended to be application specific |

## Metadata[​](#metadata "Direct link to Metadata")

caution

loaders.gl does not expose all metadata fields yet.

```
type Header {

  name: string;                 // Dataset name

  envelope: [double];           // Bounds

  geometry_type: GeometryType;  // Geometry type (should be set to Unknown if per feature geometry type)

  has_z: bool = false;           // Does geometry have Z dimension?

  has_m: bool = false;           // Does geometry have M dimension?

  has_t: bool = false;           // Does geometry have T dimension?

  has_tm: bool = false;          // Does geometry have TM dimension?

  columns: [Column];            // Attribute columns schema (can be omitted if per feature schema)

  features_count: ulong;        // Number of features in the dataset (0 = unknown)

  index_node_size: ushort = 16; // Index node size (0 = no index)

  crs: Crs;                     // Spatial Reference System

  title: string;                // Dataset title

  description: string;          // Dataset description (intended for free form long text)

  metadata: string;             // Dataset metadata (intended to be application specific and suggested to be structured fx. JSON)

}



type Crs {

  org: string;                  // Case-insensitive name of the defining organization e.g. EPSG or epsg (NULL = EPSG)

  code: int;                    // Numeric ID of the Spatial Reference System assigned by the organization (0 = unknown)

  name: string;                 // Human readable name of this SRS

  description: string;          // Human readable description of this SRS

  wkt: string;                  // Well-known Text Representation of the Spatial Reference System

  code_string: string;          // Text ID of the Spatial Reference System assigned by the organization in the (rare) case when it is not an integer and thus cannot be set into code

}



type Column {

  name: string (required);      // Column name

  type: ColumnType;             // Column type

  title: string;                // Column title

  description: string;          // Column description (intended for free form long text)

  width: int = -1;              // Column values expected width (-1 = unknown) (currently only used to indicate the number of characters in strings)

  precision: int = -1;          // Column values expected precision (-1 = unknown) as defined by SQL

  scale: int = -1;              // Column values expected scale (-1 = unknown) as defined by SQL

  nullable: bool = true;        // Column values expected nullability

  unique: bool = false;         // Column values expected uniqueness

  primary_key: bool = false;    // Indicates this column has been (part of) a primary key

  metadata: string;             // Column metadata (intended to be application specific and suggested to be structured fx. JSON)

}
```

Each column also has a string that can hold arbitrary metadata.

## Spatial indexing[​](#spatial-indexing "Direct link to Spatial indexing")

FlatGeobuf files can optionally contain a spatial index. The spatial index is optional to allow the format to be efficiently written as a stream, support appending, and for use cases where spatial filtering is not needed.

The spatial index clusters the data on a [packed Hilbert R-Tree](https://en.wikipedia.org/wiki/Hilbert_R-tree#Packed_Hilbert_R-trees) enabling fast bounding box spatial filtering.

The Hilbert curve imposes a linear ordering on the data rectangles and then traverses the sorted list, assigning each set of C rectangles to a node in the R-tree. The final result is that the set of data rectangles on the same node will be close to each other in the linear order.

## Scan support[​](#scan-support "Direct link to Scan support")

`FlatGeobufSource` uses the packed R-tree when a bounds query is supplied and applies the remaining portable table query to the selected features.

| Capability                  | Support      | Execution                                              |
| --------------------------- | ------------ | ------------------------------------------------------ |
| Entry point                 | ✅ `read()`  | Arrow feature batches                                  |
| Schema and bounds discovery | ✅ Supported | Header metadata                                        |
| Bounding box                | ✅ Supported | Packed R-tree pushdown when the file contains an index |
| Attribute predicate         | ✅ Supported | Residual after feature decoding                        |
| Projection and global limit | ✅ Supported | Applied to surviving features                          |
| Cancellation                | ✅ Supported | Covers range reads and result production               |
| Explain output              | ✅ Supported | Distinguishes R-tree pruning from residual work        |

Spatial bounds use the source coordinate reference system. The adapter does not reproject query bounds.

### Optimizing Remotely Hosted FlatGeobufs[​](#optimizing-remotely-hosted-flatgeobufs "Direct link to Optimizing Remotely Hosted FlatGeobufs")

If you’re accessing a FlatGeobuf file over HTTP, consider using a CDN to minimize latency.

In particular, when using the spatial filter to get a subset of features, multiple requests will be made. Often round-trip latency, rather than throughput, is the limiting factor. A caching CDN can be especially helpful here.

Fetching a subset of a file over HTTP utilizes Range requests. If the page accessing the FGB is hosted on a different domain from the CDN, Cross Origin policy applies, and the required Range header will induce an OPTIONS (preflight) request.

Popular CDNs, like Cloudfront, support Range Requests, but don’t cache the requisite preflight OPTIONS requests by default. Consider enabling OPTIONS request caching . Without this, the preflight authorization request could be much slower than necessary.
