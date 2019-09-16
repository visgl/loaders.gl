/* global TextDecoder */
import loadOBJ from './lib/load-obj';

export default {
  name: 'OBJ',
  extensions: ['obj'],
  mimeType: 'text/plain',
  parse: arrayBuffer => loadOBJ(new TextDecoder().decode(arrayBuffer)),
  parseTextSync: loadOBJ,
  testText: testOBJFile
};

function testOBJFile(text) {
  // TODO - There could be comment line first
  return text[0] === 'v';
}
