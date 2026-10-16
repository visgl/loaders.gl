These tiny, authored geoid TIFFs are copied from math.gl commit 04f22aec (MIT):
https://github.com/visgl/math.gl/tree/04f22aec/modules/proj4/test/fixtures/vertical-geotiff

Regeneration source and encoder:
https://github.com/visgl/math.gl/blob/04f22aec/modules/proj4/scripts/generate-vertical-geotiff-reference.py

Copyright (c) vis.gl contributors. SPDX-License-Identifier: MIT.
No third-party grid data is included. Samples are stored north to south;
point-float32 has a 4 by 4 degree grid with lower-left node (10, 40),
upper-left value 22 and lower-left value 12.5. The signed integer variant
stores raw values with SCALE=0.25 and OFFSET=-10. The nodata sentinel is
-9999.1, rounded to Float32 when stored in the samples. Nested grids are
two full-resolution IFDs, not overviews.

`multiband.tif` is authored here by `generate-multiband.py` (Python standard library).
It is a 2x2 signed-int16 chunky raster with two bands and NewSubfileType=1.
Run the script to regenerate it byte for byte.
