"use strict";module.export({fetchFile:()=>fetchFile});var resolvePath;module.link('./file-aliases',{resolvePath(v){resolvePath=v}},0);/* global fetch */


// As fetch but respects pathPrefix and file aliases
// Reads file data from:
// * data urls
// * http/http urls
// * File/Blob objects (TBA)
async function fetchFile(url, options) {
  url = resolvePath(url);
  // TODO - SUPPORT reading from `File` objects
  // if (typeof File !== 'undefined' && uri instanceof File) {
  //   readFileObject(uri, options);
  // }
  return fetch(url, options);
}
