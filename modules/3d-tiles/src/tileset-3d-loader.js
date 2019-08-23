export default {
  name: '3D Tileset',
  extensions: ['json'],
  testText: text => text.indexOf('asset' >= 0),
  parseTextSync: JSON.parse
};
