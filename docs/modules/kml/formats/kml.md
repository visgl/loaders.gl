---
title: KML format
description: An XML standard for geographic annotation, visualization, and Earth-browser content.
hide_title: true
page_style: designed
---

import {KmlDocsTabs} from '@site/src/components/docs/kml-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Geographic annotation format"
  title="Put places, paths, and views in an Earth-ready document."
  description="KML uses XML elements to describe geographic annotations and visualization instructions for maps and 3D Earth browsers; KMZ packages those documents and their resources. loaders.gl keeps both formats in the broader GIS and scene-data pipeline."
  tone="mint"
  meta={['KML/KMZ', 'KML 2.2', 'OGC standard']}
  links={[
    {label: 'KML module', to: '/docs/modules/kml'},
    {label: 'KMLLoader', to: '/docs/modules/kml/api-reference/kml-loader'}
  ]}
/>

<KmlDocsTabs active="overview" />

<DocOrientation
  eyebrow="The KML document"
  title="Describe the feature and how it should appear."
  description="KML combines geographic content with presentation hints such as styles, views, overlays, and network links. It is a document format, not just a geometry container."
  tone="mint"
  items={[
    {label: 'Geometry', value: 'Points, paths, polygons, and models'},
    {label: 'Presentation', value: 'Styles, icons, labels, and camera views'},
    {label: 'Composition', value: 'Folders, documents, overlays, and links'},
    {label: 'Standard', value: 'OGC KML for interoperable Earth browsers'}
  ]}
/>

![ogc-logo](../../../images/logos/ogc-logo-60.png)

KML (Keyhole Markup Language) is an XML format for geographic annotation and
visualization in two-dimensional maps and three-dimensional Earth browsers.
KMZ is the ZIP-based packaging of a KML document and its related resources,
such as images, models, and screen overlays.

The `@loaders.gl/kml` module parses both formats with the native
`@loaders.gl/xml` parser. It does not require a browser DOM or Node DOM
polyfill.

