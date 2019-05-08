"use strict";var parsePCD;module.link('./parse-pcd',{default(v){parsePCD=v}},0);

module.exportDefault({
  name: 'PCD',
  extensions: ['pcd'],
  parseSync: parsePCD
});
