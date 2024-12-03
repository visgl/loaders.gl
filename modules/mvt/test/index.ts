// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import './lib/parse-mvt-from-pbf.spec';

// geojson-vt
import './lib/vector-tiler/clip-features.spec';
import './lib/vector-tiler/simplify-path.spec';
// './get-tile.spec.ts' Was used as basis for table-tile-source.spec
// './full.spec'  Was used as basis for table-tile-source-full.spec
// './multi-world.spec'  Was used as basis for table-tile-source-multi-world.spec

import './lib/utils/geometry-utils.spec';

import './tilejson-loader.spec';

import './mvt-loader.spec';
import './mvt-writer.spec';
import './mvt-source.spec';

import './table-tile-source.spec';
// import './table-tile-source-full.spec';
// import './table-tile-source-multi-world.spec';
