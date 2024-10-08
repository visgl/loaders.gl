// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// binary features
import './binary-features/binary-to-geojson.spec';
import './binary-features/geojson-to-flat-geojson.spec';
import './binary-features/geojson-to-binary.spec';
import './binary-features/transform.spec';

// utils
import './utils/hex-transcoder.spec';

// wkt format family parsers/encoder
import './wkt/convert-wkb-to-geometry.spec';
// import './wkt/convert-twkb-to-geometry.spec';
import './wkt/convert-wkt-to-geometry.spec';

import './wkt/convert-geometry-to-wkb.spec';
import './wkt/convert-geometry-to-twkb.spec';
import './wkt/convert-geometry-to-wkt.spec';

// import './wkt/parse-hex-wkb.spec';

import './wkt-crs/parse-wkt-crs.spec';

// geoarrow
import './geoarrow/convert-geoarrow-to-binary-geometry.spec';
import './geoarrow/convert-geoarrow-to-geojson.spec';
import './geoarrow/get-arrow-bounds.spec';

import './tables/convert-geojson-to-arrow-table.spec';
