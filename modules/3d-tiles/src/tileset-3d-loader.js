/* global TextDecoder */
export default {
  name: '3D Tileset',
  extensions: ['json'],
  parse: arrayBuffer => JSON.parse(new TextDecoder().decode(arrayBuffer)),
  parseTextSync: JSON.parse,
  testText: text => text.indexOf('asset' >= 0)
};
