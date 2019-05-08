"use strict";var loadOBJ;module.link('./load-obj',{default(v){loadOBJ=v}},0);

function testOBJFile(text) {
  // There could be comment line first
  return text[0] === 'v';
}

module.exportDefault({
  name: 'OBJ',
  extensions: ['obj'],
  testText: testOBJFile,
  parseTextSync: loadOBJ
});
