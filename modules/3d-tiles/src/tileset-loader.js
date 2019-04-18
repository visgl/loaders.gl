export default {
  name: '3D Tileset',
  extensions: ['json'],
  testText: text => text.indexOf('tilesetVersion' >= 0),
  parseTextSync: JSON.parse
};
