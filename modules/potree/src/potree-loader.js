export default {
  id: 'potree',
  name: 'potree',
  extensions: ['json'],
  testText: text => text.indexOf('octreeDir') >= 0,
  parseTextSync: JSON.parse
};
