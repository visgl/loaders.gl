import {fetchFile} from '@loaders.gl/core';
import {dirname} from 'path';

export async function loadRootTileFromTileset(t, tilesetUrl) {
  try {
    // Load tileset
    let response = await fetchFile(tilesetUrl);
    const tileset = await response.json();

    // Load binary data for root tile
    const tileDirectory = dirname(tilesetUrl);
    const tileUrl = `${tileDirectory}/${tileset.root.content.uri}`;
    t.comment(`Loading ${tileUrl} from ${tileDirectory} for ${tilesetUrl}`);
    response = await fetchFile(tileUrl);
    const tile = await response.arrayBuffer();
    return tile;
  } catch (error) {
    t.fail(`Failed to load tile from ${tilesetUrl}: ${error}`);
    throw error;
  }
}
