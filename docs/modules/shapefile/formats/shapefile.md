
# Shapefile

ESRI Shapefiles is a file format for storing geospatial vector data.

- *[`@loaders.gl/shapefile`](/docs/modules/shapefile)* 
- *[Wikipedia](https://en.wikipedia.org/wiki/Shapefile)* - *[ESRI Shapefile Whitepaper](https://www.esri.com/content/dam/esrisites/sitecore-archive/Files/Pdfs/library/whitepapers/pdfs/shapefile.pdf)* - *[Notes on Shapefile usage](http://webhelp.esri.com/arcgisdesktop/9.3/index.cfm?TopicName=Geoprocessing_considerations_for_shapefile_output)*
- *[DBF header](http://www.dbase.com/Knowledgebase/INT/db7_file_fmt.htm)* - *[data types](https://www.clicketyclick.dk/databases/xbase/format/data_types.html_)* - *[code pages](https://support.esri.com/en/technical-article/000013192)* - *[implementation notes](https://www.loc.gov/preservation/digital/formats/fdd/fdd000326.shtml)*

*Note that Shapefiles are falling out of favor in modern usage (likely due to the significant inconvenience of having to deal with multiple files). However, a lot of valuable geospatial data available is still provided in Shapefile format, and sometimes only in this format.
Additional information and some strong opinions can be found at [switchfromshapefile.org](http://switchfromshapefile.org/).*

## A multi-file format

A Shapefile consists of a number of files that must be read and written together. 
Because of this, they are typically stored together with the same file name but different extensions.
These related files are usually stored in the same directory or inside a common zip archive.
While it is possible to just load the geometries from a `.shp` file, files with extensions `.shp`, `.shx`, `.dbf` are often expected to exist, 
and additional files with other extensions such as `.prj` and `.cpg` may also exist, if needed.

A common problem with shapefiles is that the user only opens the `.shp` file but not the accompanying files such as `.dbf`.

| File   | Type   | Contents                                                                                                       |
| ------ | ------ | -------------------------------------------------------------------------------------------------------------- |
| `.shp` | Binary | The geometry, i.e. the geometry column in the resulting table.                                                 |
| `.dbf` | Binary | The attributes, i.e. the data columns in the resulting table.                                                  |
| `.shx` | Binary | The index (technically required, however it is sometimes possible to open shapefiles without the index)        |
| `.prj` | Text   | A small usually single line text file containing a WKT-CRS style projection. WGS84 is assumed if not present.  |
| `.cpg` | Text   | A small text file containing a text encoding name for the DBF text fields. `latin1` is assumed if not present. |

### Coordinate Systems

Arbitrary coordinate reference systems are supported for Shapefiles. 

Such coordinate systems are reprojected to WGS84 on import. 

### Encodings

The optional "code page" file (`.cpg`) specifies the encoding of any text data in the Shapefile (or more precisely, in the sidecar `.dbf` file). If no `.cpg` file is provided, `latin1` encoding is assumed.

### Geometries

A Shapefile always encodes a single type of geometries. The following geometries are supported:

| Shape type    | GeoJSON      | loaders.gl | Value | Fields                                                                                                          |
| ------------- | ------------ | ---------- | ----- | --------------------------------------------------------------------------------------------------------------- |
| `Null` shape  | `null`       | ✅          | 0     | None                                                                                                            |
| `Point`       | `Point`      | ✅          | 1     | X, Y                                                                                                            |
| `Polyline`    | `LineString` | ✅          | 3     | MBR, Number of parts, Number of points, Parts, Points                                                           |
| `Polygon`     | `Polygon`    | ✅          | 5     | MBR, Number of parts, Number of points, Parts, Points                                                           |
| `MultiPoint`  | `MultiPoint` | ✅          | 8     | MBR, Number of points, Points                                                                                   |
| `PointZ`      | `Point`      | ✅          | 11    | X, Y, Z Optional: M                                                                                             |
| `PolylineZ`   | `LineString` | ✅          | 13    | MBR, Number of parts, Number of points, Parts, Points, Z range, Z array Optional: M range, M array              |
| `PolygonZ`    | `Polygon`    | ✅          | 15    | MBR, Number of parts, Number of points, Parts, Points, Z range, Z array Optional: M range, M array              |
| `MultiPointZ` | `MultiPoint` | ✅          | 18    | MBR, Number of points, Points, Z range, Z array Optional: M range, M array                                      |
| `PointM`      | `Point`      | ✅          | 21    | X, Y, M                                                                                                         |
| `PolylineM`   | `LineString` | ✅          | 23    | MBR, Number of parts, Number of points, Parts, Points Optional: M range, M array                                |
| `PolygonM`    | `Polygon`    | ✅          | 25    | MBR, Number of parts, Number of points, Parts, Points Optional: M range, M array                                |
| `MultiPointM` | `MultiPoint` | ✅          | 28    | MBR, Number of points, Points Optional Fields: M range, M array                                                 |
| `MultiPatch`  |              | ❌          | 31    | MBR , Number of parts, Number of points, Parts, Part types, Points, Z range, Z array Optional: M range, M array |

- `value` is the internal shapefile encoding

### Version History

- The shapefile format was introduced with ArcView GIS version 2 in the early 1990s.

### Troubleshooting

- No data columns: The most common problem with shapefile is probably that they user only opens the main `.shp` file. In this case only the geometry is included, but no data columns are present.
- Geometry projection issues: geometry may fail to load or be visualized incorrectly without the associated `.prj` file.
- Incorrect strings: Encodings may not be correct without the `.cpg` file.

Also note that there is a very large number of possible projections and it is hard to test that every possible projection is supported. If your data is old or known to be problematic, it may be worth double checking that things look correct after importing.
