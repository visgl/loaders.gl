# @loaders.gl/geoarrow

High-performance conversion and inspection APIs for GeoArrow and GeoParquet geometry columns.
The module works on Apache Arrow tables and vectors and is intended for applications, Scan, and
rendering pipelines that need typed coordinate buffers.

## Install

```bash
yarn add @loaders.gl/geoarrow apache-arrow
```

## Convert a table

Use `encodingPreference: 'optimized'` when the geometry family is not known in advance. It selects
a concrete native GeoArrow encoding for homogeneous data and a stable dense union for mixed data.
Use `geoarrow.wkb` for compact interchange, or `geoarrow.geometry` when every result must share a
dense-union schema.

```typescript
import {convertTableToGeoArrow} from '@loaders.gl/geoarrow';

const optimized = convertTableToGeoArrow(table, {
  geoarrow: {encodingPreference: 'optimized'}
});

const union = convertTableToGeoArrow(table, {
  geoarrow: {encodingPreference: 'geoarrow.geometry'}
});
```

The exact `geoarrow.point`, `geoarrow.linestring`, `geoarrow.polygon`, and other native targets
remain available through `geoarrow.encoding` for controlled pipelines. Do not specify `encoding`
and `encodingPreference` together.

## Inspect and process

The public API includes field inspection and validation, bounds, coordinate mapping, ring
rewinding, builders, and table/vector conversion. Native GeoArrow buffers are preferred for
repeated coordinate operations because they avoid parsing variable-length WKB records for every
operation.

```typescript
import {
  getGeoArrowFieldInfo,
  getGeoArrowBounds,
  validateGeoArrowField
} from '@loaders.gl/geoarrow';

const geometryField = table.schema.fields.find(field => field.name === 'geometry');
if (geometryField) {
  validateGeoArrowField(geometryField);
  console.log(getGeoArrowFieldInfo(geometryField));
  console.log(getGeoArrowBounds(table.getChild('geometry')));
}
```

See the [GeoArrow format guide](https://loaders.gl/docs/modules/arrow/formats/geoarrow) for
encoding selection, metadata, dimensions, streaming schema rules, and GeoParquet relationships.
