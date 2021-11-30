import {Node3DIndexDocument} from '../../types';

/**
 * Generates url with token if it is exists.
 * @param url
 * @param token
 * @returns
 */
export function getUrlWithToken(url: string, token: string | null = null): string {
  return token ? `${url}?token=${token}` : url;
}

/**
 * Generates attribute urls for tile.
 * @param tile
 * @returns list of attribute urls
 */
export function generateTileAttributeUrls(url: string, tile: Node3DIndexDocument): string[] {
  const {attributeData = []} = tile;
  const attributeUrls: string[] = [];

  for (let index = 0; index < attributeData.length; index++) {
    const attributeUrl = attributeData[index].href.replace('./', '');
    attributeUrls.push(`${url}/${attributeUrl}`);
  }

  return attributeUrls;
}

/**
 * Generates attribute urls for tileset based on tileset and resource
 * @param {Object} tileset
 * @param {number} resource
 * @returns {Array}
 */
export function generateTilesetAttributeUrls(tileset, resource) {
  const attributeUrls: string[] = [];
  const {attributeStorageInfo, url} = tileset;

  for (let index = 0; index < attributeStorageInfo.length; index++) {
    const fileName = attributeStorageInfo[index].key;
    attributeUrls.push(`${url}/nodes/${resource}/attributes/${fileName}/0`);
  }

  return attributeUrls;
}
