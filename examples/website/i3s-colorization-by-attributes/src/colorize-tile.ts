import {customizeColors} from '@loaders.gl/i3s';
import {createFloat16Array, getFloat16Value, setFloat16Value} from '@loaders.gl/schema';
import type {Tile3D} from '@loaders.gl/tiles';

import type {ColorsByAttribute} from './types';

/**
 * Applies per-feature colors to a loaded I3S tile using the example's current attribute ramp.
 */
export async function colorizeTile(
  tile: Tile3D,
  colorsByAttribute: ColorsByAttribute | null
): Promise<{isColored: boolean; id: string}> {
  const result = {isColored: false, id: tile.id};

  if ((tile.content as any).customColors !== colorsByAttribute) {
    if (tile.content && colorsByAttribute) {
      if (!(tile.content as any).originalColorsAttributes) {
        const colors = tile.content.attributes.colors;
        const originalValue = createColorCopy(colors);
        (tile.content as any).originalColorsAttributes = {
          ...colors,
          value: originalValue
        };
      } else if (colorsByAttribute.mode === 'multiply') {
        tile.content.attributes.colors.value.set((tile.content as any).originalColorsAttributes.value);
      }

      (tile.content as any).customColors = colorsByAttribute;

      const newColors = await customizeColors(
        tile.content.attributes.colors,
        tile.content.featureIds,
        tile.header.attributeUrls,
        tile.tileset.tileset.fields,
        tile.tileset.tileset.attributeStorageInfo,
        colorsByAttribute,
        (tile.tileset.loadOptions as any).i3s.token
      );

      if ((tile.content as any).customColors === colorsByAttribute) {
        tile.content.attributes.colors = newColors;
        result.isColored = true;
      }
    } else if (tile.content && (tile.content as any).originalColorsAttributes) {
      tile.content.attributes.colors.value = (tile.content as any).originalColorsAttributes.value;
      (tile.content as any).customColors = null;
      result.isColored = true;
    }
  }

  return result;
}

/** Clone byte, Float16, or Float32 color storage for later restoration. */
function createColorCopy(colors: any): any {
  if (colors.componentType !== 'float16') {
    return colors.value instanceof Float32Array
      ? new Float32Array(colors.value)
      : new Uint8Array(colors.value);
  }
  const value = createFloat16Array(colors.value.length);
  for (let index = 0; index < colors.value.length; index++) {
    setFloat16Value(value, index, getFloat16Value(colors.value, index));
  }
  return value;
}
