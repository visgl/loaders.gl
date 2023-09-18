
# Shapefile

- *[`@loaders.gl/shapefile`](/docs/modules/shapefile)*
- *https://www.clicketyclick.dk/databases/xbase/format/data_types.html*
- *http://www.dbase.com/Knowledgebase/INT/db7_file_fmt.htm*
- *http://webhelp.esri.com/arcgisdesktop/9.3/index.cfm?TopicName=Geoprocessing_considerations_for_shapefile_output*
- *https://www.loc.gov/preservation/digital/formats/fdd/fdd000326.shtml*
- *https://support.esri.com/en/technical-article/000013192*

ESRI Shapefiles are a popular file format for storing geospatial vector data.

## Multi-file Summary

The format consists of a number of files that must be stored together 
(in the same directory, and with the same file name but different extensions). 
Files with extensions `.shp`, `.shx`, `.dbf` must exist;
additional files with other extensions such as `.prj` and `.cpg` may exist.

A common problem with shapefiles is that the user only opens the shp file but not the dbf.

| File   | Type   | Contents                                                                                                       |
| ------ | ------ | -------------------------------------------------------------------------------------------------------------- |
| `.shp` | Binary | The geometry, i.e. the geometry column in the resulting table.                                                 |
| `.dbf` | Binary | The attributes, i.e. the data columns in the resulting table.                                                  |
| `.shx` | Binary | The index (technically required, however it is sometimes possible to open shapefiles without the index)        |
| `.prj` | Text   | A small usually single line text file containing a WKT-CRS style projection. WGS84 is assumed if not present.  |
| `.cpg` | Text   | A small text file containing a text encoding name for the DBF text fields. `latin1` is assumed if not present. |
