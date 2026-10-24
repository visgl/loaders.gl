## Test data files

### `rivers_small.gpkg`

This is derived from the [test file][ngageoint_test_file] from the `ngageoint/geopackage-js` repository.

[ngageoint_test_file]: https://github.com/ngageoint/geopackage-js/blob/bfabe794f1/xyz/rivers.gpkg

```bash
# directory for geopackage test data
cd test/data/geopackage/

# Download full geopackage file (2MB)
wget https://raw.githubusercontent.com/ngageoint/geopackage-js/bfabe794f1dd6dbeac9d23def0051d5a35d00d34/xyz/rivers.gpkg

# Select just first geometry from file
# Need to use `-nln` to set the output layer name, otherwise it'll be named `SELECT`.
ogr2ogr \
    -f 'GPKG' \
    -nln 'FEATURESriversds' \
    -sql "SELECT * FROM FEATURESriversds LIMIT 1" \
    rivers_small.gpkg rivers.gpkg

# Convert to GeoJSON using OGR to test against
ogr2ogr -f 'GeoJSON' -preserve_fid rivers_small.geojson rivers_small.gpkg
```
