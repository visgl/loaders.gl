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
import './wkt/parse-wkb.spec';
import './wkt/encode-wkb.spec';
// import './wkt/parse-twkb.spec';
import './wkt/encode-twkb.spec';
import './wkt/parse-hex-wkb.spec';
import './wkt/parse-wkt.spec';
import './wkt/encode-wkt.spec';
import './wkt/parse-wkt-crs.spec';

// geoarrow
import './geoarrow/convert-geoarrow-to-binary-geometry.spec';
import './geoarrow/convert-geoarrow-to-geojson.spec';
import './geoarrow/get-arrow-bounds.spec';
