// TODO - deprecated
function parseTextSync(text, options) {
  return JSON.parse(text);
}

export default {
  name: 'JSON',
  extensions: ['json'],
  testText: null,
  parseTextSync
};
