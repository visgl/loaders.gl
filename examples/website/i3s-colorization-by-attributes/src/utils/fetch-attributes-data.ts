import {fetchFile} from '@loaders.gl/core';
import {StatsInfo} from '@loaders.gl/i3s';

function resolveUrl(statisticUrl: string, tilesetUrl: string): string {
  const statUrl = new URL(statisticUrl, `${tilesetUrl}/`);
  return decodeURI(statUrl.toString());
}

/**
 * Fetch and return min and max value for the numeric attribute
 * @param tilesetUrl - base tileset url
 * @param attributeUrl - attribute url
 * @param attributeName - attributeName
 * @returns Promise of the attribute name, min and max values
 */
export async function getNumericAttributeInfo(
  tilesetUrl: string,
  attributeUrl: string,
  attributeName: string
): Promise<{name: string; min: number; max: number} | null> {
  const statAttributeUrl = resolveUrl(attributeUrl, tilesetUrl);
  try {
    let stats: StatsInfo | null = null;
    const dataResponse = await fetchFile(statAttributeUrl);
    const data = JSON.parse(await dataResponse.text());
    stats = (data?.stats as StatsInfo) || null;
    if (typeof stats?.min === 'number' && typeof stats?.max === 'number') {
      return {name: attributeName, min: stats.min, max: stats.max};
    }
  } catch (error) {
    console.error(error);
  }
  return null;
}
