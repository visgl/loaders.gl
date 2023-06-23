import type {
  Tiles3DTileContent,
  Tiles3DTileJSONPostprocessed,
  Tiles3DTilesetJSONPostprocessed
} from '@loaders.gl/3d-tiles';
import {fetchFile, load} from '@loaders.gl/core';
import {Tiles3DLoadOptions} from '../types';

/**
 * Load nested 3DTiles tileset. If the sourceTile is not nested tileset - do nothing
 * @param sourceTileset - source root tileset JSON
 * @param sourceTile - source tile JSON that is supposed to has link to nested tileset
 * @param globalLoadOptions - load options for Tiles3DLoader
 * @returns nothing
 */
export const loadNestedTileset = async (
  sourceTileset: Tiles3DTilesetJSONPostprocessed | null,
  sourceTile: Tiles3DTileJSONPostprocessed,
  globalLoadOptions: Tiles3DLoadOptions
): Promise<void> => {
  const isTileset = sourceTile.type === 'json';
  if (!sourceTileset || !sourceTile.contentUrl || !isTileset) {
    return;
  }

  const loadOptions = {
    ...globalLoadOptions,
    [sourceTileset.loader.id]: {
      isTileset,
      assetGltfUpAxis: (sourceTileset.asset && sourceTileset.asset.gltfUpAxis) || 'Y'
    }
  };
  const tileContent = await load(sourceTile.contentUrl, sourceTileset.loader, loadOptions);

  if (tileContent.root) {
    sourceTile.children = [tileContent.root];
  }
};

/**
 * Load 3DTiles tile content, that includes glTF object
 * @param sourceTileset - source root tileset JSON
 * @param sourceTile - source tile JSON that has link to content data
 * @param globalLoadOptions - load options for Tiles3DLoader
 * @returns - 3DTiles tile content or null
 */
export const loadTile3DContent = async (
  sourceTileset: Tiles3DTilesetJSONPostprocessed | null,
  sourceTile: Tiles3DTileJSONPostprocessed,
  globalLoadOptions: Tiles3DLoadOptions
): Promise<Tiles3DTileContent | null> => {
  const isTileset = sourceTile.type === 'json';
  if (!sourceTileset || !sourceTile.contentUrl || isTileset) {
    return null;
  }

  const loadOptions = {
    ...globalLoadOptions,
    [sourceTileset.loader.id]: {
      isTileset,
      assetGltfUpAxis: (sourceTileset.asset && sourceTileset.asset.gltfUpAxis) || 'Y'
    }
  };
  const tileContent = await load(sourceTile.contentUrl, sourceTileset.loader, loadOptions);

  return tileContent;
};

export const fetchTile3DContent = async (
  sourceTileset: Tiles3DTilesetJSONPostprocessed | null,
  sourceTile: Tiles3DTileJSONPostprocessed,
  globalLoadOptions: Tiles3DLoadOptions
): Promise<ArrayBuffer | null> => {
  const isTileset = sourceTile.type === 'json';
  if (!sourceTileset || !sourceTile.contentUrl || isTileset) {
    return null;
  }

  const loadOptions = {
    ...globalLoadOptions,
    [sourceTileset.loader.id]: {
      isTileset
    }
  };
  const response = await fetchFile(sourceTile.contentUrl, loadOptions);
  const tileContent = await response.arrayBuffer();

  return tileContent;
};
