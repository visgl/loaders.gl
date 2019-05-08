"use strict";module.export({loadTileset:()=>loadTileset,loadRootTileFromTileset:()=>loadRootTileFromTileset});var fetchFile;module.link('@loaders.gl/core',{fetchFile(v){fetchFile=v}},0);var dirname;module.link('path',{dirname(v){dirname=v}},1);


async function loadTileset(t, tilesetUrl) {
  try {
    // Load tileset
    const response = await fetchFile(tilesetUrl);
    const tileset = await response.json();

    return tileset;
  } catch (error) {
    t.fail(`Failed to load tile from ${tilesetUrl}: ${error}`);
    throw error;
  }
}

async function loadRootTileFromTileset(t, tilesetUrl) {
  try {
    // Load tileset
    let response = await fetchFile(tilesetUrl);
    const tileset = await response.json();

    // Load binary data for root tile
    const tileDirectory = dirname(tilesetUrl);
    const tileUrl = `${tileDirectory}/${tileset.root.content.uri}`;
    // t.comment(`Loading ${tileUrl} from ${tileDirectory} for ${tilesetUrl}`);
    response = await fetchFile(tileUrl);
    const tile = await response.arrayBuffer();
    return tile;
  } catch (error) {
    t.fail(`Failed to load tile from ${tilesetUrl}: ${error}`);
    throw error;
  }
}
