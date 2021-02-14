export const JSONLoader = {
  name: 'JSON',
  extensions: ['json'],
  testText: null,
  parseTextSync
};

// TODO - deprecated
function parseTextSync(text, options) {
  return JSON.parse(text);
}
