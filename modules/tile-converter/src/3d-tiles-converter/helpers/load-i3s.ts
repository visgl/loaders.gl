import {load} from '@loaders.gl/core';
import {
  I3STileContent,
  I3STileHeader,
  I3STilesetHeader,
  I3SLoader,
  I3SLoaderOptions
} from '@loaders.gl/i3s';

/**
 * Load I3S node content
 * @param sourceTileset - source layer JSON
 * @param sourceTile - source I3S node metadata
 * @param tilesetLoadOptions - load options for Tiles3DLoader
 * @returns - 3DTiles tile content or null
 */
export const loadI3SContent = async (
  sourceTileset: I3STilesetHeader | null,
  sourceTile: I3STileHeader,
  tilesetLoadOptions: I3SLoaderOptions
): Promise<I3STileContent | null> => {
  if (!sourceTileset || !sourceTile.contentUrl) {
    return null;
  }

  const loadOptions = {
    ...tilesetLoadOptions,
    i3s: {
      ...tilesetLoadOptions.i3s,
      isTileset: false,
      isTileHeader: false,
      _tileOptions: {
        attributeUrls: sourceTile.attributeUrls,
        textureUrl: sourceTile.textureUrl,
        textureFormat: sourceTile.textureFormat,
        textureLoaderOptions: sourceTile.textureLoaderOptions,
        materialDefinition: sourceTile.materialDefinition,
        isDracoGeometry: sourceTile.isDracoGeometry,
        mbs: sourceTile.mbs
      },
      _tilesetOptions: {
        store: sourceTileset.store,
        attributeStorageInfo: sourceTileset.attributeStorageInfo,
        fields: sourceTileset.fields
      }
    }
  };
  const tileContent = await load(sourceTile.contentUrl, I3SLoader, loadOptions);

  return tileContent;
};
