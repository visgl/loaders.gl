import {KmlDocsTabs} from '@site/src/components/docs/kml-docs-tabs';

# KML, GPX, TCX Format

<KmlDocsTabs active="format" />

| Characteristic       | Value                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------ |
| File Formats         | [KML](/docs/modules/kml/formats/kml), [GPX](/docs/modules/kml/formats/gpx), [TCX](/docs/modules/kml/formats/tcx) |
| Data Format          | [Geometry Tables](/docs/specifications/category-gis), GeoJSON                              |
| File Extensions      | `.kml`, `.gpx`, `.tcx`                                                                     |
| MIME Types           | `application/vnd.google-earth.kml+xml`, `application/gpx+xml`, `application/vnd.garmin.tcx+xml` |
| File Type            | Text/XML                                                                                   |
| Loader APIs          | `load`, `parse`, `parseTextSync`                                                           |
| Loader Worker Thread | No                                                                                         |
| Loader Streaming     | No                                                                                         |

## Loaders

<div className="docs-api-card-grid">
  <a className="docs-api-card" href="/docs/modules/kml/api-reference/kml-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>KMLLoader</strong>
    <span>Loads Keyhole Markup Language documents as loaders.gl geometry tables.</span>
    <span className="docs-api-card__meta">Output: GeoJSONTable, ObjectRowTable, ArrowTable</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseTextSync</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/kml/api-reference/gpx-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>GPXLoader</strong>
    <span>Loads GPS Exchange Format tracks, routes, and waypoints as loaders.gl geometry tables.</span>
    <span className="docs-api-card__meta">Output: GeoJSONTable, ObjectRowTable, ArrowTable, BinaryFeatureCollection</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseTextSync</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/kml/api-reference/tcx-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>TCXLoader</strong>
    <span>Loads Training Center XML activity files as loaders.gl geometry tables.</span>
    <span className="docs-api-card__meta">Output: GeoJSONTable, ObjectRowTable, ArrowTable, BinaryFeatureCollection</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseTextSync</span>
  </a>
</div>

## XML-Based Formats

KML, GPX, and TCX are XML-based geospatial interchange formats. They are text files that describe placemarks, waypoints, routes, tracks, or activities using format-specific XML elements.

## Geospatial Output

The KML module converts these XML documents into loaders.gl geometry table shapes for application code. The default output is a `GeoJSONTable`, and `arrow-table` can be selected when columnar Arrow output is needed.
