"use strict";module.export({save:()=>save,saveSync:()=>saveSync});var encode,encodeSync;module.link('./encode',{encode(v){encode=v},encodeSync(v){encodeSync=v}},0);var writeFile,writeFileSync;module.link('./fetch/write-file',{writeFile(v){writeFile=v},writeFileSync(v){writeFileSync=v}},1);


function save(data, url, writer) {
  const encodedData = encode(data, writer, url);
  return writeFile(url, encodedData);
}

function saveSync(data, url, writer) {
  const encodedData = encodeSync(data, writer, url);
  return writeFileSync(url, encodedData);
}