- [KML Tutorial - Google](https://developers.google.com/kml/documentation/kml_tut)

KML is an [Open Geospatial Consortium standard][kml_ogc_standard].

## Characteristics

| Characteristic | KML | KMZ |
| --- | --- | --- |
| Container | XML document | ZIP archive containing KML and resources |
| Typical extension | `.kml` | `.kmz` |
| MIME type | `application/vnd.google-earth.kml+xml` | `application/vnd.google-earth.kmz` |
| Coordinate reference system | WGS84 longitude/latitude (`OGC:CRS84`) | WGS84 longitude/latitude (`OGC:CRS84`) |
| Main use | Geographic features and visualization | Portable geographic package |

## Feature matrix

| Feature | Support | Notes |
| --- | --- | --- |
| Point, LineString, LinearRing, Polygon | Supported | Coordinates preserve altitude when present |
| MultiGeometry | Supported | Converted to GeoJSON geometry collections or normalized table geometry |
| Folders and nested documents | Supported | Folder hierarchy is retained by the rich parser and source metadata |
| Styles and StyleMaps | Supported | Common line, polygon, icon, and label properties are normalized |
| ExtendedData and SchemaData | Supported | Values are exposed as feature properties |
| TimeStamp and TimeSpan | Supported | Preserved as KML feature metadata when requested |
| Ground, screen, and photo overlays | Supported | Metadata and relative resource paths are retained |
| NetworkLink | Supported | Link metadata is retained; remote KML is not followed automatically |
| Model | Supported | Location, orientation, scale, and resource reference metadata are retained |
| `gx:Track` and `gx:MultiTrack` | Supported | Converted to line geometry with timestamp metadata |
| KMZ `doc.kml` selection | Supported | Falls back to a root or first KML entry when needed |
| KMZ relative resources | Supported | Lazy archive access through `openKMZArchive` and `KMZVectorSource` |
| KML/KMZ writing | Supported | `KMLWriter` and `KMZWriter` cover common feature geometries and properties |
| Arbitrary CRS transformation | Not implemented | KML/KMZ coordinates are interpreted as WGS84 longitude/latitude |
| External NetworkLink fetching | Not implemented | Applications decide whether and how to fetch linked documents |

## Output

`KMLLoader` and `KMZLoader` return an Arrow table by default. Use the `shape`
option to request `geojson-table` or `object-row-table`. The Arrow geometry
column uses the loaders.gl GeoArrow/WKB table representation.

```typescript
import {load} from '@loaders.gl/core';
import {KMZLoader} from '@loaders.gl/kml';

const table = await load('map.kmz', KMZLoader);
```

For archive metadata and lazy resources, use `KMZVectorSource`. For XML or
archive output, use `KMLWriter` or `KMZWriter`.

<ReferenceBoundary
  title="KML document structure"
  description="The sections below cover the KML standard and the surrounding loader and document concepts."
  tone="mint"
/>

## KML and KMZ at a glance

KML and KMZ are often used together, but they are different layers of the format:

| Format | Contents | Extension | loaders.gl handling |
| ------ | -------- | --------- | ------------------- |
| KML | An XML document describing geographic features and presentation | `.kml` | Parsed directly by `KMLLoader` |
| KMZ | A ZIP archive containing a KML document and optional resources | `.kmz` | Extract the archive, then pass the contained KML to `KMLLoader` |

KMZ does not introduce a second XML vocabulary. It is a packaging convention for KML, images,
3D models, and other resources that the document references with relative paths. A KMZ commonly
contains a root-level `doc.kml`, although an application should inspect the archive rather than
assume a particular entry name.

## The KML document model

KML mixes geographic content with instructions for how a viewer should present it. The most common
document hierarchy is:

- `kml` is the XML root and declares the KML namespace.
- `Document` groups a related map or scene and can contain shared styles.
- `Folder` groups features for organization in a viewer.
- `Placemark` represents a named feature with a description, style, and geometry.
- `Point`, `LineString`, `LinearRing`, `Polygon`, and `MultiGeometry` describe common geometries.
- `GroundOverlay`, `ScreenOverlay`, and `PhotoOverlay` describe imagery or screen content rather
  than ordinary vector features.
- `NetworkLink` and region/LOD elements describe content that a viewer may load or refine later.

A minimal KML document looks like this:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Example places</name>
    <Placemark>
      <name>Loaders.gl</name>
      <description>A point with a human-readable description.</description>
      <Point>
        <coordinates>-122.0822035425683,37.42228990140251,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>
```

## Geometry and coordinates

KML coordinates are written in `longitude,latitude[,altitude]` order. This differs from APIs that
write latitude first, so coordinate order is a common source of mirrored or misplaced features.
`LineString` and polygon rings contain whitespace-separated coordinate tuples:

```xml
<LineString>
  <tessellate>1</tessellate>
  <coordinates>
    -122.1,37.4,0
    -122.0,37.4,0
    -122.0,37.5,0
  </coordinates>
</LineString>
```

For polygons, the outer and inner `LinearRing` coordinate sequences should be closed by repeating
the first coordinate. The `altitudeMode` element controls how altitude is interpreted, for example
relative to the ground or an absolute reference. `extrude` and `tessellate` add viewer-specific
behavior to lines and polygons; they do not change the coordinate order.

## Styles, metadata, and views

KML can carry information that is not part of a GeoJSON geometry:

- `Style` and `StyleMap` define icons, lines, polygons, labels, and balloons.
- `name` and `description` provide the labels and rich text shown by many viewers.
- `ExtendedData` carries application-specific attributes through `Data` or schema-backed values.
- `LookAt` and `Camera` describe an initial view, heading, tilt, and range.
- `Region`, `Lod`, and `NetworkLink` support visibility rules and dynamic content.

These elements make KML useful for presentation-oriented Earth browsers. When KML is converted to a
loaders.gl geometry table, the feature and geometry content is the primary result; a rendering
application should decide how to preserve or reapply viewer behavior such as camera views,
network-link refreshes, overlays, and styling.

## KMZ packaging

A KMZ file is a ZIP archive. In addition to the main KML document, it may contain:

- icons and other images referenced by `href` values;
- COLLADA or other model assets and their textures;
- additional KML documents linked from the main document; and
- folders that preserve the relative paths expected by the document.

Relative paths are significant. Extracting only the XML while discarding the neighboring resources
can leave icons, models, or descriptions unresolved. Treat archive paths as case-sensitive and keep
the extracted directory structure when an application needs to resolve those assets.

`@loaders.gl/kml` currently advertises and parses `.kml` XML documents. It does not automatically
unwrap `.kmz` archives or execute `NetworkLink` requests. Use `@loaders.gl/zip` (or another ZIP
implementation) to inspect and extract a KMZ, then pass the selected KML entry to `KMLLoader`.

## Loading KML and KMZ with loaders.gl

For a KML document:

```typescript
import {parse} from '@loaders.gl/core';
import {KMLLoader} from '@loaders.gl/kml';

const data = await parse(kmlBytes, KMLLoader);
```

For a KMZ archive, use the ZIP loader as an intermediate step:

```typescript
import {parse} from '@loaders.gl/core';
import {KMLLoader} from '@loaders.gl/kml';
import {ZipLoader} from '@loaders.gl/zip';

const files = await parse(kmzBytes, ZipLoader);
const kmlBytes = files['doc.kml'];
if (!kmlBytes) {
  throw new Error('KMZ archive does not contain doc.kml');
}
const data = await parse(kmlBytes, KMLLoader);
```

`KMLLoader` returns a `GeoJSONTable` by default. Set `kml.shape` to choose `object-row-table` or
`arrow-table` when the next stage of the application needs a different table representation. See
the [KMLLoader reference](/docs/modules/kml/api-reference/kml-loader) for the available shapes
and options.

## Interoperability checklist

When diagnosing a KML or KMZ file, check the following:

1. The root element uses the KML 2.2 namespace, `http://www.opengis.net/kml/2.2`.
2. Coordinates use longitude, latitude, and optional altitude order.
3. Polygon rings are closed and use the intended altitude mode.
4. KMZ resources retain their relative paths after extraction.
5. The application handles `gx:` extensions, overlays, styles, and network links according to its
   own feature requirements.
6. The file is parsed as XML KML after KMZ extraction; changing the archive suffix alone is not
   enough to make a ZIP file a KML document.

## References

- [OGC KML standard](https://www.ogc.org/standards/kml)
- [Google KML tutorial](https://developers.google.com/kml/documentation/kml_tut)
- [Google KML reference](https://developers.google.com/kml/documentation/kmlreference)
- [KMLLoader API reference](/docs/modules/kml/api-reference/kml-loader)
- [ZipLoader API reference](/docs/modules/zip/api-reference/zip-loader)

[kml_ogc_standard]: https://www.ogc.org/standards/kml
