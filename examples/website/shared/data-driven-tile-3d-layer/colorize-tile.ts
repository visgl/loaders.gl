import {customizeColors} from '@loaders.gl/i3s';
import type {Tile3D} from '@loaders.gl/tiles';
import type {ColorsByAttribute, TileUpdateResult} from './types';

/**
 * Applies attribute-driven colors to an I3S tile mesh.
 */
export async function colorizeTile(
  tile: Tile3D,
  colorsByAttribute: ColorsByAttribute | null
): Promise<TileUpdateResult> {
  const result: TileUpdateResult = {isUpdated: false, id: tile.id};

  if (tile.content.customColors === colorsByAttribute) {
    return result;
  }

  if (tile.content && colorsByAttribute) {
    if (!tile.content.originalColorsAttributes) {
      tile.content.originalColorsAttributes = {
        ...tile.content.attributes.colors,
        value: new Uint8Array(tile.content.attributes.colors.value)
      };
    } else if (colorsByAttribute.mode === 'multiply') {
      tile.content.attributes.colors.value.set(tile.content.originalColorsAttributes.value);
    }

    tile.content.customColors = colorsByAttribute;

    const newColors = await customizeColors(
      tile.content.attributes.colors,
      tile.content.featureIds,
      tile.header.attributeUrls,
      tile.tileset.tileset.fields,
      tile.tileset.tileset.attributeStorageInfo,
      colorsByAttribute,
      (tile.tileset.loadOptions as any)?.i3s?.token
    );

    if (tile.content.customColors === colorsByAttribute) {
      tile.content.attributes.colors = newColors;
      result.isUpdated = true;
    }

    return result;
  }

  if (tile.content && tile.content.originalColorsAttributes) {
    tile.content.attributes.colors.value = tile.content.originalColorsAttributes.value;
    tile.content.customColors = null;
    result.isUpdated = true;
  }

  return result;
}
