import {registerLoaders} from '@loaders.gl/core';
import {Tile3DLoader} from '@loaders.gl/3d-tiles';

import './batched-model-3d-tile.spec';
import './instanced-model-3d-tile.spec';
import './point-cloud-3d-tile.spec';
import './composite-3d-tile.spec';

registerLoaders([Tile3DLoader]);
