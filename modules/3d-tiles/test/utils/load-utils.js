import {fetchFile, parse} from '@loaders.gl/core';
import {Tileset3DLoader, Tileset3D} from '@loaders.gl/3d-tiles';

export async function loadTileset(t, tilesetUrl) {
  try {
    // Load tileset
    const tileset = await parse(fetchFile(tilesetUrl), Tileset3DLoader);
    const tileset3d = new Tileset3D(tileset, tilesetUrl);
    return tileset3d;
  } catch (error) {
    t.fail(`Failed to load tile from ${tilesetUrl}: ${error}`);
    throw error;
  }
}

export async function loadRootTileFromTileset(t, tilesetUrl) {
  try {
    // Load tileset
    const tileset = await parse(fetchFile(tilesetUrl), Tileset3DLoader);
    const tileset3d = new Tileset3D(tileset, tilesetUrl);

    // Load binary data for root tile
    const response = await fetchFile(tileset3d.root.uri);
    return response.arrayBuffer();

    // const tile = await parse(response, Tile3DLoader);
    // return tile;
  } catch (error) {
    t.fail(`Failed to load tile from ${tilesetUrl}: ${error}`);
    throw error;
  }
}
