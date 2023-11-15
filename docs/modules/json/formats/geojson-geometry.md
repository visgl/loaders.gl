# GeoJSON Geometry

GeoJSON geometries can sometimes be useful independently of GeoJSON.

## Examples

```json
  {
    "type": "Point",
    "coordinates": [102.0, 0.5]
  },
```

```json
  {
    "type": "LineString",
    "coordinates": [
      [102.0, 0.0],
      [103.0, 1.0],
      [104.0, 0.0],
      [105.0, 1.0]
    ]
  },
```

```json
  {
    "type": "Polygon",
    "coordinates": [
      [
        [100.0, 0.0],
        [101.0, 0.0],
        [101.0, 1.0],
        [100.0, 1.0],
        [100.0, 0.0]
      ]
    ]
  }
```

## Alternatives

| Format       | Notes                                                               |
| ------------ | ------------------------------------------------------------------- |
| WKB          | Binary, more compact                                                |
| WKT          | Text based, slightly more compact, a bit harder to parse (not JSON) |
| GML Geometry | XML based, even more verbose, more complex to parse                 |
