# FlatGeobuf

![flatgeobuf-logo](../images/flatgeobuf-logo.png)

- *[`@loaders.gl/flatgeobuf`](/docs/modules/flatgeobuf)*
- *[FlatGeobuf](http://flatgeobuf.org/)*

FlatGeobuf is a binary (FlatBuffers-encoded) format that defines geospatial geometries. It is row-oriented rather than columnar like GeoParquet and GeoArrow and offers a different set of trade-offs.
FlatGeobuf was inspired by [geobuf](https://github.com/mapbox/geobuf) and [flatbush](https://github.com/mourner/flatbush). 

## Characteristics 

- Binary
- Row oriented
- Supports appends, but not random writes
- Optionally supports a spatial index

Goals are to be suitable for large volumes of static data, significantly faster than legacy formats without size limitations for contents or meta information and to be suitable for streaming/random access.

## Geometries

FlatGeobuf supports any vector geometry type defined in the OGC Simple Features specification (the same feature types supported by the WKB 2D geometry type enumeration). 

:::caution
GeoBuf geometries include the standard building blocks of `Point`, `LineString`, `Polygon`,`MultiPoint`, `MultiLineString`, `MultiPolygon`, and `GeometryCollection`, but also includes more infrequently types such as `CircularString`, `Surface`, and `TIN`` (Triangulated irregular network). These additional types are not supported by loaders.gl. 
:::


| Type               | Value | loaders.gl | Comment |
| ------------------ | ----- | ---------- | ------- |
| Unknown            | 0     | ❌          |         |
| Point              | 1     | ✅          |         |
| LineString         | 2     | ✅          |         |
| Polygon            | 3     | ✅          |         |
| MultiPoint         | 4     | ✅          |         |
| MultiLineString    | 5     | ✅          |         |
| MultiPolygon       | 6     | ✅          |         |
| GeometryCollection | 7     | ✅          |         |
| CircularString     | 8     | ❌          |         |
| CompoundCurve      | 9     | ❌          |         |
| CurvePolygon       | 10    | ❌          |         |
| MultiCurve         | 11    | ❌          |         |
| MultiSurface       | 12    | ❌          |         |
| Curve              | 13    | ❌          |         |
| Surface            | 14    | ❌          |         |
| PolyhedralSurface  | 15    | ❌          |         |
| TIN                | 16    | ❌          |         |
| Triangle           | 1     | ❌          |         |

Note: Storing only geometries with the same type allows readers to know which geometry type is stored without scanning the entire file.

## Schema

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

## Metadata

:::caution
loaders.gl currently does not currently expose all metadata.
:::

```typescript
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

## Spatial indexing

:::caution
loaders.gl currently does not support spatial filtering.
:::

FlatGeobuf files can optionally contain a spatial index. The spatial index is optional to allow the format to be efficiently written as a stream, support appending, and for use cases where spatial filtering is not needed.

The spatial index clusters the data on a [packed Hilbert R-Tree](https://en.wikipedia.org/wiki/Hilbert_R-tree#Packed_Hilbert_R-trees) enabling fast bounding box spatial filtering.

 The Hilbert curve imposes a linear ordering on the data rectangles and then traverses the sorted list, assigning each set of C rectangles to a node in the R-tree. The final result is that the set of data rectangles on the same node will be close to each other in the linear order.

### Optimizing Remotely Hosted FlatGeobufs

If you’re accessing a FlatGeobuf file over HTTP, consider using a CDN to minimize latency.

In particular, when using the spatial filter to get a subset of features, multiple requests will be made. Often round-trip latency, rather than throughput, is the limiting factor. A caching CDN can be especially helpful here.

Fetching a subset of a file over HTTP utilizes Range requests. If the page accessing the FGB is hosted on a different domain from the CDN, Cross Origin policy applies, and the required Range header will induce an OPTIONS (preflight) request.

Popular CDNs, like Cloudfront, support Range Requests, but don’t cache the requisite preflight OPTIONS requests by default. Consider enabling OPTIONS request caching . Without this, the preflight authorization request could be much slower than necessary.
