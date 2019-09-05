export default {
  name: 'potree',
  extensions: ['json'],
  testText: text => text.indexOf('octreeDir') >= 0,
  parseTextSync: JSON.parse
};
