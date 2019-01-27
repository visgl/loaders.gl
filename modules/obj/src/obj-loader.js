import parseOBJ from './parse-obj';

function testOBJFile(text) {
  // There could be comment line first
  return text[0] === 'v';
}

export default {
  name: 'OBJ',
  extension: 'obj',
  testText: testOBJFile,
  parseText: parseOBJ
};
