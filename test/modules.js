// Sets up aliases in loaders.gl
const ALIASES = require('../aliases');
const {addAliases} = require('@loaders.gl/core/fetch-file/file-aliases');
addAliases(ALIASES);

require('@loaders.gl/core/test');

require('@loaders.gl/images/test');

require('@loaders.gl/draco/test');
require('@loaders.gl/las/test');
require('@loaders.gl/obj/test');
require('@loaders.gl/pcd/test');
require('@loaders.gl/ply/test');

require('@loaders.gl/gltf/test');

require('@loaders.gl/kml/test');
require('@loaders.gl/zip/test');
require('@loaders.gl/arrow/test');

require('@loaders.gl/experimental/test');
