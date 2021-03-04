/**
 * Generates url with token if it is exists.
 * @param {String} url
 * @param {any} token
 * @returns {string}
 */
export function getUrlWithToken(url, token = null) {
  return token ? `${url}?token=${token}` : url;
}

/**
 * Generates attribute urls for tile.
 * @param {Object} tile
 * @returns {Array}
 */
export function generateTileAttributeUrls(tile) {
  const {url, attributeData} = tile;
  const attributeUrls = [];

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
  const attributeUrls = [];
  const {attributeStorageInfo, url} = tileset;

  for (let index = 0; index < attributeStorageInfo.length; index++) {
    const fileName = attributeStorageInfo[index].key;
    attributeUrls.push(`${url}/nodes/${resource}/attributes/${fileName}/0`);
  }

  return attributeUrls;
}
