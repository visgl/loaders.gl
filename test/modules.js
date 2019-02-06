// Sets up aliases in loaders.gl
const ALIASES = require('../aliases');
const {addAliases} = require('@loaders.gl/core/read-file/file-aliases');
addAliases(ALIASES);

import '@loaders.gl/core/../test';

import '@loaders.gl/images/../test';

import '@loaders.gl/draco/../test';
import '@loaders.gl/las/../test';
import '@loaders.gl/obj/../test';
import '@loaders.gl/pcd/../test';
import '@loaders.gl/ply/../test';

import '@loaders.gl/gltf/../test';

import '@loaders.gl/kml/../test';
import '@loaders.gl/zip/../test';
import '@loaders.gl/arrow/../test';

import '@loaders.gl/experimental/../test';
