// Sets up aliases in loaders.gl
const ALIASES = require('../aliases');
const {addAliases} = require('@loaders.gl/core/read-file/file-aliases');
addAliases(ALIASES);

import "../modules/core/test";

import "../modules/images/test";

import "../modules/draco/test";
import "../modules/las/test";
import "../modules/obj/test";
import "../modules/pcd/test";
import "../modules/ply/test";

import "../modules/gltf/test";

import "../modules/kml/test";
import "../modules/zip/test";
import "../modules/arrow/test";

import "../modules/experimental/test";
