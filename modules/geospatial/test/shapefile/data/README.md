# Data Attribution

- Files in the `shapefile-js/` folder are from [`mbostock/shapefile`](https://github.com/mbostock/shapefile), under a custom license; license file copied to [`shapefile-js/LICENSE.txt`](shapefile-js/LICENSE.txt)

`multipolygon_with_holes` is created with:

```py
import geopandas as gpd
from shapely.geometry import Polygon, box

ring = box(0, 0, 20, 10)
middle_cut = box(5, 0, 15, 10)
left_hole = box(2, 2, 4, 4)
final = ring - middle_cut - left_hole

gdf = gpd.GeoDataFrame(geometry=[final])
gdf.to_file('multipolygon_with_holes.shp')
with open('multipolygon_with_holes.json', 'w') as f:
    json.dump(gdf.to_json(), f)
```

`point-z` is created with:

```py
import geopandas as gpd
from shapely.geometry import Point

gdf = gpd.GeoDataFrame({'a': [1]}, geometry=[Point(1, 2, 3)])
gdf.to_file('point-z.shp')
gdf.to_file('point-z.json', driver='GeoJSON')
```
