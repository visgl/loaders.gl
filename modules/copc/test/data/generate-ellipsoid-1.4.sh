# Scale RGBI to 16-bit values, add an inverted intensity as extra-bytes.
pdal translate \
	ellipsoid.laz \
	ellipsoid-1.4.laz \
	--writers.las.minor_version=4 \
	--writers.las.dataformat_id=7 \
	--writers.las.extra_dims="InvertedIntensity=uint16" \
	--filters.ferry.dimensions="Intensity => InvertedIntensity" \
	--filters.assign.value="Intensity = 65535 WHERE Intensity == 255" \
	--filters.assign.value="Intensity = 32767 WHERE Intensity == 128" \
	--filters.assign.value="InvertedIntensity = 65535 WHERE Intensity == 32767" \
	--filters.assign.value="InvertedIntensity = 32767 WHERE Intensity == 65535" \
	--filters.assign.value="Red = Red * 257" \
	--filters.assign.value="Blue = Blue * 257" \
	--filters.assign.value="Green = Green * 257" \
	filters.ferry \
	filters.assign

