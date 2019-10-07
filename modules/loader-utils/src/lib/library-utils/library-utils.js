/* global fetch, document */
import {isBrowser, isWorker} from '../env-utils/globals';

const loadedLibraries = {}; // promises

// Loads a library
// wasm library: Array buffer is returned
// js library - script element is created and installed on document
export async function loadLibrary(libraryUrl, options, context, loader) {
  if (!loadedLibraries[libraryUrl]) {
    // libraryUrl = `${options.draco.libraryPath}${libraryUrl}`;
    // const {fetch} = context;
    loadedLibraries[libraryUrl] = loadSingleLibrary(libraryUrl);
  }
  return await loadedLibraries[libraryUrl];
}

async function loadSingleLibrary(libraryUrl) {
  if (typeof document === 'undefined' || !document.createElement) {
    // TODO - How to load in Node.js without trigger webpack bundling frenzy?
  }

  const response = await fetch(libraryUrl);

  // TODO - 'context' should alreay contain 'extension', 'baseName' etc
  if (libraryUrl.endsWith('wasm')) {
    return await response.arrayBuffer();
  }

  const scriptSource = await response.text();
  return createScript(scriptSource, libraryUrl);
}

function createScript(scriptSource, id) {
  if (!isBrowser || isWorker) {
    eval(scriptSource); // eslint-disable-line no-eval
    return;
  }

  const script = document.createElement('script');
  script.id = id;
  // most browsers like the first method but some throw an error. The second method covers those.
  try {
    script.appendChild(document.createTextNode(scriptSource));
  } catch (e) {
    script.text = scriptSource;
  }
  document.body.appendChild(script);
}

// TODO - blueprint for injection into worker...
/*
function combineWorkerWithLibrary(worker, jsContent) {
  var fn = wWorker.toString();
  var body = [
    '// injected',
    jsContent,
    '',
    '// worker',
    fn.substring(fn.indexOf('{') + 1, fn.lastIndexOf('}'))
  ].join('\n');
  this.workerSourceURL = URL.createObjectURL(new Blob([body]));
}
*/
