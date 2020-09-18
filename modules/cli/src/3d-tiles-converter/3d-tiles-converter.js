import {load} from '@loaders.gl/core';
import {I3SLoader} from '@loaders.gl/i3s';
import {Tileset3D} from '@loaders.gl/tiles';

export default class Tiles3DConverter {
  async convert({inputUrl, outputPath, tilesetName, maxDepth}) {
    const sourceTilesetJson = await load(inputUrl, I3SLoader, {});
    console.log(sourceTilesetJson); // eslint-disable-line
    this.sourceTileset = new Tileset3D(sourceTilesetJson, {});

    // TODO: implement traversal here
  }
}
