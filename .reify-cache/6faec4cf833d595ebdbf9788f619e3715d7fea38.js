"use strict";module.export({readFileSync:()=>readFileSync});var isBrowser;module.link('../../utils/globals',{isBrowser(v){isBrowser=v}},0);var node;module.link('../../node/read-file-sync.node',{"*"(v){node=v}},1);var resolvePath;module.link('./file-aliases',{resolvePath(v){resolvePath=v}},2);var readFileSyncBrowser;module.link('./read-file-browser',{readFileSyncBrowser(v){readFileSyncBrowser=v}},3);




// In a few cases (data URIs, node.js) "files" can be read synchronously
function readFileSync(url, options = {}) {
  url = resolvePath(url);
  if (!isBrowser && node.readFileSync) {
    return node.readFileSync(url, options);
  }
  return readFileSyncBrowser(url, options);
}
