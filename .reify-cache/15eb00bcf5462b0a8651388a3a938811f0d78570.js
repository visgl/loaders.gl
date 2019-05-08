"use strict";module.export({writeFile:()=>writeFile,writeFileSync:()=>writeFileSync});var fs;module.link('fs',{default(v){fs=v}},0);var promisify;module.link('util',{promisify(v){promisify=v}},1);var toBuffer;module.link('./utils/to-buffer.node',{default(v){toBuffer=v}},2);



function writeFile(filePath, arrayBufferOrString) {
  return promisify(fs.writeFile)(`${filePath}`, toBuffer(arrayBufferOrString), {flag: 'w'});
}

function writeFileSync(filePath, arrayBufferOrString) {
  return fs.writeFileSync(`${filePath}`, toBuffer(arrayBufferOrString), {flag: 'w'});
}
